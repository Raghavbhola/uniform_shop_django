from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from .models import Customer, Purchase , School, Product , Order, OrderItem
from django.contrib.auth.decorators import login_required
from urllib.parse import quote

from io import BytesIO

from django.db.models import Sum
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from django import forms
from django.contrib import messages

import os
import requests

import json
from decimal import Decimal
from xml.sax.saxutils import escape
from django.conf import settings
from django.db import transaction
from django.urls import reverse


def send_whatsapp(phone, amount, pts, total, remaining):
    token = os.environ.get('WA_TOKEN')
    phone_id = os.environ.get('WA_PHONE_ID')
    if not token or not phone_id:
        return False  # keys set nahi hain to chupchap skip

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
                    {"type": "text", "text": f"{amount:g}"},
                    {"type": "text", "text": str(pts)},
                    {"type": "text", "text": str(total)},
                    {"type": "text", "text": str(remaining)},
                ],
            }],
        },
    }
    try:
        r = requests.post(url, json=payload,
                          headers={"Authorization": f"Bearer {token}"}, timeout=10)
        return r.ok
    except requests.RequestException:
        return False



# Create your views here.

def get_points(amount):
    if amount <= 100:
        return 20
    elif amount <= 200:
        return 45
    elif amount <= 500:
        return 100
    else:
        return 150

# def home(request):
#     return render(request, 'shop/home.html')

def home(request):
    def pack(p):
        return {
            'name': p.name,
            'cls': p.class_group,
            'sizes': p.sizes,
            'price': float(p.price),
            'image': p.image.url if p.image else '',  
            'id': p.id,                      
        }



    schools = []
    for s in School.objects.prefetch_related('products'):
        schools.append({
            'name': s.name,
            'area': s.area,
            'products': [pack(p) for p in s.products.all() if p.in_stock],
        })
    common = [pack(p) for p in Product.objects.filter(school__isnull=True, in_stock=True)]
    return render(request, 'shop/home.html', {'schools': schools, 'common': common})

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['school', 'name', 'class_group', 'sizes', 'price', 'image']

    def clean_image(self):
        img = self.cleaned_data.get('image')
        if img and img.size > 5 * 1024 * 1024:
            raise forms.ValidationError('Photo 5 MB se chhoti honi chahiye.')
        return img


@login_required
def manage(request):
    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'add_school':
            name = request.POST.get('name', '').strip()
            area = request.POST.get('area', '').strip()
            if not name:
                messages.error(request, 'School ka naam likho.')
            elif School.objects.filter(name__iexact=name).exists():
                messages.error(request, 'Ye school pehle se list mein hai.')
            else:
                School.objects.create(name=name, area=area)
                messages.success(request, f'{name} add ho gaya.')

        elif action == 'add_product':
            form = ProductForm(request.POST, request.FILES)
            if form.is_valid():
                form.save()
                messages.success(request, 'Dress add ho gayi.')
            else:
                for field, errs in form.errors.items():
                    for e in errs:
                        messages.error(request, f'{field}: {e}')

        elif action == 'delete_product':
            pid = request.POST.get('product_id', '')
            if pid.isdigit():
                Product.objects.filter(id=pid).delete()
                messages.success(request, 'Item hata diya.')

        return redirect('manage')

    return render(request, 'shop/manage.html', {
        'schools': School.objects.prefetch_related('products'),
        'common': Product.objects.filter(school__isnull=True),
    })


def register(request):
    if request.method == 'POST':
        phone = request.POST.get('phone')
        if phone and len(phone) == 10:
            customer, created = Customer.objects.get_or_create(phone=phone)
            return JsonResponse({
                'success': True,
                'points': customer.points,
                'message': 'Register ho gaye!' if created else 'Welcome back!',
                'new': created
            })
        return JsonResponse({'success': False, 'message': 'Phone number galat hai!'})

# def add_purchase(request):
#     if request.method == 'POST':
#         phone = request.POST.get('phone')
#         amount = float(request.POST.get('amount', 0))
#         try:
#             customer = Customer.objects.get(phone=phone)
#             pts = get_points(amount)
#             customer.points += pts
#             customer.save()
#             Purchase.objects.create(
#                 customer=customer,
#                 amount=amount,
#                 points_earned=pts
#             )
#             return JsonResponse({
#                 'success': True,
#                 'points_earned': pts,
#                 'total_points': customer.points,
#                 'message': f'₹{amount} ki purchase — {pts} points mile!'
#             })
#         except Customer.DoesNotExist:
#             return JsonResponse({'success': False, 'message': 'Customer register nahi hai!'})


ALLOWED_ITEMS = ["Shirt", "Dress", "Trouser", "Tie", "Belt", "Shoes",
                 "Socks", "School Bag", "Tiffin", "Bottle", "Other"]

@login_required
def add_purchase(request):
    if request.method == 'POST':
        phone = request.POST.get('phone')
        try:
            amount = float(request.POST.get('amount', 0))
        except ValueError:
            return JsonResponse({'success': False, 'message': 'Amount galat hai!'})
        if amount <= 0:
            return JsonResponse({'success': False, 'message': 'Amount 0 se zyada hona chahiye!'})
        try:
            customer = Customer.objects.get(phone=phone)
        except Customer.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Customer register nahi hai!'})

        picked = [i.strip() for i in request.POST.get('items', '').split(',')]
        chosen = []
        for i in picked:
            if i in ALLOWED_ITEMS and i not in chosen:
                chosen.append(i)
        items_text = ", ".join(chosen)

        pts = get_points(amount)
        customer.points += pts
        customer.save()
        Purchase.objects.create(customer=customer, amount=amount,
                                points_earned=pts, items=items_text)

        remaining = max(1000 - customer.points, 0)
        lines = [
            "🙏 Namaste! Thank you for visiting *Shree Krishan Uniform* 😊\n",
            f"🛍️ Today purchase (amount): *₹{amount:g}*",
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

        done = f'₹{amount:g} ki purchase, {pts} points mile!'
        if items_text:
            done += f' ({items_text})'
        return JsonResponse({
            'success': True,
            'points_earned': pts,
            'total_points': customer.points,
            'message': done,
            'whatsapp_link': link,
            'whatsapp_sent': sent,
        })

@login_required
def staff(request):
    return render(request, 'shop/staff.html')    

@login_required
def search_customers(request):
    q = request.GET.get('q', '')
    customers = Customer.objects.filter(phone__startswith=q)[:8] if q else []
    return JsonResponse({'results': [{'phone': c.phone, 'points': c.points} for c in customers]})

@login_required
def history(request, phone):
    customer = get_object_or_404(Customer, phone=phone)
    purchases = customer.purchase_set.order_by('-created_at')
    total_spent = purchases.aggregate(total=Sum('amount'))['total'] or 0
    return render(request, 'shop/history.html', {
        'customer': customer,
        'purchases': purchases,
        'total_spent': total_spent,
        'orders': Order.objects.filter(phone=phone).prefetch_related('lines'),        
    })


@login_required
def history_pdf(request, phone):
    customer = get_object_or_404(Customer, phone=phone)
    purchases = customer.purchase_set.order_by('-created_at')
    total_spent = purchases.aggregate(total=Sum('amount'))['total'] or 0

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("Shree Krishan Uniform", styles['Title']),
        Paragraph("Purchase History", styles['Heading2']),
        Paragraph(f"Phone: {customer.phone}", styles['Normal']),
        Paragraph(f"Total points: {customer.points}", styles['Normal']),
        Paragraph(f"Total spent: Rs {total_spent}", styles['Normal']),
        Spacer(1, 14),
    ]

    # data = [["Date", "Amount (Rs)", "Points earned"]]
    # for p in purchases:
    #     when = timezone.localtime(p.created_at).strftime("%d-%m-%Y %I:%M %p")
    #     data.append([when, str(p.amount), str(p.points_earned)])

    # table = Table(data, colWidths=[200, 120, 120])
    data = [["Date", "Items", "Amount (Rs)", "Points"]]
    for p in purchases:
        when = timezone.localtime(p.created_at).strftime("%d-%m-%Y %I:%M %p")
        data.append([when, Paragraph(p.items or "-", styles['Normal']),
                     str(p.amount), str(p.points_earned)])

    table = Table(data, colWidths=[110, 190, 80, 60])    
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
    ]))
    elements.append(table)
    doc.build(elements)

    response = HttpResponse(buf.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="history_{customer.phone}.pdf"'
    return response

def place_order(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Galat request.'}, status=405)
    try:
        data = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'message': 'Galat data.'}, status=400)

    def bad(m):
        return JsonResponse({'success': False, 'message': m})

    first = str(data.get('first_name', '')).strip()[:60]
    last = str(data.get('last_name', '')).strip()[:60]
    phone = str(data.get('phone', '')).strip()
    address = str(data.get('address', '')).strip()[:300]
    pay = data.get('payment')

    if not first:
        return bad('First name likho.')
    if not (phone.isdigit() and len(phone) == 10):
        return bad('10 digit ka phone number likho.')
    if len(address) < 10:
        return bad('Poora address likho.')
    if pay not in ('COD', 'UPI'):
        return bad('Payment ka tareeka chuno.')

    lines, total = [], Decimal('0')
    for c in (data.get('cart') or [])[:30]:
        if not isinstance(c, dict):
            continue
        try:
            pid, qty = int(c.get('id')), int(c.get('qty'))
        except (TypeError, ValueError):
            continue
        if not 1 <= qty <= 20:
            continue
        p = Product.objects.filter(id=pid, in_stock=True).select_related('school').first()
        if not p:
            continue
        lines.append((p, str(c.get('size', ''))[:20], qty))
        total += p.price * qty
    if not lines:
        return bad('Cart khali hai ya items available nahi hain.')

    with transaction.atomic():
        order = Order.objects.create(
            first_name=first, last_name=last, phone=phone, address=address,
            payment_method=pay, total=total)
        OrderItem.objects.bulk_create([
            OrderItem(order=order, product=p, name=p.name,
                      school=p.school.name if p.school else 'All schools',
                      class_group=p.class_group, size=size, quantity=qty, price=p.price)
            for p, size, qty in lines])
    return JsonResponse({'success': True, 'bill_url': reverse('bill', args=[order.token])})


def bill(request, token):
    order = get_object_or_404(Order, token=token)
    shop = settings.SHOP_INFO
    upi_link = ''
    if order.payment_method == 'UPI' and not order.paid and shop.get('upi_id'):
        upi_link = (f"upi://pay?pa={shop['upi_id']}&pn={quote(shop['name'])}"
                    f"&am={order.total}&cu=INR&tn={order.bill_no}")
    wa_text = f"Namaste, maine order kiya hai. Bill: {request.build_absolute_uri()}"
    return render(request, 'shop/bill.html', {
        'order': order, 'shop': shop, 'upi_link': upi_link,
        'wa_link': f"https://wa.me/{shop['whatsapp']}?text={quote(wa_text)}",
    })


def bill_pdf(request, token):
    order = get_object_or_404(Order, token=token)
    shop = settings.SHOP_INFO
    st = getSampleStyleSheet()
    when = timezone.localtime(order.created_at).strftime("%d-%m-%Y %I:%M %p")
    els = [
        Paragraph(escape(shop['name']), st['Title']),
        Paragraph(escape(f"{shop['address']} | {shop['phone']}"), st['Normal']),
        Spacer(1, 10),
        Paragraph(f"<b>Bill No:</b> {order.bill_no} &nbsp;&nbsp; <b>Date:</b> {when}", st['Normal']),
        Paragraph(f"<b>Customer:</b> {escape(order.full_name)} | {order.phone}", st['Normal']),
        Paragraph(f"<b>Address:</b> {escape(order.address)}", st['Normal']),
        Paragraph(f"<b>Payment:</b> {order.get_payment_method_display()} - "
                  f"{'Paid' if order.paid else 'Pending'}", st['Normal']),
        Spacer(1, 12),
    ]
    data = [["#", "Item", "Size", "Qty", "Price", "Total"]]
    for n, l in enumerate(order.lines.all(), 1):
        label = f"{l.name} ({l.school}{', ' + l.class_group if l.class_group else ''})"
        data.append([n, Paragraph(escape(label), st['Normal']), l.size or '-',
                     l.quantity, f"Rs {l.price:g}", f"Rs {l.line_total:g}"])
    data.append(["", "", "", "", "Total", f"Rs {order.total:g}"])
    t = Table(data, colWidths=[24, 220, 50, 36, 62, 70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    els.append(t)
    buf = BytesIO()
    SimpleDocTemplate(buf, pagesize=A4).build(els)
    resp = HttpResponse(buf.getvalue(), content_type='application/pdf')
    resp['Content-Disposition'] = f'attachment; filename="{order.bill_no}.pdf"'
    return resp


def give_points(order):
    customer, _ = Customer.objects.get_or_create(phone=order.phone)
    pts = get_points(float(order.total))
    customer.points += pts
    customer.save()
    items = ", ".join(f"{l.name} x{l.quantity}" for l in order.lines.all())
    Purchase.objects.create(customer=customer, amount=order.total,
                            points_earned=pts, items=items[:300])
    order.points_given = True
    order.save()


@login_required
def orders(request):
    if request.method == 'POST':
        oid = request.POST.get('order_id', '')
        order = Order.objects.filter(id=oid).first() if oid.isdigit() else None
        if order:
            status = request.POST.get('status')
            if status in dict(Order.STATUS):
                order.status = status
            if request.POST.get('paid') in ('0', '1'):
                order.paid = request.POST.get('paid') == '1'
            order.save()
            if order.status == 'delivered' and not order.points_given:
                give_points(order)
                messages.success(request, f'{order.bill_no} delivered, points add ho gaye.')
            else:
                messages.success(request, f'{order.bill_no} update ho gaya.')
        return redirect('orders')
    return render(request, 'shop/orders.html', {
        'orders': Order.objects.prefetch_related('lines')[:100]})