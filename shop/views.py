import json
import os
from decimal import Decimal, InvalidOperation
from io import BytesIO
from urllib.parse import quote
from xml.sax.saxutils import escape

import requests
from django import forms
from django.conf import settings
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.core.cache import cache
from django.db import transaction
from django.db.models import F, Sum, Count, Max
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import Customer, Order, OrderItem, Product, Purchase, School

ALLOWED_ITEMS = ["Shirt", "Dress", "Trouser", "Tie", "Belt", "Shoes",
                 "Socks", "School Bag", "Tiffin", "Bottle", "Other"]
MAX_AMOUNT = Decimal("500000")
POINTS_GOAL = 1000


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------

def get_points(amount):
    """Purchase amount ke hisaab se points. (Rule badlo to home.html wale
    JS/text mein bhi badalna)"""
    if amount <= 100:
        return 20
    elif amount <= 200:
        return 45
    elif amount <= 500:
        return 100
    return 150


def money(value):
    """Decimal ko saaf dikhao: 500.00 -> 500, 499.50 -> 499.5"""
    return format(Decimal(value).normalize(), "f")


def parse_amount(raw):
    """Sahi amount (Decimal) ya None."""
    try:
        amt = Decimal(str(raw).strip())
    except (InvalidOperation, ValueError):
        return None
    if not amt.is_finite() or amt <= 0 or amt > MAX_AMOUNT:
        return None
    return amt.quantize(Decimal("0.01"))


def client_ip(request):
    fwd = request.META.get("HTTP_X_FORWARDED_FOR")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def too_many(request, name, limit, seconds):
    """Halka rate limit (spam rokne ke liye). True = limit paar ho gayi."""
    key = f"rl:{name}:{client_ip(request)}"
    if cache.add(key, 1, seconds):
        return False
    try:
        return cache.incr(key) > limit
    except ValueError:
        cache.set(key, 1, seconds)
        return False


def send_whatsapp(phone, amount, pts, total, remaining):
    """WhatsApp Cloud API se template message. Keys na hon to chupchap skip."""
    token = os.environ.get("WA_TOKEN")
    phone_id = os.environ.get("WA_PHONE_ID")
    if not token or not phone_id:
        return False

    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": f"91{phone}",
        "type": "template",
        "template": {
            "name": "points_update",
            "language": {"code": "en"},
            "components": [{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": money(amount)},
                    {"type": "text", "text": str(pts)},
                    {"type": "text", "text": str(total)},
                    {"type": "text", "text": str(remaining)},
                ],
            }],
        },
    }
    try:
        r = requests.post(url, json=payload,
                          headers={"Authorization": f"Bearer {token}"}, timeout=5)
        return r.ok
    except requests.RequestException:
        return False


def award_points(customer, amount, items_text=""):
    """Points jodo + Purchase record banao (ek saath, safe tareeke se)."""
    pts = get_points(amount)
    with transaction.atomic():
        Customer.objects.filter(pk=customer.pk).update(points=F("points") + pts)
        customer.refresh_from_db()
        Purchase.objects.create(customer=customer, amount=amount,
                                points_earned=pts, items=items_text[:300])
    return pts


# ----------------------------------------------------------------------
# PUBLIC (customer ke liye)
# ----------------------------------------------------------------------

def home(request):
    def pack(p):
        return {
            "id": p.id,
            "name": p.name,
            "cls": p.class_group,
            "sizes": p.sizes,
            "price": float(p.price),
            "image": p.image.url if p.image else "",
        }

    schools = []
    for s in School.objects.prefetch_related("products"):
        schools.append({
            "name": s.name,
            "area": s.area,
            "products": [pack(p) for p in s.products.all() if p.in_stock],
        })
    common = [pack(p) for p in Product.objects.filter(school__isnull=True, in_stock=True)]
    return render(request, "shop/home.html", {"schools": schools, "common": common})


def register(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Galat request."}, status=405)
    if too_many(request, "register", 30, 3600):
        return JsonResponse({"success": False,
                             "message": "Bahut zyada koshish hui, thodi der baad try karo."},
                            status=429)
    phone = request.POST.get("phone", "").strip()
    if not (phone.isdigit() and len(phone) == 10):
        return JsonResponse({"success": False, "message": "Phone number galat hai!"})
    customer, created = Customer.objects.get_or_create(phone=phone)
    return JsonResponse({
        "success": True,
        "points": customer.points,
        "message": "Register ho gaye!" if created else "Welcome back!",
        "new": created,
    })


def place_order(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Galat request."}, status=405)
    if too_many(request, "order", 8, 3600):
        return JsonResponse({"success": False,
                             "message": "Bahut zyada orders hue, thodi der baad try karo."},
                            status=429)
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"success": False, "message": "Galat data."}, status=400)
    if not isinstance(data, dict):
        return JsonResponse({"success": False, "message": "Galat data."}, status=400)

    def bad(msg):
        return JsonResponse({"success": False, "message": msg})

    first = str(data.get("first_name", "")).strip()[:60]
    last = str(data.get("last_name", "")).strip()[:60]
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()[:300]
    pay = data.get("payment")

    if not first:
        return bad("First name likho.")
    if not (phone.isdigit() and len(phone) == 10):
        return bad("10 digit ka phone number likho.")
    if len(address) < 10:
        return bad("Poora address likho.")
    if pay not in ("COD", "UPI"):
        return bad("Payment ka tareeka chuno.")

    cart = data.get("cart")
    if not isinstance(cart, list):
        return bad("Cart khali hai.")

    lines, total = [], Decimal("0")
    for c in cart[:30]:
        if not isinstance(c, dict):
            continue
        try:
            pid, qty = int(c.get("id")), int(c.get("qty"))
        except (TypeError, ValueError):
            continue
        if not 1 <= qty <= 20:
            continue
        # Price hamesha database se, browser ke bheje price par bharosa nahi
        p = Product.objects.filter(id=pid, in_stock=True).select_related("school").first()
        if not p:
            continue
        lines.append((p, str(c.get("size", ""))[:20], qty))
        total += p.price * qty
    if not lines:
        return bad("Cart khali hai ya items available nahi hain.")

    with transaction.atomic():
        order = Order.objects.create(
            first_name=first, last_name=last, phone=phone, address=address,
            payment_method=pay, total=total)
        OrderItem.objects.bulk_create([
            OrderItem(order=order, product=p, name=p.name,
                      school=p.school.name if p.school else "All schools",
                      class_group=p.class_group, size=size, quantity=qty, price=p.price)
            for p, size, qty in lines])
    return JsonResponse({"success": True, "bill_url": reverse("bill", args=[order.token])})


def bill(request, token):
    order = get_object_or_404(Order, token=token)
    shop = settings.SHOP_INFO
    upi_link = ""
    if order.payment_method == "UPI" and not order.paid and shop.get("upi_id"):
        upi_link = (f"upi://pay?pa={shop['upi_id']}&pn={quote(shop['name'])}"
                    f"&am={order.total}&cu=INR&tn={order.bill_no}")
    wa_text = f"Namaste, maine order kiya hai. Bill: {request.build_absolute_uri()}"
    return render(request, "shop/bill.html", {
        "order": order, "shop": shop, "upi_link": upi_link,
        "wa_link": f"https://wa.me/{shop['whatsapp']}?text={quote(wa_text)}",
    })


def bill_pdf(request, token):
    order = get_object_or_404(Order, token=token)
    shop = settings.SHOP_INFO
    st = getSampleStyleSheet()
    when = timezone.localtime(order.created_at).strftime("%d-%m-%Y %I:%M %p")
    els = [
        Paragraph(escape(shop["name"]), st["Title"]),
        Paragraph(escape(f"{shop['address']} | {shop['phone']}"), st["Normal"]),
        Spacer(1, 10),
        Paragraph(f"<b>Bill No:</b> {order.bill_no} &nbsp;&nbsp; <b>Date:</b> {when}", st["Normal"]),
        Paragraph(f"<b>Customer:</b> {escape(order.full_name)} | {order.phone}", st["Normal"]),
        Paragraph(f"<b>Address:</b> {escape(order.address)}", st["Normal"]),
        Paragraph(f"<b>Payment:</b> {order.get_payment_method_display()} - "
                  f"{'Paid' if order.paid else 'Pending'}", st["Normal"]),
        Spacer(1, 12),
    ]
    data = [["#", "Item", "Size", "Qty", "Price", "Total"]]
    for n, l in enumerate(order.lines.all(), 1):
        label = f"{l.name} ({l.school}{', ' + l.class_group if l.class_group else ''})"
        data.append([n, Paragraph(escape(label), st["Normal"]), l.size or "-",
                     l.quantity, f"Rs {money(l.price)}", f"Rs {money(l.line_total)}"])
    data.append(["", "", "", "", "Total", f"Rs {money(order.total)}"])
    t = Table(data, colWidths=[24, 220, 50, 36, 62, 70])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    els.append(t)
    buf = BytesIO()
    SimpleDocTemplate(buf, pagesize=A4).build(els)
    resp = HttpResponse(buf.getvalue(), content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="{order.bill_no}.pdf"'
    return resp


# ----------------------------------------------------------------------
# OWNER / STAFF (sirf staff login ke baad)
# ----------------------------------------------------------------------

@staff_member_required
def dashboard(request):
    today = timezone.localdate()
    return render(request, "shop/dashboard.html", {
        "customers": Customer.objects.count(),
        "new_orders": Order.objects.filter(status="new").count(),
        "today_sales": Purchase.objects.filter(created_at__date=today)
                                       .aggregate(t=Sum("amount"))["t"] or 0,
    })


@staff_member_required
def staff(request):
    return render(request, "shop/staff.html")


@staff_member_required
def search_customers(request):
    q = request.GET.get("q", "").strip()
    customers = Customer.objects.filter(phone__startswith=q)[:8] if q.isdigit() else []
    return JsonResponse({"results": [{"phone": c.phone, "points": c.points} for c in customers]})


@staff_member_required
def add_purchase(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Galat request."}, status=405)

    phone = request.POST.get("phone", "").strip()
    amount = parse_amount(request.POST.get("amount", ""))
    if amount is None:
        return JsonResponse({"success": False, "message": "Amount galat hai!"})

    try:
        customer = Customer.objects.get(phone=phone)
    except Customer.DoesNotExist:
        return JsonResponse({"success": False, "message": "Customer register nahi hai!"})

    chosen = []
    for i in request.POST.get("items", "").split(","):
        i = i.strip()
        if i in ALLOWED_ITEMS and i not in chosen:
            chosen.append(i)
    items_text = ", ".join(chosen)

    pts = award_points(customer, amount, items_text)
    remaining = max(POINTS_GOAL - customer.points, 0)

    lines = [
        "🙏 Namaste! Thank you for visiting *Shree Krishan Uniform* 😊\n",
        f"🛍️ Aaj ki purchase (amount): *₹{money(amount)}*",
    ]
    if items_text:
        lines.append(f"🧾 Kya kharida: *{items_text}*")
    lines += [
        f"🎁 Points earned today: *{pts}*",
        f"⭐ Total points: *{customer.points}*",
        f"🎯 Discount ke liye baaki (remaining): *{remaining}* points\n",
        "Phir aaiyega! 🏫",
    ]
    msg = "\n".join(lines)
    link = f"https://api.whatsapp.com/send?phone=91{customer.phone}&text={quote(msg, safe='')}"

    sent = send_whatsapp(customer.phone, amount, pts, customer.points, remaining)

    done = f"₹{money(amount)} ki purchase, {pts} points mile!"
    if items_text:
        done += f" ({items_text})"
    return JsonResponse({
        "success": True,
        "points_earned": pts,
        "total_points": customer.points,
        "message": done,
        "whatsapp_link": link,
        "whatsapp_sent": sent,
    })


@staff_member_required
def history(request, phone):
    customer = get_object_or_404(Customer, phone=phone)
    purchases = customer.purchase_set.order_by("-created_at")
    total_spent = purchases.aggregate(total=Sum("amount"))["total"] or 0
    return render(request, "shop/history.html", {
        "customer": customer,
        "purchases": purchases,
        "total_spent": total_spent,
        "orders": Order.objects.filter(phone=phone).prefetch_related("lines"),
    })


@staff_member_required
def history_pdf(request, phone):
    customer = get_object_or_404(Customer, phone=phone)
    purchases = customer.purchase_set.order_by("-created_at")
    total_spent = purchases.aggregate(total=Sum("amount"))["total"] or 0

    styles = getSampleStyleSheet()
    elements = [
        Paragraph("Shree Krishan Uniform", styles["Title"]),
        Paragraph("Purchase History", styles["Heading2"]),
        Paragraph(f"Phone: {customer.phone}", styles["Normal"]),
        Paragraph(f"Total points: {customer.points}", styles["Normal"]),
        Paragraph(f"Total spent: Rs {money(total_spent)}", styles["Normal"]),
        Spacer(1, 14),
    ]

    data = [["Date", "Items", "Amount (Rs)", "Points"]]
    for p in purchases:
        when = timezone.localtime(p.created_at).strftime("%d-%m-%Y %I:%M %p")
        data.append([when, Paragraph(escape(p.items or "-"), styles["Normal"]),
                     money(p.amount), str(p.points_earned)])

    table = Table(data, colWidths=[110, 190, 80, 60])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
    ]))
    elements.append(table)

    buf = BytesIO()
    SimpleDocTemplate(buf, pagesize=A4).build(elements)
    response = HttpResponse(buf.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="history_{customer.phone}.pdf"'
    return response


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ["school", "name", "class_group", "sizes", "price", "image"]

    def clean_image(self):
        img = self.cleaned_data.get("image")
        if img and img.size > 5 * 1024 * 1024:
            raise forms.ValidationError("Photo 5 MB se chhoti honi chahiye.")
        return img


@staff_member_required
def manage(request):
    if request.method == "POST":
        action = request.POST.get("action")

        if action == "add_school":
            name = request.POST.get("name", "").strip()
            area = request.POST.get("area", "").strip()
            if not name:
                messages.error(request, "School ka naam likho.")
            elif School.objects.filter(name__iexact=name).exists():
                messages.error(request, "Ye school pehle se list mein hai.")
            else:
                School.objects.create(name=name, area=area)
                messages.success(request, f"{name} add ho gaya.")

        elif action == "add_product":
            form = ProductForm(request.POST, request.FILES)
            if form.is_valid():
                form.save()
                messages.success(request, "Dress add ho gayi.")
            else:
                for field, errs in form.errors.items():
                    for e in errs:
                        messages.error(request, f"{field}: {e}")

        elif action == "delete_product":
            pid = request.POST.get("product_id", "")
            if pid.isdigit():
                Product.objects.filter(id=pid).delete()
                messages.success(request, "Item hata diya.")

        return redirect("manage")

    return render(request, "shop/manage.html", {
        "schools": School.objects.prefetch_related("products"),
        "common": Product.objects.filter(school__isnull=True),
    })


@staff_member_required
def orders(request):
    if request.method == "POST":
        oid = request.POST.get("order_id", "")
        with transaction.atomic():
            order = Order.objects.select_for_update().filter(id=oid).first() if oid.isdigit() else None
            if order:
                status = request.POST.get("status")
                if status in dict(Order.STATUS):
                    order.status = status
                if request.POST.get("paid") in ("0", "1"):
                    order.paid = request.POST.get("paid") == "1"
                order.save()

                if order.status == "delivered" and not order.points_given:
                    customer, _ = Customer.objects.get_or_create(phone=order.phone)
                    items = ", ".join(f"{l.name} x{l.quantity}" for l in order.lines.all())
                    award_points(customer, order.total, items)
                    order.points_given = True
                    order.save(update_fields=["points_given"])
                    messages.success(request, f"{order.bill_no} delivered, points add ho gaye.")
                else:
                    messages.success(request, f"{order.bill_no} update ho gaya.")
        return redirect("orders")

    return render(request, "shop/orders.html", {
        "orders": Order.objects.prefetch_related("lines")[:100]})


@staff_member_required
def customers(request):
    q = request.GET.get("q", "").strip()
    qs = Customer.objects.annotate(
        visits=Count("purchase"), last_visit=Max("purchase__created_at")
    ).order_by("-points")
    if q.isdigit():
        qs = qs.filter(phone__contains=q)
    return render(request, "shop/customers.html", {
        "customers": qs[:200], "q": q, "total": Customer.objects.count()})