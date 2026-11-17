# 🏫 Uniform Shop Website
 
A Django web application for a school uniform shop. Customers can browse their school's uniform, place orders and earn loyalty points, while the shop owner manages sales, orders and customers from a separate login-protected dashboard.
 
> Status: working MVP / portfolio project. Online payment gateway and OTP verification are not integrated yet (see [Limitations](#-limitations--roadmap)).
 
## ✨ Features
 
### For customers
* 🏫 **School-wise uniform catalog** – choose a school, filter by class, and see items with sizes, prices and photos.
* 🛒 **Cart & checkout** – add items with a size, then place an order with name, phone, address and **Cash on Delivery / UPI**.
* 🧾 **Bill page + PDF** – every order gets a private bill link that can be downloaded as a PDF.
* 🎁 **Loyalty points** – earn points on every purchase and check them with just a phone number.
* 📱 **Responsive design** – works on phones, tablets and desktops.
### For the shop owner / staff (login required)
* 📊 **Owner dashboard** – new orders, today's sales and customer count at a glance.
* ➕ **Counter billing** – add a purchase by phone number (with number suggestions) and select what was bought.
* 📦 **Order management** – update status (New → Confirmed → Delivered) and mark payments as paid. Points are added when an order is delivered.
* 👥 **Customers & history** – search customers, view purchase history and download it as a PDF.
* 🏫 **Schools & dress management** – add schools, dresses, sizes, prices and photos without touching code.
* 🔔 **Notifications** – bell icon with unread count for new customers, orders and pending payments.
* 📲 **WhatsApp points message** – a pre-filled message with purchase, points earned and remaining points opens in one click. Automatic sending via the **WhatsApp Cloud API** is built in as an optional integration (needs a Meta business account and an approved message template).
### Points slabs
 
| Purchase amount | Points |
|---|---|
| Up to ₹100 | 20 |
| ₹101 – ₹200 | 45 |
| ₹201 – ₹500 | 100 |
| Above ₹500 | 150 |
 
## 🔒 Security notes
* Staff pages are restricted to staff accounts (`staff_member_required`).
* Order prices are calculated **on the server** from the database, not trusted from the browser.
* Basic rate limiting on registration and ordering.
* Secrets (secret key, WhatsApp token, UPI ID) are read from environment variables, not from the code.
## 🛠️ Tech Stack
 
* **Backend:** Python, Django
* **Frontend:** HTML, CSS, JavaScript (no framework)
* **Database:** SQLite
* **PDF:** ReportLab
* **Integration:** WhatsApp Cloud API (optional)
## 🚀 Installation & Setup
 
1. Clone the repository:
```bash
git clone https://github.com/Raghavbhola/uniform_shop_django.git
cd uniform_shop_django
```
 
2. Create and activate a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux
```
 
3. Install dependencies:
```bash
pip install -r requirements.txt
```
 
4. Apply database migrations:
```bash
python manage.py migrate
```
 
5. Create an owner (admin) account:
```bash
python manage.py createsuperuser
```
 
6. Start the development server:
```bash
python manage.py runserver
```
 
7. Open the app:
   * Customer website: `http://127.0.0.1:8000/`
   * Owner dashboard (login required): `http://127.0.0.1:8000/dashboard/`
8. In the dashboard, open **Schools & Dress** and add your schools and items. The customer site is empty until you do.
### Optional environment variables
 
| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Secret key for production |
| `DJANGO_DEBUG` | Set to `0` in production |
| `DJANGO_HOST` | Your domain, e.g. `username.pythonanywhere.com` |
| `SHOP_UPI_ID` | Shop UPI ID shown on the bill for UPI payments |
| `WA_TOKEN`, `WA_PHONE_ID` | WhatsApp Cloud API credentials (optional) |
 
Shop name, phone, address and WhatsApp number are configured in `SHOP_INFO` in `settings.py` and in the `SHOP` object in `shop/static/shop/js/app.js`.
 
## 📸 Screenshots
 
_Add screenshots here: home page, school-wise uniform list, cart/checkout, bill, owner dashboard._
 
## ⚠️ Limitations & Roadmap
 
* No payment gateway yet: for UPI orders the staff verifies the payment manually and marks it as paid.
* Discount redemption (1,000 points) is done manually by the shopkeeper.
* No OTP verification: points can be checked with a phone number alone.
* Automatic WhatsApp sending needs a verified Meta business account; until then the one-click message link is used.
* Planned: payment gateway, OTP login, automatic discount redemption, automated tests.
## 👨‍💻 Developer
 
**Raghav Bhola**
 
* GitHub: [Raghavbhola](https://github.com/Raghavbhola)
 
