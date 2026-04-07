# 🚀 Tyrex – E-Commerce Tyre Selling Platform

## 🌐 Live Demo
👉 https://tyre-x.shop/

---

## 📌 Overview

Tyrex is a full-featured e-commerce platform built to solve a specific gap in the market — the lack of a unified platform for purchasing tyres across multiple brands.

Unlike brand-specific websites, Tyrex provides a centralized marketplace where users can browse, compare, and purchase tyres from different manufacturers in one place.

The platform is designed with a strong focus on real-world e-commerce workflows, including secure payments, inventory control, user engagement systems, and admin-driven analytics.

---

## 🛠 Tech Stack

### 🔹 Backend
- Node.js  
- Express.js  
- MongoDB  
- EJS (Server-side rendering)

### 🔹 Authentication & Security
- Express Session (Session-based authentication)  
- Role-Based Access Control (Admin/User)  
- Secure cookie handling  

### 🔹 Payments
- Razorpay Integration  
- Order creation & signature verification  

### 🔹 Tools & Libraries
- Multer (File uploads)  
- Bcrypt (Password hashing)  
- Express-session  
- MongoDB Aggregations  

---

## ✨ Key Features

### 👤 User Features
- User authentication (session-based)
- Browse tyres across multiple brands
- Add to cart with quantity management
- Wishlist management
- Wallet system (refunds, referrals, payments)
- Coupon & discount system
- Order placement & tracking
- Profile management

---

### 🛒 Cart & Inventory Logic
- Prevents adding out-of-stock products  
- Automatically updates quantity if product already exists in cart  
- Ensures cart quantity does not exceed available inventory  
- Sync logic between wishlist and cart  

---

### 💰 Wallet System
- Internal wallet for seamless transactions  
- Supports:
  - Order payments  
  - Refund handling  
  - Referral bonuses  
- Maintains transaction history  

---

### 🎟️ Coupon & Referral System
- Percentage-based discounts  
- Minimum purchase requirement  
- Maximum discount cap  
- Referral bonus system for user acquisition  

---

### 📦 Order Management
- Complete order lifecycle:
  - Pending → Confirmed → Shipped → Delivered  
  - Cancel / Return flow  
  - Admin approval for returns  
- Secure order handling with payment verification  

---

### 👨‍💼 Admin Features
- Advanced sales analytics dashboard  
- Customer management  
- Product, brand & category management  
- Inventory tracking  
- Coupon management  
- Banner management  
- Order & return approval system  
- Wallet monitoring  

---

## 🔐 Authentication Flow

Tyrex uses session-based authentication:

1. User logs in → session created on server  
2. Session ID stored in browser cookies  
3. Each request is validated using session data  
4. Middleware protects routes based on authentication  
5. Role-based authorization ensures admin/user access control  

---

## 💳 Payment Flow (Razorpay)

1. Frontend requests order creation  
2. Backend creates Razorpay order  
3. Order ID sent to frontend  
4. User completes payment  
5. Backend verifies payment using signature/webhook  
6. Order is confirmed only after successful verification  

---

## 🧠 Architecture

The backend follows a modular MVC-based architecture:

- Controllers → Handle request/response  
- Services → Business logic  
- Models → Database schema  
- Middleware → Authentication & error handling  

---

## ⚙️ Setup Instructions

```bash
git clone https://github.com/christin-johny/TyreX.git
cd TyreX
npm install
npm start
