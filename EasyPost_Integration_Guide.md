# EasyPost Shipping Integration Guide
## KCT Menswear Order Processing System

**Author:** MiniMax Agent  
**Date:** August 18, 2025  
**Version:** 1.0

---

## Overview

This guide provides complete instructions for configuring and using the EasyPost shipping integration with your KCT Menswear order processing system. The integration enables automated shipping rate calculation, label generation, and real-time tracking updates directly within your existing dashboard.

## Table of Contents

1. [Webhook Configuration](#webhook-configuration)
2. [Dashboard Features](#dashboard-features)
3. [Order Processing Workflow](#order-processing-workflow)
4. [Troubleshooting](#troubleshooting)
5. [API Reference](#api-reference)

---

## Webhook Configuration

### Step 1: Locate Your Supabase Project URL

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your KCT Menswear project
3. Go to **Settings** > **API**
4. Copy your **Project URL** (format: `https://your-project-ref.supabase.co`)

### Step 2: Configure EasyPost Webhook

**Your EasyPost Webhook URL Format:**
```
https://YOUR-PROJECT-REF.supabase.co/functions/v1/easypost-webhook
```

**Example:**
```
https://abc123def456.supabase.co/functions/v1/easypost-webhook
```

### Step 3: EasyPost Dashboard Setup

1. Log into your [EasyPost Dashboard](https://www.easypost.com/account)
2. Navigate to **Account** > **Webhooks**
3. Click **Add Webhook**
4. Enter your Supabase webhook URL (see format above)
5. Select the following events:
   - `tracker.created`
   - `tracker.updated`
   - `shipment.purchased`
   - `shipment.delivered`
6. Set HTTP Method to **POST**
7. Click **Save**

### Step 4: Verify Webhook Setup

1. EasyPost will send a test event to verify the webhook
2. Check your Supabase **Edge Functions** logs to confirm receipt
3. Look for a "Webhook received" log entry

---

## Dashboard Features

### Enhanced Order Management Dashboard

Your order processing dashboard now includes comprehensive shipping management capabilities:

#### Order List View
- **Shipping Status Column**: Shows current shipping status for each order
- **Tracking Number**: Displays tracking numbers when available
- **Shipping Cost**: Shows selected shipping rate and cost
- **Status Indicators**: Visual indicators for shipping progress

#### Order Details View

When viewing individual orders, you'll find the new **Shipping Manager** section:

##### 1. Shipping Rate Calculator
- **Automatic Address Detection**: Uses customer's billing/shipping address
- **Multiple Carrier Options**: Compare rates from USPS, UPS, FedEx, DHL
- **Real-time Pricing**: Live rates based on package dimensions and weight
- **Service Level Selection**: Express, ground, overnight options

##### 2. Label Generation
- **One-Click Label Creation**: Generate shipping labels instantly
- **Automatic Purchase**: Labels are purchased and ready for printing
- **PDF Download**: Download printable shipping labels
- **Tracking Number Assignment**: Automatic tracking number generation

##### 3. Shipment Tracking
- **Real-time Updates**: Automatic status updates via webhooks
- **Tracking Timeline**: Complete delivery journey visualization
- **Customer Notifications**: Automatic tracking email updates
- **Delivery Confirmation**: Proof of delivery notifications

---

## Order Processing Workflow

### For Core Products (Stripe)

1. **Order Received**: Order appears in dashboard with "Pending Shipping" status
2. **Calculate Rates**: Click "Get Shipping Rates" in order details
3. **Select Service**: Choose preferred shipping method and rate
4. **Generate Label**: Click "Create Shipping Label"
5. **Print & Ship**: Download and print label, attach to package
6. **Track Progress**: Monitor delivery status automatically

### For Catalog Products (Supabase)

1. **Order Processing**: Order appears with complete customer details
2. **Address Validation**: System validates shipping addresses
3. **Rate Comparison**: View all available shipping options
4. **Label Creation**: Generate labels with proper customs forms (international)
5. **Tracking Updates**: Real-time status updates in dashboard

### Automated Features

- **Weight Estimation**: Default package weights based on product data
- **Address Validation**: Automatic address correction and validation
- **Insurance Options**: Automatic insurance calculation for high-value items
- **Delivery Confirmation**: Required signature options for valuable packages

---

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Events

**Symptoms**: No tracking updates in dashboard

**Solutions**:
1. Verify webhook URL format in EasyPost dashboard
2. Check Supabase Edge Functions logs for errors
3. Ensure webhook events are properly selected in EasyPost
4. Test webhook connection using EasyPost's test feature

#### Shipping Rates Not Loading

**Symptoms**: "Unable to fetch rates" error

**Solutions**:
1. Verify customer address is complete and valid
2. Check package dimensions and weight are specified
3. Ensure EasyPost API key is correctly configured
4. Verify from_address is set in your EasyPost account

#### Label Generation Failures

**Symptoms**: "Label creation failed" error

**Solutions**:
1. Ensure sufficient funds in EasyPost account
2. Verify shipping rate was properly selected
3. Check address validation passed
4. Confirm package details are within carrier limits

### Support Contacts

- **EasyPost Support**: [support@easypost.com](mailto:support@easypost.com)
- **EasyPost Documentation**: [easypost.com/docs](https://www.easypost.com/docs)
- **Status Page**: [status.easypost.com](https://status.easypost.com)

---

## API Reference

### Supabase Edge Functions

#### 1. Get Shipping Rates
**Endpoint**: `/functions/v1/get-shipping-rates`
**Method**: POST

**Request Body**:
```json
{
  "to_address": {
    "name": "Customer Name",
    "street1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "parcel": {
    "length": 10,
    "width": 8,
    "height": 4,
    "weight": 16
  }
}
```

**Response**:
```json
{
  "rates": [
    {
      "id": "rate_123",
      "service": "USPS Priority",
      "rate": "12.50",
      "delivery_days": 2,
      "carrier": "USPS"
    }
  ]
}
```

#### 2. Create Shipping Label
**Endpoint**: `/functions/v1/create-shipping-label`
**Method**: POST

**Request Body**:
```json
{
  "rate_id": "rate_123",
  "order_id": "ord_456"
}
```

**Response**:
```json
{
  "shipment_id": "shp_789",
  "tracking_code": "1Z999AA1234567890",
  "label_url": "https://easypost.com/labels/label_abc.pdf",
  "postage_cost": "12.50"
}
```

#### 3. Webhook Handler
**Endpoint**: `/functions/v1/easypost-webhook`
**Method**: POST

**Automatic Processing**: Handles all EasyPost webhook events and updates order status automatically.

### Database Schema Updates

The following fields have been added to your orders table:

```sql
-- Shipping related fields
ALTER TABLE orders ADD COLUMN shipping_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN shipment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN shipping_carrier VARCHAR(50);
ALTER TABLE orders ADD COLUMN shipping_service VARCHAR(100);
ALTER TABLE orders ADD COLUMN label_url TEXT;
ALTER TABLE orders ADD COLUMN estimated_delivery DATE;
```

---

## Security Notes

1. **API Key Security**: EasyPost API key is stored securely in Supabase environment variables
2. **Webhook Validation**: All webhook requests are validated for authenticity
3. **Data Encryption**: All sensitive shipping data is encrypted in transit and at rest
4. **Access Control**: Shipping functions require proper authentication

---

## Next Steps

1. **Test Integration**: Process a test order to verify complete workflow
2. **Train Staff**: Familiarize team members with new shipping features
3. **Monitor Performance**: Watch for any integration issues in first few days
4. **Customer Communication**: Update customers about improved shipping capabilities

---

**For technical support or questions about this integration, please refer to the troubleshooting section or contact your development team.**