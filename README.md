🚀 Tyrex – E-Commerce Tyre Selling Platform
🌐 Live Demo

👉 https://tyre-x.shop/

📌 Overview

Tyrex is a full-featured e-commerce platform built to solve a specific gap in the market — the lack of a unified platform for purchasing tyres across multiple brands.

Unlike brand-specific websites, Tyrex provides a centralized marketplace where users can browse, compare, and purchase tyres from different manufacturers in one place.

The platform is designed with a strong focus on real-world e-commerce workflows, including secure payments, inventory control, user engagement systems, and admin-driven analytics.

🛠 Tech Stack
🔹 Backend
Node.js
Express.js
MongoDB
EJS (Server-side rendering)
🔹 Authentication & Security
Express Session (Session-based authentication)
Role-Based Access Control (Admin/User)
Secure cookie handling
🔹 Payments
Razorpay Integration
Order creation & signature verification
🔹 Tools & Libraries
Multer (File uploads)
Bcrypt (Password hashing)
Express-session
MongoDB Aggregations
✨ Key Features
👤 User Features
User authentication (session-based)
Browse tyres across multiple brands
Add to cart with quantity management
Wishlist management
Wallet system (refunds, referrals, payments)
Coupon & discount system
Order placement & tracking
Profile management
🛒 Cart & Inventory Logic
Prevents adding out-of-stock products
Automatically updates quantity if product already exists in cart
Ensures cart quantity does not exceed available inventory
Sync logic between wishlist and cart
💰 Wallet System
Internal wallet for seamless transactions
Supports:
Order payments
Refund handling
Referral bonuses
Maintains transaction history
🎟️ Coupon & Referral System
Percentage-based discounts
Minimum purchase requirement
Maximum discount cap
Referral bonus system for user acquisition
📦 Order Management
Complete order lifecycle:
Pending → Confirmed → Shipped → Delivered
Cancel / Return flow
Admin approval for returns
Secure order handling with payment verification
👨‍💼 Admin Features
Advanced sales analytics dashboard
Customer management
Product, brand & category management
Inventory tracking
Coupon management
Banner management
Order & return approval system
Wallet monitoring
🔐 Authentication Flow

Tyrex uses session-based authentication:

User logs in → session created on server
Session ID stored in browser cookies
Each request is validated using session data
Middleware protects routes based on authentication
Role-based authorization ensures admin/user access control
💳 Payment Flow (Razorpay)
Frontend requests order creation
Backend creates Razorpay order
Order ID sent to frontend
User completes payment
Backend verifies payment using signature/webhook
Order is confirmed only after successful verification
🧠 Architecture

The backend follows a modular MVC-based architecture:

Controllers → Handle request/response
Services (logic layer) → Business logic
Models → Database schema
Middleware → Authentication, error handling

This ensures:

Clean code structure
Scalability
Easy debugging and maintenance
⚙️ Setup Instructions
# Clone the repository
git clone https://github.com/christin-johny/TyreX.git

# Navigate to project
cd TyreX

# Install dependencies
npm install

# Run the server
npm start
🌟 Why This Project Stands Out
Real-world e-commerce complexity
Secure payment integration with verification
Fully functional wallet & referral system
Advanced coupon validation logic
Strong admin analytics and control system
Proper session-based authentication
Clean and scalable backend structure
🔮 Future Improvements
Microservices architecture
Real-time order tracking
Recommendation engine
Mobile app integration
