from django.db import models


# Create your models here.


class Customer(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=200, unique=True)
    total_debt = models.DecimalField(max_digits=12, decimal_places=2,default=0)

    def __str__(self):
        return f"{self.name} - {self.total_debt} so'm"

class DebtLog(models.Model):
    TYPES = (('borrow', 'Qarz Berish'),('pay', 'Qarz qaytarish'))
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='logs')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(choices=TYPES, max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.customer.name}: {self.type} - {self.amount}"

class Category(models.Model):
    name = models.CharField(max_length=200)
    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200)
    barcode = models.CharField(max_length=200, unique=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class AccessoryInventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.product.name


class StocLog(models.Model):
    ACTION = (
        ("add", "Add"),
        ("sale", "Sale"),
        ("return", "Return"),
    )
    PAYMENT_METHODS = (
        ('cash', 'Naqd'),
        ('card', 'Plastik'),
        ('debt', 'Nasiya'),
        ('none', 'Noma’lum/Ombor'),  # Add yoki Return amallari uchun
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price_at_time = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    action = models.CharField(choices=ACTION, max_length=10)
    payment_method = models.CharField(choices=PAYMENT_METHODS, max_length=10, default='none')
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.product.name} - {self.action} ({self.payment_method})"

