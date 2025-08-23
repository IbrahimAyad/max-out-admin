# Analytics Dashboard

A mobile-optimized business analytics dashboard with PWA capabilities for KCT Menswear.

## Features

- **Mobile-First Design**: Fully responsive interface optimized for touch devices
- **PWA Support**: Installable as a native app with offline capabilities
- **Real-time Analytics**: Dashboard with KPIs, charts, and business insights
- **Product Management**: View and manage product catalog with variants
- **Order Tracking**: Monitor customer orders and fulfillment status
- **Customer Insights**: Analyze customer behavior and segmentation
- **Reports Generation**: Exportable business reports
- **User Authentication**: Secure login and session management

## Tech Stack

- React 18 + TypeScript + Vite
- Supabase (Database, Auth, Storage)
- TanStack React Query (Server State Management)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- Vite PWA Plugin

## Getting Started

1. Clone the repository
2. Navigate to the analytics-dashboard directory:
   ```bash
   cd apps/analytics-dashboard
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE=your_service_role_key
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

The app is configured for deployment on Vercel with the following settings:

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Mobile Optimization Features

- Safe area insets for notched devices
- Touch-optimized UI components
- Prevent zoom on input focus
- Proper viewport configuration
- PWA install prompt
- Native app-like experience when installed

## PWA Capabilities

- Standalone display mode
- App shortcuts for quick navigation
- Offline caching strategies
- Installable on home screen
- Push notification support (planned)

## Environment Variables

The following environment variables must be set:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_SUPABASE_SERVICE_ROLE`: Your Supabase service role key (for server-side operations)