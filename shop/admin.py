from django.contrib import admin

# Register your models here.
# from django.contrib import admin
# from .models import Customer, Purchase

from .models import Customer, Purchase, PurchaseItem, School, Product



# class PurchaseInline(admin.TabularInline):
#     model = Purchase
#     extra = 0
#     readonly_fields = ("amount", "points_earned", "created_at")
#     can_delete = False


# @admin.register(Customer)
# class CustomerAdmin(admin.ModelAdmin):
#     list_display = ("phone", "points", "created_at")
#     search_fields = ("phone",)
#     inlines = [PurchaseInline]


# @admin.register(Purchase)
# class PurchaseAdmin(admin.ModelAdmin):
#     list_display = ("customer", "amount", "points_earned", "created_at")
#     list_filter = ("created_at",)
#     search_fields = ("customer__phone",)



class PurchaseInline(admin.TabularInline):
    model = Purchase
    extra = 0
    readonly_fields = ("amount", "points_earned", "created_at")
    can_delete = False


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("phone", "points", "created_at")
    search_fields = ("phone",)
    inlines = [PurchaseInline]


class PurchaseItemInline(admin.TabularInline):
    model = PurchaseItem
    extra = 0
    readonly_fields = ("name", "size", "quantity", "price")
    can_delete = False


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ("customer", "amount", "points_earned", "created_at")
    list_filter = ("created_at",)
    search_fields = ("customer__phone",)
    inlines = [PurchaseItemInline]


class ProductInline(admin.TabularInline):
    model = Product
    extra = 5


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "area")
    search_fields = ("name", "area")
    inlines = [ProductInline]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "class_group", "sizes", "price", "in_stock")
    list_filter = ("school", "in_stock")
    search_fields = ("name", "school__name")
    list_editable = ("price", "in_stock")