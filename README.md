# 🏫 Uniform Shop Website

A school uniform shopping website built using Python and Django. Customers can select their school, view uniforms, place orders and earn reward points. The shop owner can manage orders, customers and sales through a separate dashboard.

## ✨ Features

### 👨‍🎓 Customer Features
- Select a school and view its uniforms.
- Filter products by class.
- View product images, sizes and prices.
- Add products to cart and place orders.
- Choose Cash on Delivery or UPI.
- View and download bills as PDF.
- Earn reward points on purchases.
- Check reward points using a phone number.

### 👨‍💼 Owner Features (Login Required)
- View sales and orders on the dashboard.
- Add new purchases and generate bills.
- Manage customer details and purchase history.
- Search for customers.
- Add and manage schools and products.
- Update order status and payment details.
- View notifications for new customers, orders and pending payments.
- Send purchase and reward point details through WhatsApp.

## 🎁 Reward Points

| Purchase Amount | Points |
|---|---:|
| Up to ₹100 | 20 |
| ₹101 – ₹200 | 45 |
| ₹201 – ₹500 | 100 |
| Above ₹500 | 150 |

## 🛠️ Technologies Used

- Python
- Django
- HTML, CSS, JavaScript
- SQLite
- ReportLab (PDF generation)
- WhatsApp Cloud API (Optional)

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/Raghavbhola/uniform_shop_django.git
cd uniform_shop_django
```

2. Create a virtual environment:

```bash
python -m venv venv
```

3. Activate it on Windows:

```bash
venv\Scripts\activate
```

4. Install required packages:

```bash
pip install -r requirements.txt
```

5. Apply migrations:

```bash
python manage.py migrate
```

6. Create an admin account:

```bash
python manage.py createsuperuser
```

7. Start the server:

```bash
python manage.py runserver
```

8. Open the website:

- Customer Website: http://127.0.0.1:8000/
- Owner Dashboard: http://127.0.0.1:8000/dashboard/

Add schools and products from the owner dashboard before using the customer website.

## 📸 Screenshots

Screenshots of the website will be added here.

## ⚠️ Current Limitations

- UPI payments are checked manually by the shop owner.
- OTP verification is not available.
- Reward point discounts are applied manually.
- Automatic WhatsApp messages require a verified Meta business account.

## 👨‍💻 Developer

**Raghav Bhola**

GitHub: https://github.com/Raghavbhola
