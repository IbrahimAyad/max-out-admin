# Wedding Management API Documentation

API endpoints for the wedding management system on the customer-facing website.

## Base URL

```
Development: http://localhost:3000/api/weddings
Production: https://www.kctmenswear.com/api/weddings
```

## Authentication

Most wedding endpoints require authentication. Party members can access via invite code.

```javascript
// Headers for authenticated requests
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

## Wedding Portal Endpoints

### Create Wedding

**POST** `/api/weddings/create`

Creates a new wedding and registers the couple.

Request:
```json
{
  "partner1": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "555-0100",
    "password": "secure_password"
  },
  "partner2": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "555-0101"
  },
  "wedding": {
    "date": "2025-10-15",
    "venue_name": "Grand Ballroom",
    "venue_city": "New York",
    "venue_state": "NY",
    "guest_count": 150,
    "wedding_theme": "classic",
    "formality_level": "black-tie"
  }
}
```

Response:
```json
{
  "success": true,
  "wedding": {
    "id": "uuid",
    "wedding_code": "SMITH2025",
    "wedding_url": "https://kctmenswear.com/wedding/smith-doe-2025",
    "access_token": "jwt_token"
  },
  "message": "Wedding created successfully! Check your email for confirmation."
}
```

### Get Wedding Details

**GET** `/api/weddings/{wedding_id}`

Requires authentication or valid wedding code.

Response:
```json
{
  "id": "uuid",
  "wedding_code": "SMITH2025",
  "partner1_name": "John Smith",
  "partner2_name": "Jane Doe",
  "wedding_date": "2025-10-15",
  "venue": {
    "name": "Grand Ballroom",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY"
  },
  "stats": {
    "days_until": 180,
    "party_size": 6,
    "measurements_complete": 4,
    "outfits_confirmed": 3,
    "total_cost": 2499.99,
    "amount_paid": 500.00
  },
  "timeline": {
    "selection_deadline": "2025-07-15",
    "measurement_deadline": "2025-08-15",
    "payment_deadline": "2025-09-01",
    "delivery_date": "2025-10-01"
  }
}
```

### Update Wedding

**PUT** `/api/weddings/{wedding_id}`

Updates wedding details. Requires authentication.

Request:
```json
{
  "venue_name": "Updated Venue",
  "guest_count": 200,
  "color_scheme": ["#000080", "#C0C0C0", "#FFD700"]
}
```

## Party Member Management

### Invite Party Members

**POST** `/api/weddings/{wedding_id}/party/invite`

Sends invitations to groomsmen.

Request:
```json
{
  "invitations": [
    {
      "first_name": "Mike",
      "last_name": "Johnson",
      "email": "mike@example.com",
      "phone": "555-0102",
      "role": "best_man"
    },
    {
      "first_name": "Tom",
      "last_name": "Wilson",
      "email": "tom@example.com",
      "role": "groomsman"
    }
  ],
  "message": "You're invited to be part of our wedding party!",
  "send_immediately": true
}
```

Response:
```json
{
  "success": true,
  "invited": 2,
  "invitations": [
    {
      "member_id": "uuid",
      "invite_code": "MIKE2025XYZ",
      "email_sent": true
    }
  ]
}
```

### Join Wedding (For Groomsmen)

**POST** `/api/weddings/join`

Allows party members to join via invite code.

Request:
```json
{
  "invite_code": "MIKE2025XYZ",
  "password": "secure_password",
  "accept_invitation": true
}
```

Response:
```json
{
  "success": true,
  "wedding": {
    "id": "uuid",
    "couple_names": "John & Jane",
    "wedding_date": "2025-10-15",
    "your_role": "best_man"
  },
  "member": {
    "id": "uuid",
    "access_token": "jwt_token"
  },
  "next_steps": [
    "Complete your measurements",
    "Review outfit selections",
    "Confirm attendance"
  ]
}
```

### Get Party Members

**GET** `/api/weddings/{wedding_id}/party`

Returns all party members and their status.

Response:
```json
{
  "members": [
    {
      "id": "uuid",
      "name": "Mike Johnson",
      "role": "best_man",
      "email": "mike@example.com",
      "status": {
        "invitation": "accepted",
        "measurements": "confirmed",
        "outfit": "selected",
        "payment": "pending"
      },
      "outfit_total": 399.99
    }
  ],
  "summary": {
    "total_members": 6,
    "confirmed": 5,
    "pending": 1
  }
}
```

## Measurements

### Submit Measurements

**POST** `/api/weddings/members/{member_id}/measurements`

Submits or updates party member measurements.

Request:
```json
{
  "measurements": {
    "chest": 42,
    "waist": 34,
    "inseam": 32,
    "neck": 15.5,
    "sleeve": 34,
    "shoe_size": 10,
    "height": 72,
    "weight": 180
  },
  "fit_preferences": {
    "jacket_fit": "slim",
    "trouser_fit": "slim",
    "shirt_fit": "regular"
  },
  "notes": "Slightly longer jacket preferred"
}
```

Response:
```json
{
  "success": true,
  "size_recommendations": {
    "jacket": "42R",
    "trouser": "34x32",
    "shirt": "15.5/34",
    "shoes": "10"
  },
  "confidence_score": 0.95,
  "requires_fitting": false
}
```

### Get Size Chart

**GET** `/api/weddings/size-chart`

Returns sizing information and measurement guide.

Response:
```json
{
  "size_chart": {
    "jackets": {
      "38R": {"chest": 38, "waist": 32, "sleeve": 32},
      "40R": {"chest": 40, "waist": 34, "sleeve": 33},
      "42R": {"chest": 42, "waist": 36, "sleeve": 34}
    },
    "trousers": {
      "30x30": {"waist": 30, "inseam": 30},
      "32x30": {"waist": 32, "inseam": 30}
    }
  },
  "measurement_guide": {
    "chest": "Measure around fullest part...",
    "waist": "Measure around natural waist..."
  },
  "video_tutorials": [
    {
      "title": "How to Measure Chest",
      "url": "https://..."
    }
  ]
}
```

## Outfit Selection

### Get Available Outfits

**GET** `/api/weddings/{wedding_id}/outfits`

Returns outfit options for the wedding.

Query Parameters:
- `role` - Filter by role (groom, groomsman, etc.)
- `budget_max` - Maximum price
- `style` - Style preference

Response:
```json
{
  "outfits": [
    {
      "id": "uuid",
      "name": "Classic Black Tuxedo",
      "description": "Timeless elegance",
      "role_type": "groom",
      "items": {
        "jacket": {
          "product_id": "uuid",
          "name": "Black Tuxedo Jacket",
          "image": "url",
          "rental_price": 150,
          "purchase_price": 599
        },
        "trouser": {...},
        "shirt": {...},
        "accessories": [...]
      },
      "total_rental": 299,
      "total_purchase": 999,
      "image_url": "url"
    }
  ],
  "recommended": [...],
  "filters": {
    "colors": ["black", "navy", "grey"],
    "styles": ["classic", "modern", "slim"]
  }
}
```

### Select Outfit

**POST** `/api/weddings/members/{member_id}/outfit`

Selects outfit for a party member.

Request:
```json
{
  "outfit_id": "uuid",
  "customizations": {
    "jacket": {
      "product_id": "uuid",
      "variant_id": "uuid",
      "size": "42R",
      "rental": true
    },
    "trouser": {
      "product_id": "uuid",
      "variant_id": "uuid",
      "size": "34x32",
      "rental": true,
      "alterations": ["hem"]
    },
    "accessories": [
      {
        "product_id": "uuid",
        "variant_id": "uuid",
        "rental": false
      }
    ]
  },
  "monogram": "MJ",
  "special_requests": "Extra long tie"
}
```

Response:
```json
{
  "success": true,
  "outfit": {
    "id": "uuid",
    "total_rental": 299,
    "alterations_cost": 25,
    "total_cost": 324,
    "items": [...]
  },
  "requires_approval": false
}
```

### Coordinate Outfits

**POST** `/api/weddings/{wedding_id}/coordinate`

Ensures all party outfits are coordinated.

Request:
```json
{
  "groom_outfit_id": "uuid",
  "groomsmen_outfit_id": "uuid",
  "color_variations": {
    "groomsmen": {
      "tie_color": "silver",
      "vest_color": "grey"
    }
  }
}
```

Response:
```json
{
  "success": true,
  "coordination_score": 0.98,
  "suggestions": [
    "Consider matching pocket squares",
    "Boutonnieres will complement the color scheme"
  ],
  "visual_preview": "url_to_preview_image"
}
```

## Orders & Payment

### Create Wedding Order

**POST** `/api/weddings/{wedding_id}/orders/create`

Creates order for entire wedding party.

Request:
```json
{
  "include_members": ["member_id_1", "member_id_2"],
  "payment_method": "split", // full, split, individual
  "delivery_address": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  },
  "rush_order": false
}
```

Response:
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "WED-2025-0001",
    "items_count": 6,
    "subtotal": 1799.94,
    "group_discount": 269.99,
    "tax": 120.00,
    "total": 1649.95,
    "payment_url": "url_to_stripe_checkout"
  }
}
```

### Process Payment

**POST** `/api/weddings/orders/{order_id}/pay`

Processes payment for wedding order.

Request:
```json
{
  "payment_method_id": "stripe_pm_id",
  "split_payments": [
    {
      "member_id": "uuid",
      "amount": 324.99,
      "email": "mike@example.com"
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "payment": {
    "status": "succeeded",
    "confirmation_number": "PAY-2025-0001",
    "receipts_sent": true
  },
  "next_steps": [
    "Fitting appointments will be scheduled",
    "You'll receive tracking information"
  ]
}
```

## Communication

### Send Message

**POST** `/api/weddings/{wedding_id}/messages`

Sends message to party members.

Request:
```json
{
  "recipients": "all", // all, role, specific member IDs
  "subject": "Reminder: Measurements Due",
  "message": "Please submit your measurements by Friday.",
  "send_sms": true,
  "send_email": true
}
```

### Get Messages

**GET** `/api/weddings/{wedding_id}/messages`

Returns message history.

## Fittings

### Schedule Fitting

**POST** `/api/weddings/fittings/schedule`

Books fitting appointment.

Request:
```json
{
  "member_id": "uuid",
  "preferred_dates": [
    "2025-09-01",
    "2025-09-02"
  ],
  "preferred_time": "morning", // morning, afternoon, evening
  "location_type": "store", // store, home, virtual
  "location_id": "store_001"
}
```

Response:
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "date": "2025-09-01",
    "time": "10:00 AM",
    "duration": "30 minutes",
    "location": {
      "name": "KCT Menswear - Manhattan",
      "address": "123 5th Avenue, New York, NY"
    },
    "assigned_stylist": "Sarah Johnson",
    "confirmation_code": "FIT-2025-001"
  }
}
```

## Analytics & Tracking

### Get Wedding Timeline

**GET** `/api/weddings/{wedding_id}/timeline`

Returns complete timeline with tasks and deadlines.

Response:
```json
{
  "timeline": [
    {
      "date": "2025-07-15",
      "title": "Selection Deadline",
      "status": "completed",
      "tasks": [...]
    },
    {
      "date": "2025-08-15",
      "title": "Measurements Due",
      "status": "in_progress",
      "completion": 66,
      "tasks": [...]
    }
  ],
  "critical_path": [...],
  "alerts": [
    "2 members haven't submitted measurements"
  ]
}
```

### Get Wedding Analytics

**GET** `/api/weddings/{wedding_id}/analytics`

Returns wedding statistics and insights.

Response:
```json
{
  "overview": {
    "total_value": 2499.99,
    "savings": 375.00,
    "completion_rate": 75
  },
  "party_stats": {
    "total_members": 6,
    "measurements_complete": 4,
    "outfits_confirmed": 5,
    "payments_received": 3
  },
  "popular_selections": {
    "most_selected_style": "Classic Black Tuxedo",
    "common_size": "42R",
    "preferred_fit": "slim"
  },
  "timeline_health": "on_track"
}
```

## Webhooks

### Wedding Events

Your application can subscribe to wedding events:

```javascript
POST https://your-app.com/webhooks/wedding

Events:
- wedding.created
- wedding.updated
- party_member.invited
- party_member.joined
- measurements.submitted
- outfit.selected
- order.created
- order.paid
- fitting.scheduled
- wedding.completed
```

Example webhook payload:
```json
{
  "event": "party_member.joined",
  "timestamp": "2025-08-09T10:00:00Z",
  "data": {
    "wedding_id": "uuid",
    "member_id": "uuid",
    "member_name": "Mike Johnson",
    "role": "best_man"
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "WEDDING_NOT_FOUND",
    "message": "Wedding not found or access denied",
    "details": {}
  }
}
```

Common error codes:
- `WEDDING_NOT_FOUND` - Wedding doesn't exist
- `INVALID_INVITE_CODE` - Invite code is invalid or expired
- `MEASUREMENTS_INCOMPLETE` - Required measurements missing
- `OUTFIT_UNAVAILABLE` - Selected outfit is not available
- `PAYMENT_FAILED` - Payment processing failed
- `DEADLINE_PASSED` - Action deadline has passed

## Rate Limiting

- Public endpoints: 60 requests/minute
- Authenticated endpoints: 180 requests/minute
- Payment endpoints: 10 requests/minute

## Testing

### Test Wedding Codes

Use these codes in development:
- `TEST2025` - Sample wedding with full party
- `DEMO2025` - Demo wedding for presentations
- `RUSH2025` - Rush order scenario

### Test Credit Cards

Use Stripe test cards:
- `4242 4242 4242 4242` - Success
- `4000 0000 0000 0002` - Decline

## SDK Examples

### JavaScript/React

```javascript
import { WeddingAPI } from '@kct/wedding-sdk';

const api = new WeddingAPI({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Create wedding
const wedding = await api.createWedding({
  partner1: {...},
  partner2: {...},
  wedding: {...}
});

// Invite party members
await api.inviteMembers(wedding.id, [
  { name: 'Mike Johnson', email: 'mike@example.com', role: 'best_man' }
]);

// Get wedding details
const details = await api.getWedding(wedding.id);
```

### cURL Examples

```bash
# Create wedding
curl -X POST https://api.kctmenswear.com/weddings/create \
  -H "Content-Type: application/json" \
  -d '{"partner1": {...}, "wedding": {...}}'

# Join as groomsman
curl -X POST https://api.kctmenswear.com/weddings/join \
  -H "Content-Type: application/json" \
  -d '{"invite_code": "MIKE2025XYZ"}'
```

---

**API Version**: 1.0.0  
**Last Updated**: August 2025  
**Support**: api-support@kctmenswear.com