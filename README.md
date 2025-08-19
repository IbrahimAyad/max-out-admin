# KCT Menswear Ecosystem - Complete Business Management Platform

## 🏢 Overview
A comprehensive business management platform for KCT Menswear, featuring modular applications for different business functions - from inventory management to wedding coordination.

## 📱 Applications

### 1. Admin Hub (`apps/admin-hub`)
**Primary Business Dashboard**
- Complete business overview and analytics
- User management and permissions
- System configuration and settings
- Integration hub for all other applications

**Deploy to:** `admin.kctmenswear.com`

### 2. Inventory Manager (`apps/inventory-manager`)
**Advanced Inventory Control System**
- Size-specific inventory tracking (suits, shirts, accessories)
- Real-time stock updates and alerts
- Bulk inventory operations
- Export and reporting capabilities

**Deploy to:** `inventory.kctmenswear.com`

### 3. Wedding Portal (`apps/wedding-portal`)
**Wedding Management Platform**
- Wedding timeline and milestone tracking
- Couple communication center
- Outfit coordination and planning
- Wedding party management

**Deploy to:** `wedding.kctmenswear.com`

### 4. Groomsmen Portal (`apps/groomsmen-portal`)
**Groomsmen-Specific Interface**
- Individual groomsmen dashboards
- Measurement submission system
- Outfit selection and approvals
- Timeline and communication tools

**Deploy to:** `groomsmen.kctmenswear.com`

### 5. Order Management (`apps/order-management`)
**Order Processing Dashboard**
- Order lifecycle management
- Payment processing integration
- Shipping and fulfillment tracking
- Customer communication

**Deploy to:** `orders.kctmenswear.com`

### 6. User Profiles (`apps/user-profiles`)
**Customer Profile Management**
- Enhanced customer profiles
- Measurement history and tracking
- Preference management
- Order history and analytics

**Deploy to:** `profiles.kctmenswear.com`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- Vercel account (for deployment)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/IbrahimAyad/max-out-admin.git
cd max-out-admin

# Install dependencies for all apps
npm run install:all

# Start development server for specific app
npm run dev:admin      # Admin Hub
npm run dev:inventory  # Inventory Manager
npm run dev:wedding    # Wedding Portal
npm run dev:groomsmen  # Groomsmen Portal
npm run dev:orders     # Order Management
npm run dev:profiles   # User Profiles
```

### Production Build
```bash
# Build all applications
npm run build:all

# Build specific application
npm run build:admin
npm run build:inventory
# etc.
```

## 🏗️ Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (Database, Auth, Storage, Edge Functions)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React Query + Zustand
- **Deployment:** Vercel with custom subdomains

### Monorepo Structure
```
kct-ecosystem/
├── apps/
│   ├── admin-hub/          # Main business dashboard
│   ├── inventory-manager/  # Inventory management
│   ├── wedding-portal/     # Wedding management
│   ├── groomsmen-portal/   # Groomsmen interface
│   ├── order-management/   # Order processing
│   └── user-profiles/      # Customer profiles
├── shared/
│   ├── components/         # Shared React components
│   ├── utils/             # Shared utilities
│   ├── types/             # TypeScript types
│   ├── hooks/             # Custom React hooks
│   └── constants/         # App constants
├── docs/                  # Documentation
└── deployment/            # Deployment configs
```

## 🌐 Deployment

### Vercel Setup
Each application deploys to its own subdomain:

1. **admin.kctmenswear.com** - Admin Hub
2. **inventory.kctmenswear.com** - Inventory Manager
3. **wedding.kctmenswear.com** - Wedding Portal
4. **groomsmen.kctmenswear.com** - Groomsmen Portal
5. **orders.kctmenswear.com** - Order Management
6. **profiles.kctmenswear.com** - User Profiles

### Environment Variables
Each app requires:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Database Schema

### Shared Tables
- `users` - User accounts and authentication
- `profiles` - Extended user profile information
- `products` - Product catalog
- `product_variants` - Size/color variations
- `orders` - Order management
- `weddings` - Wedding information
- `wedding_parties` - Wedding party members

## 🔧 Development Workflow

### Adding New Features
1. Identify which app the feature belongs to
2. Create feature branch: `feature/app-name/feature-description`
3. Develop in the appropriate app directory
4. Test locally using dev scripts
5. Create pull request for review

### Deploying Updates
1. Build the specific app: `npm run build:appname`
2. Push changes to main branch
3. Vercel automatically deploys to respective subdomain
4. Verify deployment on live URL

## 📚 Documentation
- [Admin Hub Documentation](./docs/admin-hub.md)
- [Inventory Management Guide](./docs/inventory-manager.md)
- [Wedding Portal Manual](./docs/wedding-portal.md)
- [Deployment Guide](./docs/deployment.md)
- [API Documentation](./docs/api.md)

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support
For technical support or feature requests, please contact the development team.

## 📄 License
MIT License - see LICENSE file for details.

---

**Built with ❤️ by MiniMax Agent for KCT Menswear**