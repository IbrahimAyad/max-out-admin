# Website Integration Guide

## Updates Required for Customer-Facing Website

### 1. Secure Checkout Implementation

Replace direct Stripe calls with our secure Edge Function:

```javascript
// services/checkout.js
export async function createCheckout(items, customerEmail) {
  const response = await fetch(
    'https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/create-checkout-secure',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        items: items.map(item => ({
          price_id: item.stripe_price_id,
          quantity: item.quantity
        })),
        customer_email: customerEmail,
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/cart`
      })
    }
  );

  const { checkoutUrl } = await response.json();
  
  // Redirect to Stripe Checkout
  window.location.href = checkoutUrl;
}
```

### 2. User Profile Integration

Implement user sizing and style preferences:

```javascript
// hooks/useUserProfile.js
export function useUserProfile() {
  const { user } = useAuth();
  
  // Fetch user profile
  const getProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    return data;
  };
  
  // Update profile
  const updateProfile = async (updates) => {
    const { data } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      });
    return data;
  };
  
  return { getProfile, updateProfile };
}
```

### 3. Order Status Tracking

Use the orders table for real-time status:

```javascript
// pages/orders/[id].js
export function OrderStatus({ orderId }) {
  const [order, setOrder] = useState(null);
  
  useEffect(() => {
    // Subscribe to order updates
    const subscription = supabase
      .from('orders')
      .on('UPDATE', {
        filter: `id=eq.${orderId}`
      }, payload => {
        setOrder(payload.new);
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [orderId]);
  
  return (
    <div>
      <h2>Order #{order?.order_number}</h2>
      <p>Status: {order?.status}</p>
      {/* Show status timeline */}
    </div>
  );
}
```

### 4. Product Sync Updates

Products now have Stripe IDs synced:

```javascript
// Make sure to use stripe_product_id and stripe_price_id
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    product_variants (
      id,
      title,
      price,
      stripe_price_id  // Use this for checkout
    )
  `)
  .not('stripe_product_id', 'is', null); // Only show synced products
```

### 5. Customer Authentication

Link customers to user_profiles:

```javascript
// After user signs up
const handleSignUp = async (email, password, metadata) => {
  // Create auth user
  const { user } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  
  // Profile is auto-created by trigger
  // Just update with additional info if needed
  if (user) {
    await supabase.from('user_profiles').update({
      full_name: metadata.full_name,
      phone: metadata.phone
    }).eq('user_id', user.id);
  }
};
```

## Environment Variables

Add these to your website's .env:

```bash
# Already have these
NEXT_PUBLIC_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Add this for Stripe (public key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW
```

## Testing Checklist

- [ ] Products load with Stripe IDs
- [ ] Checkout redirects to Stripe
- [ ] Order created in database after payment
- [ ] Customer receives confirmation email
- [ ] Order status updates in real-time
- [ ] User profile saves preferences
- [ ] Size recommendations work

## API Endpoints Available

Your Edge Functions provide these endpoints:

```
POST /functions/v1/create-checkout-secure
POST /functions/v1/sync-stripe-products
POST /functions/v1/send-order-confirmation-secure
POST /functions/v1/ai-recommendations
POST /functions/v1/bundle-builder-secure
```

## Security Notes

1. **Never expose service role key** on the website
2. **Always use Edge Functions** for sensitive operations
3. **Validate all inputs** before database writes
4. **Use RLS policies** to protect data

## Support

If the website team needs help:
1. Check Edge Function logs in Supabase Dashboard
2. Verify webhook events in Stripe Dashboard
3. Test with Stripe test mode first
4. Check browser console for errors

---

Send this guide to your website team for integration!