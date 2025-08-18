# V2 Wedding Management System - Known Issues & Requirements

**Date Created:** 2025-08-18  
**Status:** Deferred to V2  
**Priority:** High  

## Current Problem Summary

The `wedding-management` edge function is experiencing critical HTTP 500 errors when wedding codes are entered in the frontend portals. The system was originally planned for V2 but basic functionality was attempted in V1.

### Error Details
- **Error Type:** HTTP 500 Internal Server Error
- **Function:** `wedding-management`
- **Frontend Impact:** Wedding codes `WED-MEGNH86X-EI39`, `WED-MEGICOFY-66ZI` fail to authenticate
- **User Experience:** Users cannot access wedding portals

### Root Cause Analysis

The wedding management system has **architectural complexity** that requires proper V2 implementation:

1. **Missing Database Schema**
   - Complex wedding party relationships not properly defined
   - Party member roles and permissions not implemented
   - Wedding invitation workflow incomplete

2. **Business Logic Gaps**
   - Wedding code validation logic incomplete
   - Party member management features missing
   - Role-based access control not implemented

3. **Integration Dependencies**
   - EasyPost shipping integration incomplete
   - Payment processing for wedding services not configured
   - Notification system for wedding events missing

## V2 Requirements & Specifications

### Database Schema Requirements
```sql
-- Core wedding tables needed for V2
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_code VARCHAR(50) UNIQUE NOT NULL,
  couple_names JSONB NOT NULL,
  wedding_date DATE,
  venue_info JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wedding_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  member_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'bride', 'groom', 'bridesmaid', 'groomsman', etc.
  email VARCHAR(255),
  phone VARCHAR(20),
  measurements JSONB,
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wedding_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  member_id UUID REFERENCES wedding_party_members(id),
  invitation_status VARCHAR(20) DEFAULT 'pending',
  access_code VARCHAR(100) UNIQUE,
  sent_at TIMESTAMP,
  responded_at TIMESTAMP
);
```

### Business Logic Requirements

1. **Wedding Code Authentication**
   - Validate wedding codes against database
   - Generate secure access tokens
   - Handle role-based permissions

2. **Party Member Management**
   - CRUD operations for wedding party members
   - Role assignment and permission management
   - Measurement collection and storage

3. **Invitation Workflow**
   - Generate unique invitation codes
   - Send invitations via email/SMS
   - Track response status
   - Handle RSVP collection

4. **Integration Features**
   - EasyPost shipping for dress/suit deliveries
   - Payment processing for alterations
   - Real-time notifications for wedding updates

### API Endpoints Needed for V2

```typescript
// Core wedding management endpoints
POST /wedding-management/authenticate
GET /wedding-management/wedding/{wedding_code}
GET /wedding-management/party-members/{wedding_id}
POST /wedding-management/party-members
PUT /wedding-management/party-members/{member_id}
DELETE /wedding-management/party-members/{member_id}

// Invitation management
POST /wedding-management/invitations/send
GET /wedding-management/invitations/{invitation_code}
PUT /wedding-management/invitations/{invitation_id}/respond

// Measurement and fitting
POST /wedding-management/measurements
GET /wedding-management/measurements/{member_id}
POST /wedding-management/fitting-appointments
```

## Immediate V1 Workaround

**Status:** Pending Implementation  
**Approach:** Create a simplified placeholder function that:
- Validates basic wedding codes
- Returns minimal wedding information
- Allows frontend access without complex party management
- Logs all attempts for V2 development reference

## Testing Codes for V2 Development
- `WED-MEGNH86X-EI39`
- `WED-MEGICOFY-66ZI`

## Next Steps for V2
1. Design complete database schema
2. Implement comprehensive business logic
3. Create full API specification
4. Build role-based access control
5. Integrate with EasyPost and payment systems
6. Implement real-time notifications
7. Create comprehensive testing suite

---

**Note:** This document should be reviewed before V2 development begins. All wedding management features should be properly architected and tested before production deployment.