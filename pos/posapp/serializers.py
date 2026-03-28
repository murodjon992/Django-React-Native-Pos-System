from rest_framework import serializers
from .models import Product, AccessoryInventory, Category,Customer,DebtLog,StocLog


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    stock_count = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = Product
        fields = ["id", "name","sale_price", "barcode", "stock_count","category_name"]

    def get_stock_count(self, obj):
        # AccessoryInventory'dan miqdorni olamiz
        try:
            return obj.accessoryinventory.quantity
        except:
            return 0  # Agar hali omborga kiritilmagan bo'lsa 0 qaytaramiz


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    category_name = serializers.ReadOnlyField(source='product.category.name')
    barcode = serializers.ReadOnlyField(source='product.barcode')
    sale_price = serializers.ReadOnlyField(source='product.sale_price')
    class Meta:
        model = AccessoryInventory
        fields = ["id", "product_name",  "category_name", "barcode", "sale_price", "quantity","updated_at" ]

class NasiyaSaleSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=200)
    customer_phone = serializers.CharField(max_length=20, required=False, default="")
    items = serializers.ListField(
        child=serializers.DictField()
    )

class DebtLogSerializer(serializers.ModelSerializer):
    formatted_date = serializers.DateTimeField(source='created_at', format="%d %b %Y, %H:%M")

    class Meta:
        model = DebtLog
        fields = ['amount', 'type', 'note', 'formatted_date']

class CustomerSerializer(serializers.ModelSerializer):
    history = DebtLogSerializer(source='logs', many=True, read_only=True)
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'total_debt','history']

class DailySummarySerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = StocLog
        fields = ['id', 'product_name', 'quantity', 'price_at_time', 'total_price', 'payment_method', 'created_at']

    def get_total_price(self, obj):
        return obj.quantity * obj.price_at_time