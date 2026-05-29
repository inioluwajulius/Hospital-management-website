# Multi-Tenant SaaS Implementation Guide

## Overview

This guide explains how to implement multi-tenancy in your Hospital Management System. The system will support:

- **Super Admin**: Platform-level user who creates and manages hospitals
- **Hospital Admins**: Hospital-specific administrators who manage their hospital
- **Hospital Users**: Doctors, nurses, patients, etc. who belong to one hospital
- **Data Isolation**: Each hospital's data is isolated from others

## Architecture

```
┌─────────────────────────────────────────┐
│   Hospital Management SaaS Platform     │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    Super Admin (Platform)        │  │
│  │  - Create Hospitals              │  │
│  │  - Manage Billing                │  │
│  │  - View Analytics                │  │
│  └──────────────────────────────────┘  │
│           ↓                             │
│  ┌──────────────────────────────────┐  │
│  │  Hospital A       Hospital B      │  │
│  │  ┌────────────┐  ┌────────────┐  │  │
│  │  │Hospital    │  │Hospital    │  │  │
│  │  │Admin       │  │Admin       │  │  │
│  │  └────────────┘  └────────────┘  │  │
│  │       ↓                ↓          │  │
│  │  ┌─────────────┐ ┌──────────┐   │  │
│  │  │ Staff       │ │  Staff   │   │  │
│  │  │ Patients    │ │ Patients │   │  │
│  │  │ Data        │ │   Data   │   │  │
│  │  └─────────────┘ └──────────┘   │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Database Schema Changes

### 1. Hospital Model (New)
Stores tenant profiles:
```
Hospital {
  _id: ObjectId
  name: String (unique)
  slug: String (unique, for URL: hospital-name)
  subdomain: String (optional, for subdomains: hospitalname.app.com)
  customDomain: String (optional, for custom domains: hospital.com)
  superAdmin: ObjectId (ref to User)
  status: String (active, inactive, suspended)
  subscriptionTier: String (free, pro, enterprise)
  maxUsers: Number
  currentUserCount: Number
  features: {
    appointments: Boolean
    billing: Boolean
    pharmacy: Boolean
    radiology: Boolean
    laboratory: Boolean
    medicalRecords: Boolean
    audit: Boolean
  }
  branding: {
    primaryColor: String
    secondaryColor: String
    accentColor: String
  }
  settings: {
    timeZone: String
    dateFormat: String
    currency: String
    twoFactorEnabled: Boolean
  }
  createdAt: Date
  updatedAt: Date
}
```

### 2. User Model (Updated)
Added multi-tenancy fields:
```
User {
  // ... existing fields ...
  
  // NEW: Multi-tenancy
  hospitalId: ObjectId (ref to Hospital) - sparse
  isSuperAdmin: Boolean
  
  // NEW: Invitation System
  invitationToken: String
  invitationExpires: Date
  invitedBy: ObjectId (ref to User)
  
  // NEW: Authentication Tracking
  lastLogin: Date
  loginCount: Number
}

// IMPORTANT: Unique index on email per hospital
db.users.createIndex({ email: 1, hospitalId: 1 }, { unique: true, sparse: true })
```

### 3. HospitalAdmin Model (New)
Tracks hospital administrators:
```
HospitalAdmin {
  _id: ObjectId
  userId: ObjectId (ref to User)
  hospitalId: ObjectId (ref to Hospital)
  role: String (hospital_admin, hospital_manager, department_head)
  permissions: {
    createUsers: Boolean
    editUsers: Boolean
    deleteUsers: Boolean
    inviteStaff: Boolean
    editHospitalSettings: Boolean
    manageBilling: Boolean
    viewReports: Boolean
    ... more permissions
  }
  status: String (active, inactive, suspended)
  approvedBy: ObjectId (ref to User)
  approvedAt: Date
}
```

### 4. SuperAdmin Model (New)
Tracks platform administrators:
```
SuperAdmin {
  _id: ObjectId
  userId: ObjectId (ref to User)
  permissions: {
    createHospitals: Boolean
    editHospitals: Boolean
    deleteHospitals: Boolean
    manageBilling: Boolean
    viewAnalytics: Boolean
  }
  status: String (active, inactive)
}
```

## Integration Steps

### Step 1: Update User Registration

**File**: `hospital-backend/controllers/authController.js`

Modify the `register` function to support multi-tenancy:

```javascript
exports.register = async (req, res) => {
  const { name, email, password, role, hospitalId } = req.body;
  
  // For staff registration: user must provide hospitalId or be invited
  if (role !== 'patient' && !hospitalId) {
    return res.status(400).json({ error: 'Hospital ID required for staff registration' });
  }
  
  // For patient registration: hospitalId is optional
  
  // Check if user exists in hospital (multi-tenant unique constraint)
  const existingUser = await User.findOne({ email, hospitalId });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered in this hospital' });
  }
  
  // Create user with hospitalId
  const user = await User.create({
    name,
    email,
    password: await bcryptjs.hash(password, 10),
    role,
    hospitalId,
    status: role === 'patient' ? 'pending' : 'active',
  });
  
  // ... rest of registration logic
};
```

### Step 2: Update User Login

**File**: `hospital-backend/controllers/authController.js`

Modify the `login` function to support tenant context:

```javascript
exports.login = async (req, res) => {
  const { email, password, hospitalId } = req.body;
  
  // Find user by email and hospital
  const user = await User.findOne({
    email: email.toLowerCase(),
    $or: [
      { isSuperAdmin: true },
      { hospitalId: hospitalId ? mongoose.Types.ObjectId(hospitalId) : null }
    ]
  }).select('+password');
  
  if (!user || !(await bcryptjs.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create JWT with hospital context
  const token = jwt.sign({
    userId: user._id,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    hospitalId: user.hospitalId,
    role: user.role,
  }, process.env.JWT_SECRET, { expiresIn: '24h' });
  
  res.json({ token, user });
};
```

### Step 3: Add Tenant Middleware to Server

**File**: `hospital-backend/server.js`

Add tenant middleware to app:

```javascript
const { tenantMiddleware, tenantDataFilter } = require('./middleware/tenantMiddleware');

// Add after authentication middleware
app.use(tenantMiddleware);
app.use(tenantDataFilter);
```

### Step 4: Register New Routes

**File**: `hospital-backend/server.js`

Add super admin and hospital admin routes:

```javascript
const superAdminRoutes = require('./routes/api/v1/superAdminRoutes');
const hospitalAdminRoutes = require('./routes/api/v1/hospitalAdminRoutes');

// Mount routes
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/hospital-admin', hospitalAdminRoutes);
```

### Step 5: Update Existing Routes for Multi-Tenancy

**Example: Patient Routes**

All patient-related queries should filter by hospitalId:

```javascript
// BEFORE (single tenant)
exports.getPatients = async (req, res) => {
  const patients = await Patient.find();
  res.json(patients);
};

// AFTER (multi-tenant)
exports.getPatients = async (req, res) => {
  const hospitalId = req.tenant?.hospital?._id;
  
  if (!hospitalId) {
    return res.status(400).json({ error: 'Hospital context required' });
  }
  
  const patients = await Patient.find()
    .populate({
      path: 'userId',
      match: { hospitalId }
    })
    .sort({ createdAt: -1 });
  
  res.json(patients);
};
```

### Step 6: Update Frontend

**File**: `hospital-frontend/src/services/api.js`

Add hospital context to all requests:

```javascript
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/v1`,
});

// Add hospital context to every request
api.interceptors.request.use((config) => {
  const hospitalId = localStorage.getItem('hospitalId');
  
  if (hospitalId) {
    config.headers['X-Hospital-Id'] = hospitalId;
  }
  
  return config;
});

export default api;
```

## User Registration Flows

### 1. Super Admin Registration (First Time Setup)

```
1. Platform provides super admin credentials
2. Create User with isSuperAdmin: true
3. Create SuperAdmin record
4. SuperAdmin can now create hospitals
```

### 2. Hospital Creation Flow

```
1. SuperAdmin logs in
2. Creates hospital via /api/v1/super-admin/hospitals
3. System creates:
   - Hospital record
   - Initial Hospital Admin user
   - HospitalAdmin record
4. Hospital Admin receives credentials
```

### 3. Staff Registration/Invitation Flow

```
1. Hospital Admin sends invite to staff via /api/v1/hospital-admin/staff/invite
2. System creates User with:
   - invitationToken
   - status: 'pending'
3. Staff receives email with link to accept invite
4. Staff clicks link, sets password
5. Status changes to 'active'
```

### 4. Patient Registration Flow

```
Option A: Self Registration
1. Patient visits hospital subdomain or custom domain
2. Fills registration form
3. System creates User with hospitalId extracted from domain
4. Status is 'pending' until hospital admin approves

Option B: Hospital Invitation
1. Hospital admin invites patient
2. Patient accepts invitation
3. Status becomes 'active'
```

## Environment Variables

Add these to `.env`:

```
# Tenant/Hospital
HOSPITAL_SUBDOMAIN_PATTERN=*.yourhospitalapp.com
HOSPITAL_BASE_DOMAIN=yourhospitalapp.com

# SuperAdmin
SUPER_ADMIN_EMAIL=superadmin@yourhospitalapp.com
SUPER_ADMIN_PASSWORD=securepassword123

# Frontend
VITE_MULTI_TENANT_ENABLED=true
VITE_SUBDOMAIN_ENABLED=true
```

## API Endpoints Reference

### Super Admin APIs

```
POST   /api/v1/super-admin/hospitals           Create hospital
GET    /api/v1/super-admin/hospitals           List hospitals
GET    /api/v1/super-admin/hospitals/:id       Get hospital
PUT    /api/v1/super-admin/hospitals/:id       Update hospital
PATCH  /api/v1/super-admin/hospitals/:id/status  Suspend/activate
GET    /api/v1/super-admin/hospitals/:id/stats   Hospital statistics
```

### Hospital Admin APIs

```
GET    /api/v1/hospital-admin/profile         Get hospital profile
PUT    /api/v1/hospital-admin/profile         Update profile
GET    /api/v1/hospital-admin/staff           List staff
POST   /api/v1/hospital-admin/staff/invite    Invite staff
POST   /api/v1/hospital-admin/staff/:id/resend-invitation
POST   /api/v1/hospital-admin/invitations/:token/accept
GET    /api/v1/hospital-admin/admins          List hospital admins
POST   /api/v1/hospital-admin/admins/:id/promote
```

## Security Considerations

### 1. Data Isolation
- Always filter queries by hospitalId
- Use middleware to enforce tenant context
- Add compound indexes on (hospitalId, fieldName)

### 2. Authentication
- JWT tokens include hospitalId
- Verify user belongs to hospital
- Middleware checks auth + tenant authorization

### 3. Role-Based Access Control (RBAC)
```
Super Admin > Hospital Admin > Staff > Patient
```

### 4. Audit Logging
- Log all administrative actions
- Track who invited whom
- Monitor access patterns

## Testing

### Test Case 1: Create Hospital
```bash
curl -X POST http://localhost:5000/api/v1/super-admin/hospitals \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City Hospital",
    "slug": "city-hospital",
    "subdomain": "city",
    "hospitalAdminEmail": "admin@cityhospital.com",
    "hospitalAdminName": "John Admin",
    "hospitalAdminPassword": "SecurePass123!"
  }'
```

### Test Case 2: Login to Hospital
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityhospital.com",
    "password": "SecurePass123!",
    "hospitalId": "HOSPITAL_ID"
  }'
```

### Test Case 3: Invite Staff
```bash
curl -X POST http://localhost:5000/api/v1/hospital-admin/staff/invite \
  -H "Authorization: Bearer HOSPITAL_ADMIN_TOKEN" \
  -H "X-Hospital-Id: HOSPITAL_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Smith",
    "email": "jane@cityhospital.com",
    "role": "doctor",
    "department": "Cardiology"
  }'
```

## Migration Path

If migrating from single-tenant to multi-tenant:

1. **Phase 1**: Add new fields to User model (hospitalId, isSuperAdmin)
2. **Phase 2**: Migrate existing data - assign all users to "Main Hospital"
3. **Phase 3**: Create Hospital record for existing system
4. **Phase 4**: Deploy tenant middleware
5. **Phase 5**: Enable multi-tenant features gradually

## Performance Optimization

### Indexes
```javascript
// User indexes
db.users.createIndex({ email: 1, hospitalId: 1 })
db.users.createIndex({ hospitalId: 1, role: 1 })
db.users.createIndex({ isSuperAdmin: 1 })

// Hospital indexes
db.hospitals.createIndex({ slug: 1 })
db.hospitals.createIndex({ subdomain: 1 })
db.hospitals.createIndex({ superAdmin: 1 })

// HospitalAdmin indexes
db.hospitaladmins.createIndex({ hospitalId: 1, userId: 1 })
db.hospitaladmins.createIndex({ hospitalId: 1, status: 1 })
```

### Caching
- Cache hospital profile (30 min TTL)
- Cache user permissions (5 min TTL)
- Invalidate on update

## Troubleshooting

### Issue: "Hospital context required"
- Check X-Hospital-Id header is sent
- Verify hospitalId in JWT token
- Check tenant middleware is applied

### Issue: "Data not visible across hospitals"
- Verify hospitalId filter is applied
- Check compound indexes exist
- Review database queries

### Issue: User can't log in
- Verify hospitalId in login payload
- Check user exists in hospital
- Review auth middleware order

## Next Steps

1. ✅ Models created (Hospital, SuperAdmin, HospitalAdmin, updated User)
2. ✅ Middleware created (tenant identification, authorization)
3. ✅ Controllers created (superAdminController, hospitalAdminController)
4. ✅ Routes created (superAdminRoutes, hospitalAdminRoutes)
5. ⬜ Update authController for multi-tenant registration
6. ⬜ Update server.js to add middleware and routes
7. ⬜ Update all existing routes for tenant filtering
8. ⬜ Update frontend for multi-tenant UI
9. ⬜ Create email service for invitations
10. ⬜ Add audit logging
11. ⬜ Deploy and test

