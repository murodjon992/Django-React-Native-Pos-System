# 🛒 Django & React Native POS System

A modern, full-stack **Point of Sale (POS)** system designed for small to medium-sized retail businesses. This project features a robust Django backend and a high-performance React Native mobile application for seamless sales management.

---

## 🚀 Key Features

* **Inventory Management:** Efficiently manage products, categories, and stock levels via the Django Admin.
* **Integrated Barcode Scanner:** Utilize the mobile device's camera to scan product barcodes for rapid checkout.
* **Real-time Cart System:** Add, remove, and update products in the cart before finalizing a sale.
* **Sales History:** Track all past transactions with detailed logs for auditing and reporting.
* **User Roles:** Secure access for Admins (management) and Cashiers (sales).
* **Responsive Design:** Optimized for both mobile phones and tablets.

---

## 📂 Project Structure



```text
umidbekpos/
├── pos/              # Django Project Settings
├── posapp/           # Django Application (Backend Logic & API)
├── pos-mobile/       # React Native Application (Mobile Frontend)
├── manage.py         # Django Management Script
├── requirements.txt  # Python Dependencies
└── README.md         # Project Documentation

# Create a virtual environment
python -m venv venv

# Activate the environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create a superuser for Admin Panel access
python manage.py createsuperuser

# Start the development server
python manage.py runserver

cd pos-mobile

# Install npm packages
npm install

# Start the application (using Expo)
npx expo start