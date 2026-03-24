from django.shortcuts import render
from django.template.context_processors import request
from rest_framework.decorators import api_view
from django.db import transaction
from decimal import Decimal
from rest_framework.response import Response
from .models import Product, AccessoryInventory, StocLog, Customer,DebtLog
from .serializers import ProductSerializer, InventorySerializer,NasiyaSaleSerializer,CustomerSerializer
from django.db.models import Q
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
    items = request.data.get("items",[])

    if not items:
        return Response({"error": "No items found"}, status=400)

    try:

        for item in items:
            barcode = item.get("barcode")
            quantity = int(item.get("quantity", 0))

            if not barcode:
                return Response({"error": "Shtrix-kod kelmadi"}, status=400)

            product = Product.objects.get(barcode=barcode)
            inventory = AccessoryInventory.objects.get(product=product)

            if int(inventory.quantity) < quantity:
                # Agar bitta mahsulot yetmasa, darhol xato qaytaramiz
                return Response({"error": f"{product.name} omborda yetarli emas (Mavjud: {inventory.quantity})"},
                                status=400)
        for item in items:
            barcode = item.get("barcode")
            quantity = int(item.get("quantity"))

            if not barcode:
                continue

            product = Product.objects.get(barcode=barcode)
            inventory = AccessoryInventory.objects.get(product=product)

            inventory.quantity -= quantity
            inventory.save()

            StocLog.objects.create(
                 product=product,
                 quantity=quantity,
                 action="sale"
                )
        return Response({"message": "Sale successful"},status=201)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)
    except Exception as e:
        print(f"xatolik: {e}")
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

    status = request.query_params.get("status")
    if status == "out":
        inventory = inventory.filter(Q(quantity=0) | Q(quantity__isnull=0))
    elif status == "low":
        inventory = inventory.filter(quantity__gt=0,quantity__lte=10)

    serializer = InventorySerializer(inventory, many=True)
    return Response(serializer.data)


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

                    # Mahsulot nomi va miqdorini ro'yxatga qo'shish
                    purchased_items_list.append(f"{product.name} ({qty} dona)")

                    # 4. Sotuv tarixiga yozish (StocLog)
                    StocLog.objects.create(
                        product=product,
                        quantity=qty,
                        action="sale",
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