from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from .models import Customer, Purchase
from django.contrib.auth.decorators import login_required
from urllib.parse import quote

from io import BytesIO

from django.db.models import Sum
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


import os
import requests


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

def home(request):
    return render(request, 'shop/home.html')

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
        pts = get_points(amount)
        customer.points += pts
        customer.save()
        Purchase.objects.create(customer=customer, amount=amount, points_earned=pts)
        remaining = max(1000 - customer.points, 0)
        msg = (
            f"🙏 Namaste! Thank you for visiting *Shree Krishan Uniform* 😊\n\n"
            f"🛍️ Aaj ki purchase (amount): *₹{amount:g}*\n"
            f"🎁 Points Earned today: *{pts}*\n"
            f"⭐ Total points: *{customer.points}*\n"
            f"🎯 Discount ke liye baaki: *{remaining}* points\n\n"
            f"Phir aaiyega! we'd love to see you again! 🏫👕"
        )    
        link = f"https://api.whatsapp.com/send?phone=91{customer.phone}&text={quote(msg, safe='')}"
        return JsonResponse({
            'success': True,
            'points_earned': pts,
            'total_points': customer.points,
            'message': f'₹{amount} ki purchase, {pts} points mile!',
            'whatsapp_link': link,
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

    data = [["Date", "Amount (Rs)", "Points earned"]]
    for p in purchases:
        when = timezone.localtime(p.created_at).strftime("%d-%m-%Y %I:%M %p")
        data.append([when, str(p.amount), str(p.points_earned)])

    table = Table(data, colWidths=[200, 120, 120])
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