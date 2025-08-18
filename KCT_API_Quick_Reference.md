# KCT Menswear API Quick Reference
**Essential Endpoints for Frontend Integration**

**Backend URL:** https://rtbbsdcrfbha.space.minimax.io  
**Supabase URL:** https://your-project.supabase.co/functions/v1/

---

## Authentication

```javascript
const headers = {
  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'apikey': SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json'
};
```

---

## Core API Endpoints

### 1. Create Stripe Payment Intent (Core Products)
```javascript
POST /functions/v1/stripe-payment-intent

{
  "amount": 599.99,
  "currency": "usd",
  "cartItems": [
    {
      "product_id": "suit-001",
      "product_name": "Classic Navy Suit",
      "stripe_product_id": "prod_123",
      "product_source": "core_stripe",
      "quantity": 1,
      "price": 599.99,
      "size": "42R"
    }
  ],
  "customerEmail": "customer@email.com",
  "shippingAddress": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  }
}

// Response:
{
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "orderId": "uuid",
    "orderNumber": "KCT-xxx"
  }
}
```

### 2. Create Direct Order (Catalog Products)
```javascript
POST /functions/v1/order-management

{
  "action": "create_order_queue_entry",
  "order_data": {
    "order_id": "KCT-" + Date.now(),
    "customer_email": "customer@email.com",
    "customer_name": "John Doe",
    "total_amount": 299.99,
    "items": [
      {
        "product_id": "shirt-001",
        "product_name": "Cotton Dress Shirt",
        "catalog_product_id": "uuid",
        "product_source": "catalog_supabase",
        "quantity": 2,
        "price": 149.99,
        "size": "L"
      }
    ]
  }
}
```

### 3. Calculate Shipping Rates
```javascript
POST /functions/v1/shipping-rates

{
  "orderId": "order-uuid",
  "toAddress": {
    "name": "John Doe",
    "street1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "weight": 16,
  "dimensions": {
    "length": 12,
    "width": 9,
    "height": 3
  }
}

// Response:
{
  "data": {
    "shipmentId": "shp_xxx",
    "rates": [
      {
        "id": "rate_xxx",
        "carrier": "USPS",
        "service": "Priority Mail",
        "rate": "$12.50",
        "delivery_days": 2
      }
    ]
  }
}
```

### 4. Create Shipping Label
```javascript
POST /functions/v1/shipping-label

{
  "rateId": "rate_xxx",
  "orderId": "order-uuid"
}

// Response:
{
  "data": {
    "shipmentId": "shp_xxx",
    "trackingNumber": "1Z999AA1234567890",
    "labelUrl": "https://easypost.com/labels/xxx.pdf",
    "cost": "12.50"
  }
}
```

### 5. Send Email Notification
```javascript
POST /functions/v1/send-email

{
  "emailType": "order_confirmation", // or "shipping_confirmation"
  "orderData": {
    "id": "order-uuid",
    "customer_email": "customer@email.com",
    "customer_name": "John Doe",
    "total_price": 599.99,
    "created_at": "2025-08-18T12:00:00Z"
  },
  "trackingData": { // Only for shipping_confirmation
    "tracking_code": "1Z999AA1234567890",
    "carrier": "USPS",
    "tracking_url": "https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=1Z999AA1234567890"
  }
}
```

### 6. Update Order Status
```javascript
POST /functions/v1/order-management

{
  "action": "update_order_status",
  "order_id": "order-uuid",
  "order_data": {
    "new_status": "shipped",
    "notes": "Package shipped with tracking",
    "changed_by": "frontend_system"
  }
}
```

### 7. Trigger Order Automation
```javascript
POST /functions/v1/order-automation

{
  "action": "order_created", // or "status_changed", "shipping_label_created"
  "orderData": {
    "id": "order-uuid",
    "customer_email": "customer@email.com",
    "customer_name": "John Doe",
    "status": "payment_confirmed"
  }
}
```

---

## Complete Order Flow Examples

### Stripe Order (Core Products)
```javascript
const processStripeOrder = async (cartData) => {
  // 1. Create payment intent
  const paymentResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/stripe-payment-intent`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: cartData.total,
        cartItems: cartData.items,
        customerEmail: cartData.customer.email,
        shippingAddress: cartData.shippingAddress
      })
    }
  );
  
  const { data } = await paymentResponse.json();
  
  // 2. Process payment with Stripe.js (frontend)
  // ... Stripe payment confirmation ...
  
  // 3. Trigger automation after successful payment
  await fetch(`${SUPABASE_URL}/functions/v1/order-automation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'order_created',
      orderData: {
        id: data.orderId,
        customer_email: cartData.customer.email,
        status: 'payment_confirmed'
      }
    })
  });
  
  return data;
};
```

### Catalog Order (Direct)
```javascript
const processCatalogOrder = async (cartData) => {
  // 1. Create order directly
  const orderResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/order-management`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'create_order_queue_entry',
        order_data: {
          order_id: `KCT-${Date.now()}`,
          customer_email: cartData.customer.email,
          customer_name: cartData.customer.name,
          total_amount: cartData.total,
          items: cartData.items
        }
      })
    }
  );
  
  const { data } = await orderResponse.json();
  
  // 2. Send confirmation email
  await fetch(`${SUPABASE_URL}/functions/v1/order-automation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'order_created',
      orderData: data
    })
  });
  
  return data;
};
```

### Complete Shipping Flow
```javascript
const processShipping = async (orderId, shippingAddress) => {
  // 1. Get shipping rates
  const ratesResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/shipping-rates`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        toAddress: shippingAddress,
        weight: 16,
        dimensions: { length: 12, width: 9, height: 3 }
      })
    }
  );
  
  const { data: ratesData } = await ratesResponse.json();
  
  // 2. User selects rate, create label
  const selectedRate = ratesData.rates[0]; // User selection
  
  const labelResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/shipping-label`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        rateId: selectedRate.id,
        orderId
      })
    }
  );
  
  const { data: labelData } = await labelResponse.json();
  
  // 3. Update order status
  await fetch(`${SUPABASE_URL}/functions/v1/order-management`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'update_order_status',
      order_id: orderId,
      order_data: {
        new_status: 'shipped',
        notes: `Shipped with tracking: ${labelData.trackingNumber}`
      }
    })
  });
  
  // 4. Send shipping confirmation email
  await fetch(`${SUPABASE_URL}/functions/v1/order-automation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'shipping_label_created',
      orderData: {
        id: orderId,
        tracking_number: labelData.trackingNumber,
        carrier: labelData.carrier
      }
    })
  });
  
  return labelData;
};
```

---

## Order Status Values

```
pending_payment → payment_confirmed → processing → 
in_production → quality_check → packaging → 
shipped → out_for_delivery → delivered → completed

// Alternative flows:
cancelled, refunded, on_hold, exception
```

---

## Email Types

- `order_confirmation` - New order confirmation
- `shipping_confirmation` - Order shipped with tracking
- `delivery_confirmation` - Order delivered
- `admin_new_order` - Admin notification

---

## Product Source Types

- `core_stripe` - Stripe-managed core products
- `catalog_supabase` - Custom catalog products

---

## Error Handling

```javascript
const handleAPICall = async (url, data) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return result.data;
  } catch (error) {
    console.error('API call failed:', error.message);
    throw error;
  }
};
```

---

## Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_PUBLISHABLE_KEY=pk_...
```

---

**For complete documentation, see KCT_Menswear_Frontend_Integration_Documentation.md**