from django.db import models
import uuid
# Create your models here.
class Customer(models.Model):
    phone = models.CharField(max_length=10, unique=True)
    points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.phone

class Purchase(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    points_earned = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    items = models.CharField(max_length=300, blank=True)    

    def __str__(self):
        return f"{self.customer.phone} - ₹{self.amount}"


class School(models.Model):
    name = models.CharField(max_length=150)
    area = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    school = models.ForeignKey(
        School, null=True, blank=True, on_delete=models.CASCADE,
        related_name='products',
        help_text="Khali chhodo to sab schools ke liye (jaise socks, bag)")
    name = models.CharField(max_length=100)
    class_group = models.CharField(max_length=50, blank=True)
    sizes = models.CharField(max_length=150, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    in_stock = models.BooleanField(default=True)
    image = models.ImageField(upload_to='products/', blank=True)    

    def __str__(self):
        school = self.school.name if self.school else "All schools"
        return f"{school} - {self.name} {self.class_group} Rs{self.price}"


class PurchaseItem(models.Model):
    # purchase = models.ForeignKey('Purchase', on_delete=models.CASCADE, related_name='items')
    purchase = models.ForeignKey('Purchase', on_delete=models.CASCADE, related_name='line_items')    
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=200)
    size = models.CharField(max_length=20, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    @property
    def line_total(self):
        return self.price * self.quantity    

class Order(models.Model):
    PAYMENT = [('COD', 'Cash on Delivery'), ('UPI', 'UPI')]
    STATUS = [('new', 'New'), ('confirmed', 'Confirmed'),
              ('delivered', 'Delivered'), ('cancelled', 'Cancelled')]

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    first_name = models.CharField(max_length=60)
    last_name = models.CharField(max_length=60, blank=True)
    phone = models.CharField(max_length=10)
    address = models.TextField(max_length=300)
    payment_method = models.CharField(max_length=3, choices=PAYMENT)
    paid = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS, default='new')
    total = models.DecimalField(max_digits=9, decimal_places=2)
    points_given = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def bill_no(self):
        return f"SKU-{self.id:05d}"

    def __str__(self):
        return f"{self.bill_no} - {self.full_name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=100)
    school = models.CharField(max_length=150, blank=True)
    class_group = models.CharField(max_length=50, blank=True)
    size = models.CharField(max_length=20, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    @property
    def line_total(self):
        return self.price * self.quantity    