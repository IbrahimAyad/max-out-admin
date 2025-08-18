# KCT Menswear Admin Integration Guide

## 1. System Architecture Overview

This document provides a comprehensive guide for the KCT Menswear website development team to integrate with the new admin dashboard system. The new admin dashboard is the central hub for managing all aspects of the KCT Menswear business, including products, orders, customers, shipping, and email automation.

### 1.1. High-Level Architecture

The KCT Menswear admin system is built on a modern, scalable, and robust technology stack. The architecture is designed to be flexible and extensible, allowing for future growth and the addition of new features.

- **Frontend**: The admin dashboard is a single-page application (SPA) built with **React Native for Web**, providing a consistent and performant user experience across all devices. The UI is designed following the best practices for mobile admin interfaces, ensuring that the dashboard is fully functional and easy to use on both desktop and mobile devices.
- **Backend**: The backend is powered by **Supabase**, a backend-as-a-service (BaaS) platform that provides a PostgreSQL database, authentication, and auto-generated APIs. We leverage Supabase's edge functions for custom business logic and integrations with third-party services.
- **Database**: A **PostgreSQL** database hosted on Supabase is the primary data store for the application.
- **Integrations**: The system is integrated with several third-party services to handle specific business functions:
    - **Stripe**: For managing and processing payments for "Core Products".
    - **EasyPost**: For handling all shipping-related tasks, including rate calculation, label generation, and tracking.
    - **SendGrid**: For sending transactional emails to customers.

### 1.2. Technology Stack

- **Frontend**: React Native for Web, TypeScript, TanStack Query, Zustand
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Database**: PostgreSQL
- **Integrations**: Stripe, EasyPost, SendGrid
- **Styling**: Tailwind CSS
- **Component Library**: Custom-built component library following Atomic Design principles.

### 1.3. Data Flow

The following diagram illustrates the high-level data flow between the different components of the system:

```mermaid
graph TD
    A[Website Frontend] --> B{Admin API (Supabase)};
    B --> C[Supabase Database];
    B --> D[Stripe API];
    B --> E[EasyPost API];
    B --> F[SendGrid API];
    G[Admin Dashboard] --> B;
```

## 2. Stripe Integration Details

The admin system is deeply integrated with Stripe to handle the "Core Products" of KCT Menswear. This integration allows for seamless management of products, payments, and orders.

### 2.1. Core Product Management

- **Product Sync**: Core Products and their prices are managed directly in the Stripe dashboard. The admin system syncs with Stripe to fetch the latest product information.
- **Real-time Updates**: Any changes made to Core Products in the Stripe dashboard are reflected in the admin system in real-time using Stripe webhooks.

### 2.2. Order Processing

- **Payment Intent**: When a customer places an order for a Core Product on the website, a Payment Intent is created on Stripe. The website frontend should handle the payment process using Stripe.js and the Payment Intent.
- **Order Creation**: Once the payment is successful, the website backend should create an order in the admin system's database via the Admin API. The order should include the Stripe charge ID for reference.

### 2.3. Stripe Webhook Configuration

The admin system relies on Stripe webhooks to receive real-time updates about events happening in the Stripe account. The following webhooks must be configured in the Stripe dashboard:

- `product.created`
- `product.updated`
- `product.deleted`
- `price.created`
- `price.updated`
- `price.deleted`
- `charge.succeeded`

The webhook endpoint URL is: `https://rtbbsdcrfbha.space.minimax.io/api/stripe-webhook`

## 3. Supabase Configuration

Supabase is the backbone of the admin system, providing the database, backend logic, and API.

### 3.1. Database Schema

The Supabase database schema is designed to be relational and scalable. The key tables are:

- `products`: Stores information about "Catalog Products".
- `orders`: Stores information about all orders, both for Core and Catalog Products.
- `customers`: Stores customer information.
- `shipping_details`: Stores shipping information related to orders.
- `email_logs`: Stores logs of all emails sent to customers.
- `shipping_templates`: Stores the 11 package templates for EasyPost.

The detailed schema for each table can be found in the Supabase dashboard or by inspecting the migration files in the `supabase/migrations` directory.

### 3.2. Edge Functions

Supabase Edge Functions are used to implement custom business logic and integrate with third-party services. The key edge functions are:

- `stripe-webhook`: Handles incoming webhooks from Stripe.
- `easypost-webhook`: Handles incoming webhooks from EasyPost.
- `create-order`: Creates a new order in the database.
- `shipping-rates`: Fetches shipping rates from EasyPost.
- `create-shipping-label`: Creates a shipping label with EasyPost.
- `send-email`: Sends emails using SendGrid.

### 3.3. Environment Variables

The following environment variables must be set in the Supabase project settings:

- `STRIPE_API_KEY`: Your Stripe API key.
- `STRIPE_WEBHOOK_SECRET`: The secret for the Stripe webhook.
- `EASYPOST_API_KEY`: Your EasyPost API key.
- `SENDGRID_API_KEY`: Your SendGrid API key.

## 4. API Endpoints Documentation

The admin system exposes a set of RESTful API endpoints for interacting with the system. All endpoints are protected and require authentication.

**Base URL**: `https://rtbbsdcrfbha.space.minimax.io/api/`

### 4.1. Authentication

- **Endpoint**: `/auth/token`
- **Method**: `POST`
- **Description**: Authenticates a user and returns a JWT token.
- **Request Body**: `{ "email": "user@example.com", "password": "password" }`
- **Response**: `{ "token": "<jwt_token>" }`

### 4.2. Orders

- **Endpoint**: `/orders`
- **Method**: `GET`
- **Description**: Retrieves a list of all orders.
- **Endpoint**: `/orders`
- **Method**: `POST`
- **Description**: Creates a new order.
- **Endpoint**: `/orders/{id}`
- **Method**: `GET`
- **Description**: Retrieves a single order by ID.

### 4.3. Products

- **Endpoint**: `/products`
- **Method**: `GET`
- **Description**: Retrieves a list of all catalog products.

### 4.4. Shipping

- **Endpoint**: `/shipping/rates`
- **Method**: `POST`
- **Description**: Calculates shipping rates for an order.
- **Endpoint**: `/shipping/labels`
- **Method**: `POST`
- **Description**: Creates a shipping label for an order.

### 4.5. Email

- **Endpoint**: `/email/send`
- **Method**: `POST`
- **Description**: Sends an email to a customer.

## 5. Dual Product Architecture

The KCT Menswear business has a dual product architecture, which is reflected in the admin system.

### 5.1. Core Products (Stripe)

- **Source**: Managed in the Stripe dashboard.
- **Characteristics**: 28 core items and 38 bundles.
- **Order Flow**: When a customer purchases a Core Product, the order is processed through Stripe. The website frontend should use Stripe.js to handle the payment and then create the order in the admin system via the API.

### 5.2. Catalog Products (Supabase)

- **Source**: Managed in the Supabase database via the admin dashboard.
- **Characteristics**: 150+ items.
- **Order Flow**: When a customer purchases a Catalog Product, the order is created directly in the admin system via the API. The payment can be processed through a separate payment gateway or integrated with Stripe.

### 5.3. Checkout Integration

The website's checkout process needs to handle both types of products seamlessly.

- **Unified Cart**: The shopping cart should be able to contain both Core and Catalog Products.
- **Order Splitting**: When an order contains both types of products, the website backend may need to split the order into two separate orders in the admin system, one for Stripe and one for Supabase, or handle the logic to associate a single order with both Stripe and Supabase products.

## 6. Shipping Integration (EasyPost)

The admin system is integrated with EasyPost to handle all shipping-related tasks. This integration provides a seamless workflow for calculating shipping rates, generating labels, and tracking packages.

### 6.1. Package Templates

The system is pre-configured with 11 package templates to cover the most common shipping scenarios for KCT Menswear products. These templates are stored in the `shipping_templates` table in the Supabase database.

### 6.2. Shipping Rate Calculation

- **Endpoint**: `/shipping/rates`
- **Method**: `POST`
- **Description**: Calculates shipping rates for an order based on the package dimensions, weight, and destination address.
- **Request Body**: `{ "to_address": { ... }, "parcel": { ... } }`
- **Response**: `{ "rates": [ { ... } ] }`

### 6.3. Label Generation

- **Endpoint**: `/shipping/labels`
- **Method**: `POST`
- **Description**: Creates a shipping label for an order.
- **Request Body**: `{ "rate_id": "<rate_id>", "order_id": "<order_id>" }`
- **Response**: `{ "shipment_id": "<shipment_id>", "tracking_code": "<tracking_code>", "label_url": "<label_url>" }`

### 6.4. Tracking

- **Webhook**: The system uses EasyPost webhooks to receive real-time updates on the status of shipments.
- **Webhook URL**: `https://rtbbsdcrfbha.space.minimax.io/api/easypost-webhook`
- **Events**: The webhook should be configured to listen for the following events: `tracker.created`, `tracker.updated`, `shipment.purchased`, `shipment.delivered`.

## 7. Email Automation (SendGrid)

The admin system uses SendGrid to send transactional emails to customers. The email automation is designed to keep customers informed about the status of their orders.

### 7.1. Email Triggers

Emails are triggered at various stages of the order lifecycle:

- **Order Confirmation**: Sent when a new order is placed.
- **Shipping Confirmation**: Sent when a shipping label is created.
- **Delivery Updates**: Sent when the shipping status is updated by EasyPost.
- **Delivery Confirmation**: Sent when the package is delivered.

### 7.2. Email Templates

The system uses a set of pre-designed email templates that are consistent with the KCT Menswear brand. These templates are managed in the SendGrid dashboard.

### 7.3. Send Email Endpoint

- **Endpoint**: `/email/send`
- **Method**: `POST`
- **Description**: Sends an email to a customer.
- **Request Body**: `{ "to": "<customer_email>", "template_id": "<sendgrid_template_id>", "dynamic_template_data": { ... } }`

## 8. Authentication & Security

The admin system is designed with security as a top priority. All access to the admin dashboard and API is protected.

### 8.1. Admin Authentication

- **Authentication Method**: The admin dashboard uses JWT (JSON Web Token) based authentication.
- **Login Endpoint**: `/auth/token`
- **Session Management**: Sessions are managed on the client-side using the JWT token stored in `localStorage`.

### 8.2. API Security

- **Protected Endpoints**: All API endpoints, except for the login endpoint, are protected and require a valid JWT token in the `Authorization` header.
- **Row Level Security (RLS)**: The Supabase database uses RLS to ensure that users can only access the data they are authorized to see.

## 9. Webhook Configurations

Webhooks are used to receive real-time updates from third-party services. The following webhooks need to be configured:

### 9.1. Stripe

- **Endpoint URL**: `https://rtbbsdcrfbha.space.minimax.io/api/stripe-webhook`
- **Events**: `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, `price.deleted`, `charge.succeeded`

### 9.2. EasyPost

- **Endpoint URL**: `https://rtbbsdcrfbha.space.minimax.io/api/easypost-webhook`
- **Events**: `tracker.created`, `tracker.updated`, `shipment.purchased`, `shipment.delivered`

## 10. Deployment & Environment Setup

The admin system is deployed on a combination of Netlify (for the frontend) and Supabase (for the backend).

### 10.1. Required Environment Variables

The following environment variables need to be set in the appropriate environments (Netlify for frontend, Supabase for backend):

- `REACT_APP_SUPABASE_URL`: The URL of your Supabase project.
- `REACT_APP_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project.
- `STRIPE_API_KEY`: Your Stripe API key.
- `STRIPE_WEBHOOK_SECRET`: The secret for the Stripe webhook.
- `EASYPOST_API_KEY`: Your EasyPost API key.
- `SENDGRID_API_KEY`: Your SendGrid API key.

### 10.2. Database Setup

The database schema is managed through Supabase migrations. The migration files are located in the `supabase/migrations` directory. To set up a new database, you can apply these migrations in the correct order.

### 10.3. Edge Function Deployment

The Supabase Edge Functions are deployed using the Supabase CLI. The source code for the functions is located in the `supabase/functions` directory.

## 11. Frontend Integration Guide

This section provides guidance for the website development team on how to integrate the KCT Menswear website with the admin system's API.

### 11.1. Order Creation

- **Endpoint**: `/orders`
- **Method**: `POST`
- **Description**: To create a new order in the admin system, the website backend should send a POST request to the `/orders` endpoint with the order details.
- **Payload**: The payload should include customer information, product details (both Core and Catalog), and the Stripe charge ID if applicable.

### 11.2. Customer Data Synchronization

- **Recommendation**: To avoid data duplication, it is recommended to have a single source of truth for customer data. The admin system can be used as the primary customer database.
- **Synchronization**: When a new customer signs up on the website, a corresponding customer record should be created in the admin system via the API.

### 11.3. Product Catalog Integration

- **Core Products**: The website should fetch the list of Core Products from the admin system's API to ensure that the product information is always up-to-date.
- **Catalog Products**: Similarly, the website should fetch the list of Catalog Products from the API.

### 11.4. UI/UX Considerations

The admin dashboard is designed with a mobile-first approach and follows modern UI/UX patterns. The website's user experience should be consistent with the admin dashboard's design philosophy.

- **Responsive Design**: The website should be fully responsive and provide a seamless experience on all devices.
- **Clear Communication**: The website should clearly communicate the status of orders to customers, using the information provided by the admin system's API.

## 12. Testing & Troubleshooting

### 12.1. API Testing

- **Tools**: Use tools like Postman or Insomnia to test the API endpoints.
- **Authentication**: Remember to include the JWT token in the `Authorization` header for all protected endpoints.

### 12.2. Common Issues

- **Authentication Errors**: If you are getting authentication errors, make sure that you are using a valid JWT token.
- **Webhook Issues**: If you are not receiving webhook updates, check the webhook configuration in the Stripe and EasyPost dashboards.
- **API Errors**: If you are getting errors from the API, check the API documentation for the correct request format and parameters.

### 12.3. Health Check Endpoints

The admin system provides a health check endpoint to verify the status of the system and its integrations.

- **Endpoint**: `/health`
- **Method**: `GET`
- **Description**: Returns the status of the admin system, database, and third-party integrations.
