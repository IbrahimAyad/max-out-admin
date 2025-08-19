# Max Out Admin - KCT Inventory Management System

## 🎯 Overview
A comprehensive inventory management system built for KCT Menswear, featuring size-specific inventory tracking, advanced filtering, and real-time updates.

## ✨ Features
- **Size Matrix View**: Visual inventory display by size variants (suits: 34S-54L, shirts: 14.5-18)
- **Advanced Filtering**: Filter by category, size, color, and stock level
- **Real-time Updates**: Live inventory synchronization
- **Bulk Management**: Update multiple items simultaneously
- **Visual Indicators**: Color-coded stock level warnings
- **Mobile Responsive**: Works on tablets and phones
- **Export Functionality**: Generate inventory reports

## 🏗️ Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Database, Auth, Real-time)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query + Zustand

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account

### Installation
```bash
# Clone the repository
git clone https://github.com/IbrahimAyad/max-out-admin.git
cd max-out-admin

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Start development server
npm run dev
# or
pnpm dev
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Database Schema

### Products Table
- `id`: Primary key
- `name`: Product name
- `category`: Product category (suits, shirts, etc.)
- `description`: Product description
- `base_price`: Base pricing
- `created_at`: Creation timestamp

### Product Variants Table
- `id`: Primary key
- `product_id`: Foreign key to products
- `size`: Size specification (34S, 15.5, etc.)
- `color`: Color variant
- `stock_quantity`: Current inventory count
- `low_stock_threshold`: Alert threshold
- `created_at`: Creation timestamp

## 🎨 Product Categories & Sizing

### Suits
- **Colors**: Navy, Beige, Black, Brown, Burgundy, Charcoal Grey, Dark Brown, Emerald, Hunter Green, Indigo, Light Grey, Midnight Blue, Sand, Tan
- **Variants**: 2-piece, 3-piece
- **Sizes**: 34S, 34R, 36S, 36R, 38S, 38R, 38L, 40S, 40R, 40L, 42S, 42R, 42L, 44S, 44R, 44L, 46S, 46R, 46L, 48S, 48R, 48L, 50S, 50R, 50L, 52R, 52L, 54R, 54L

### Dress Shirts
- **Fits**: Slim Cut, Classic Fit
- **Collar Sizes**: 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18

### Accessories
- **Suspenders**: Color variants only (no sizes)
- **Ties**: Already managed separately

## 📱 Usage Guide

### Accessing the System
1. Navigate to the deployed application
2. Login with admin credentials
3. Go to "Inventory Management" section

### Managing Inventory
1. **View Products**: Browse all products with current stock levels
2. **Filter Items**: Use category, size, color, and stock filters
3. **Update Stock**: Click on quantity cells to edit inventory
4. **Bulk Updates**: Select multiple items for mass updates
5. **Export Reports**: Generate inventory reports for analysis

### Stock Level Indicators
- 🟢 **Good Stock**: Above threshold
- 🟡 **Low Stock**: Below threshold but available
- 🔴 **Out of Stock**: Zero inventory

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
# Build for production
npm run build

# Deploy dist folder to Netlify
```

### Manual Build
```bash
# Create production build
npm run build

# Serve dist folder with any static hosting service
```

## 🔒 Authentication
The system uses Supabase Auth with email/password authentication. Admin users can access all inventory management features.

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License
Private repository for KCT Menswear internal use.

## 📞 Support
For technical support or questions, contact the development team.

---
**Built with ❤️ for KCT Menswear**