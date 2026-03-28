from django.urls import path

from .models import DebtLog
from .views import get_product_by_barcode, sell_product, add_stock,product_search,inventory_view,nasiya_sale,get_debtors,pay_debt,daily_summary,generate_product_barcodes_pdf

urlpatterns = [

    path("product/search", product_search),
    path("product/<str:barcode>/", get_product_by_barcode),

    path("sale/", sell_product),

    path("stock/add/", add_stock),
    path("inventory/",inventory_view),
    path("nasiya-sale/",nasiya_sale),
    path("debtors/",get_debtors),
    path('pay-debt/', pay_debt),
    path("daily-summary/", daily_summary),
    path("print-barcodes/", generate_product_barcodes_pdf),

]