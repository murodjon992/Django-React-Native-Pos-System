from django.utils import timezone
from django.db.models import Sum
from rest_framework.decorators import api_view
from django.db import transaction
from decimal import Decimal
from rest_framework.response import Response
from .models import Product, AccessoryInventory, StocLog, Customer,DebtLog
from .serializers import ProductSerializer, InventorySerializer,NasiyaSaleSerializer,CustomerSerializer,DailySummarySerializer
from django.db.models import Q
from PIL import Image as PILImage
from django.http import HttpResponse
import barcode
from barcode.writer import ImageWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import io
import os
from django.conf import settings
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Font fayllari yo'lini ko'rsatamiz
FONT_REG = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'Montserrat-Regular.ttf')
FONT_BOLD = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'Montserrat-Bold.ttf')

# Fontlarni ro'yxatdan o'tkazamiz
pdfmetrics.registerFont(TTFont('Montserrat', FONT_REG))
pdfmetrics.registerFont(TTFont('Montserrat-Bold', FONT_BOLD))

@api_view(["GET"])
def get_product_by_barcode(request, barcode):
    try:
        product = Product.objects.get(barcode=barcode)

        data = {
            "id": product.id,
            "name": product.name,
            "price": product.sale_price
        }

        return Response(data)

    except Product.DoesNotExist:
        return Response({"error": "Product not found"})

@api_view(["POST"])
def sell_product(request):
    items = request.data.get("items", [])
    method = request.data.get("payment_method", "cash") # cash, card yoki debt
    customer_id = request.data.get("customer_id")

    try:
        with transaction.atomic():
            for item in items:
                product = Product.objects.get(barcode=item['barcode'])
                qty = int(item['quantity'])
                inventory = AccessoryInventory.objects.get(product=product)

                if inventory.quantity < qty:
                    return Response({"error": f"{product.name} yetarli emas! {inventory.quantity}ta qolgan"}, status=400)

                inventory.quantity -= qty
                inventory.save()

                # notififcation:
                warning = None
                if inventory.quantity <= 0:
                    warning = f"{product.name} TUGADI!"
                elif inventory.quantity <= 10:
                    warning = f"{product.name} kam qoldi ({inventory.quantity} ta)!"

                return Response({
                    "status": "success",
                    "warning": warning  # React Native buni o'sha zahoti ko'rsatadi
                }, status=201)

                # LOGGA HAMMA MA'LUMOTNI YOZAMIZ
                StocLog.objects.create(
                    product=product,
                    quantity=qty,
                    price_at_time=product.sale_price,
                    action="sale",
                    payment_method=method,
                    note=f"Sotuv. Mijoz ID: {customer_id}" if customer_id else "Oddiy sotuv"
                )
        return Response({"message": "OK"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
def add_stock(request):

    barcode = request.data.get("barcode")
    quantity = int(request.data.get("quantity"))

    product = Product.objects.get(barcode=barcode)

    inventory, created = AccessoryInventory.objects.get_or_create(
        product=product
    )

    inventory.quantity += quantity
    inventory.save()

    # notification:
    warning = None
    if inventory.quantity <= 0:
        warning = f"{product.name} TUGADI!"
    elif inventory.quantity <= 10:
        warning = f"{product.name} kam qoldi ({inventory.quantity} ta)!"

    return Response({
        "status": "success",
        "warning": warning  # React Native buni o'sha zahoti ko'rsatadi
    }, status=201)

    StocLog.objects.create(
        product=product,
        quantity=quantity,
        action="add"
    )

    return Response({"message": "Stock added"})


@api_view(["GET"])
def product_search(request):
    query = request.GET.get("q", "").strip()

    products = Product.objects.filter(
        Q(name__icontains=query) |
        Q(barcode__icontains=query)
    ).order_by('name')[:20]
    # Agar topilmasa, error emas, bo'sh list [] qaytaramiz
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(["GET"])
def inventory_view(request):
    inventory = AccessoryInventory.objects.select_related("product","product__category").all()

    # 1. Nechta mahsulot tugadi va nechta kam qoldi - umumiy hisoblaymiz
    out_of_stock_count = inventory.filter(Q(quantity=0) | Q(quantity__isnull=True)).count()
    low_stock_count = inventory.filter(quantity__gt=0, quantity__lte=10).count()

    status = request.query_params.get("status")
    if status == "out":
        inventory = inventory.filter(Q(quantity=0) | Q(quantity__isnull=0))
    elif status == "low":
        inventory = inventory.filter(quantity__gt=0,quantity__lte=10)

    serializer = InventorySerializer(inventory, many=True)
    # 3. Response ichida qo'shimcha "alerts" ma'lumotlarini qaytaramiz
    return Response({
        "alerts": {
            "out_of_stock": out_of_stock_count,
            "low_stock": low_stock_count,
            "has_warning": out_of_stock_count > 0 or low_stock_count > 0
        },
        "results": serializer.data
    })


@api_view(["POST"])
def nasiya_sale(request):
    serializer = NasiyaSaleSerializer(data=request.data)

    if serializer.is_valid():
        data = serializer.validated_data
        customer_name = data["customer_name"]
        items = data["items"]
        total_bill = Decimal('0')  # Decimal ishlatish xavfsizroq

        purchased_items_list = []  # Mahsulotlarni matn ko'rinishida yig'ish uchun

        try:
            with transaction.atomic():
                # 1. Mijozni topish yoki yaratish
                customer, created = Customer.objects.get_or_create(
                    name=customer_name,
                    defaults={'phone': data.get("customer_phone", "")}
                )

                for item in items:
                    # Barcode orqali mahsulotni topish
                    try:
                        product = Product.objects.get(barcode=item['barcode'])
                    except Product.DoesNotExist:
                        return Response({"error": f"Shtrix-kod topilmadi: {item['barcode']}"}, status=404)

                    qty = int(item['quantity'])

                    # 2. Ombor qoldig'ini tekshirish
                    try:
                        inventory = AccessoryInventory.objects.get(product=product)
                    except AccessoryInventory.DoesNotExist:
                        return Response({"error": f"{product.name} uchun ombor yozuvi topilmadi!"}, status=404)

                    if inventory.quantity < qty:
                        return Response(
                            {"error": f"{product.name} omborda yetarli emas! (Qoldiq: {inventory.quantity})"},
                            status=400)

                    # 3. Ombor qoldig'ini ayirish
                    inventory.quantity -= qty
                    inventory.save()

                    # notification
                    warning = None
                    if inventory.quantity <= 0:
                        warning = f"{product.name} TUGADI!"
                    elif inventory.quantity <= 10:
                        warning = f"{product.name} kam qoldi ({inventory.quantity} ta)!"

                    return Response({
                        "status": "success",
                        "warning": warning  # React Native buni o'sha zahoti ko'rsatadi
                    }, status=201)


                    # Mahsulot nomi va miqdorini ro'yxatga qo'shish
                    purchased_items_list.append(f"{product.name} ({qty} dona)")

                    StocLog.objects.create(
                        product=product,
                        quantity=qty,
                        price_at_time=product.sale_price,  # <-- NARXNI QO'SHISH SHART!
                        action="sale",
                        payment_method="debt",  # <-- TO'LOV TURINI 'debt' QILISH SHART!
                        note=f"Nasiya savdo: {customer_name}"
                    )

                    # Narxni hisoblash (Decimal field bo'lgani uchun Decimal ishlatamiz)
                    total_bill += (Decimal(str(product.sale_price)) * qty)

                # Mahsulotlarni bitta chiroyli qatorga aylantiramiz
                # Masalan: "Samsung A20 (1 dona), Oyna (2 dona)"
                note_text = ", ".join(purchased_items_list)

                # 5. Mijozning umumiy qarzini yangilash
                customer.total_debt += total_bill
                customer.save()

                # 6. Qarz tarixiga (DebtLog) MAHSULOTLAR bilan yozish
                DebtLog.objects.create(
                    customer=customer,
                    amount=total_bill,
                    type='borrow',
                    note=f"Sotuv: {note_text}"  # Endi bu yerda hamma tovarlar ko'rinadi
                )

                return Response({
                    "message": "Nasiya savdo muvaffaqiyatli saqlandi",
                    "total_debt": float(customer.total_debt),
                    "items_sold": note_text
                }, status=201)

        except Exception as e:
            # Xatoni terminalda ham ko'rish uchun
            print(f"Xatolik: {str(e)}")
            return Response({"error": f"Tizimda xatolik: {str(e)}"}, status=500)

    return Response(serializer.errors, status=400)


@api_view(["GET"])
def get_debtors(request):
    # Faqat qarzi bor mijozlarni chiqaramiz
    debtors = Customer.objects.filter(total_debt__gt=0).order_by('-total_debt')
    # Bu yerda CustomerSerializer ishlatiladi
    serializer = CustomerSerializer(debtors, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def pay_debt(request):
    customer_id = request.data.get("customer_id")
    try:
        amount = Decimal(str(request.data.get("amount", 0)))
    except (ValueError, TypeError):
        return Response({"error": "Summa noto'g'ri kiritildi"}, status=400)

    if not customer_id or amount <= 0:
        return Response({"error": "Noto'g'ri ma'lumot yuborildi"}, status=400)

    try:
        with transaction.atomic():
            customer = Customer.objects.get(id=customer_id)

            # Qarzni kamaytiramiz
            customer.total_debt -= amount
            customer.save()

            # Tarixda qolishi uchun DebtLog yaratamiz
            DebtLog.objects.create(
                customer=customer,
                amount=amount,
                type='pay',
                note="Qarz qaytarildi (to'lov)"
            )

            return Response({
                "message": "To'lov qabul qilindi",
                "remaining_debt": customer.total_debt
            })
    except Customer.DoesNotExist:
        return Response({"error": "Mijoz topilmadi"}, status=404)


@api_view(['GET'])
def daily_summary(request):
    today = timezone.now().date()

    # StocLog dan naqd va plastikni olamiz
    sales_qs = StocLog.objects.filter(action="sale", created_at__date=today)

    cash_total = sum(item.quantity * item.price_at_time for item in sales_qs.filter(payment_method='cash'))
    card_total = sum(item.quantity * item.price_at_time for item in sales_qs.filter(payment_method='card'))

    # Nasiyani esa to'g'ridan-to'g'ri DebtLog dan olsak ham bo'ladi (aniqroq chiqadi)
    debt_total = DebtLog.objects.filter(
        type='borrow',
        created_at__date=today
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    grand_total = float(cash_total) + float(card_total) + float(debt_total)

    return Response({
        "date": today,
        "grand_total": grand_total,
        "details": {
            "cash": cash_total,
            "card": card_total,
            "debt": debt_total
        },
        "items_count": sales_qs.count()
    })


def generate_product_barcodes_pdf(request):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="barcodes_fixed.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    products = Product.objects.select_related('category').all()

    # SAHIFA SOZLAMALARI
    x_start = 35
    y_offset = height - 80
    columns = 4
    item_width = 140  # Ustunlar orasini biroz kengaytirdik
    item_height = 135  # Qatorlar orasini (110 dan 135 ga) ko'paytirdik (harflar yeyilmasligi uchun)

    x_offset = x_start

    for index, product in enumerate(products):
        # 1. BARKOD SOZLAMALARI (Ostidagi raqam fontini o'zgartirish)
        EAN = barcode.get_barcode_class('code128')
        # writer_options orqali barkod ostidagi yozuvni sozlaymiz
        options = {
            'font_path': FONT_REG,  # Barkod ostidagi raqam ham Montserrat bo'ladi
            'font_size': 8,
            'text_distance': 3,  # Barkod va raqam orasi
            'module_height': 12.0,  # Barkod balandligi
        }
        ean = EAN(str(product.barcode), writer=ImageWriter())

        buffer = io.BytesIO()
        ean.write(buffer, options=options)
        buffer.seek(0)
        img = PILImage.open(buffer)

        # 2. MAHSULOT NOMI VA KATEGORIYASI
        category_name = f"({product.category.name})" if product.category else ""
        full_name = f"{product.name} {category_name}"

        # 3. CHIZISH (Koordinatalarni masofasini oshirdik)

        # Mahsulot nomi (y_offset + 75 ga ko'tardik, yopishib qolmasligi uchun)
        p.setFont("Montserrat-Bold", 8)
        p.drawString(x_offset, y_offset + 75, full_name[:28])

        # Barkod (y_offset + 15)
        # Rasm balandligini biroz qisqartirdik, harflar bilan to'qnashmasligi uchun
        p.drawInlineImage(img, x_offset, y_offset + 15, width=120, height=55)

        # Narxi (y_offset - 5)
        p.setFont("Montserrat-Bold", 10)  # Narxni biroz kattaroq va qalin qildik
        p.drawString(x_offset + 15, y_offset - 5, f"{product.sale_price} so'm")

        # 4. KEYINGI QADAM
        x_offset += item_width

        if (index + 1) % columns == 0:
            x_offset = x_start
            y_offset -= item_height

        if y_offset < 100:
            p.showPage()
            y_offset = height - 80

    p.save()
    return response