from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('purchase/', views.add_purchase, name='purchase'),
    path('staff/', views.staff, name='staff'),
    path('search/', views.search_customers, name='search'),
    path('history/<str:phone>/', views.history, name='history'),
    path('history/<str:phone>/pdf/', views.history_pdf, name='history_pdf'),
    path('manage/', views.manage, name='manage'),   
    path('order/', views.place_order, name='place_order'),
    path('bill/<uuid:token>/', views.bill, name='bill'),
    path('bill/<uuid:token>/pdf/', views.bill_pdf, name='bill_pdf'),
    path('orders/', views.orders, name='orders'),     
]