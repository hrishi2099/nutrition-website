# NutriSap - Nutrition Website

A comprehensive nutrition and wellness platform built with Next.js 15, featuring AI-powered chatbots, diet plans, e-commerce functionality, and a complete checkout system.

## 🚀 Features

### Core Features
- **AI-Powered Chatbot** - Nutrition advice and meal planning assistance
- **Diet Plans** - Personalized nutrition plans with detailed meal guides
- **E-commerce** - Product catalog with shopping cart functionality
- **Complete Checkout System** - Multi-step checkout with payment gateway integration
- **Blog System** - Nutrition articles and wellness content
- **Admin Panel** - Content management and analytics
- **User Authentication** - Secure login and profile management

### E-commerce & Checkout
- **3-Step Checkout Process** - Shipping → Payment → Review
- **Multiple Payment Gateways** - Razorpay, Stripe, PayTM, PhonePe
- **Order Management** - Order tracking and status updates
- **Cart Functionality** - Add, remove, and modify cart items
- **Responsive Design** - Mobile-friendly checkout experience

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Authentication**: JWT-based auth
- **Payment**: Multi-gateway integration
- **Deployment**: Vercel-ready

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- MySQL database (local or cloud)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd nutrition-website
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Set up the database**
```bash
npx prisma db push
npm run db:seed
```

5. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
