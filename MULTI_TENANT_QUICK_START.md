# Multi-Tenant Integration - Quick Start

## What's Been Created

✅ **Models**
- `Hospital.js` - Tenant profiles
- `SuperAdmin.js` - Platform administrators
- `HospitalAdmin.js` - Hospital-level administrators
- `User.js` - Updated with hospitalId and multi-tenancy fields

✅ **Middleware**
- `tenantMiddleware.js` - Tenant identification and context injection

✅ **Controllers**
- `superAdminController.js` - Create/manage hospitals
- `hospitalAdminController.js` - Hospital admin operations (invite staff, etc)

✅ **Routes**
- `routes/api/v1/superAdminRoutes.js`
- `routes/api/v1/hospitalAdminRoutes.js`

✅ **Documentation**
- `MULTI_TENANT_IMPLEMENTATION.md` - Comprehensive guide

## What You Need to Do

### 1. Update server.js (Backend Setup)

Add to your `hospital-backend/server.js`:

```javascript
// Add these imports at the top
const { tenantMiddleware, tenantDataFilter } = require('./middleware/tenantMiddleware');
const superAdminRoutes = require('./routes/api/v1/superAdminRoutes');
const hospitalAdminRoutes = require('./routes/api/v1/hospitalAdminRoutes');

// In your app setup, add these lines AFTER authentication middleware:
app.use(tenantMiddleware);      // Extract tenant context
app.use(tenantDataFilter);      // Prepare tenant filters

// Add these route mounts (after existing routes):
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/hospital-admin', hospitalAdminRoutes);
```

### 2. Update authController.js

Modify your registration and login to support hospitalId:

```javascript
// In register function
const user = await User.create({
  name,
  email,
  password: hashedPassword,
  role: req.body.role || 'patient',
  hospitalId: req.body.hospitalId, // NEW - can be provided or null for patients
  status: req.body.role !== 'patient' ? 'active' : 'pending',
});

// In login function - update user query
const user = await User.findOne({
  email: email.toLowerCase(),
  hospitalId: req.body.hospitalId || undefined,
}).select('+password');

// Include hospitalId in JWT
const token = jwt.sign({
  userId: user._id,
  email: user.email,
  hospitalId: user.hospitalId,  // NEW
  isSuperAdmin: user.isSuperAdmin, // NEW
  role: user.role,
}, process.env.JWT_SECRET, { expiresIn: '24h' });
```

### 3. Create Initial Super Admin (One-Time Setup)

Run this script once to create your first super admin:

```bash
# hospital-backend/scripts/createSuperAdmin.js
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');

require('dotenv').config();

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = 'superadmin@yourhospitalapp.com';
    const password = 'SuperAdmin@123'; // Change this!

    // Check if already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('Super admin already exists');
      process.exit(0);
    }

    // Create user
    user = await User.create({
      name: 'Platform Super Admin',
      email,
      password: await bcryptjs.hash(password, 10),
      role: 'super_admin',
      isSuperAdmin: true,
      status: 'active',
    });

    // Create SuperAdmin record
    await SuperAdmin.create({
      userId: user._id,
      email,
      status: 'active',
    });

    console.log('✅ Super admin created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSuperAdmin();
```

Run it:
```bash
cd hospital-backend
node scripts/createSuperAdmin.js
```

### 4. Update Existing Routes for Multi-Tenancy

Example for Patient routes - apply this pattern to ALL routes:

```javascript
// BEFORE
exports.getAllPatients = async (req, res) => {
  const patients = await Patient.find().populate('userId');
  res.json(patients);
};

// AFTER
exports.getAllPatients = async (req, res) => {
  const hospitalId = req.tenant?.hospital?._id;
  
  if (!hospitalId && !req.user.isSuperAdmin) {
    return res.status(400).json({ error: 'Hospital context required' });
  }

  const query = hospitalId ? { hospitalId } : {};
  const patients = await Patient.find(query).populate('userId');
  res.json(patients);
};
```

### 5. Update Frontend

Update login to support hospital selection:

```javascript
// hospital-frontend/src/pages/auth/Login.jsx

const handleLogin = async (credentials) => {
  try {
    // If hospital-specific login
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      hospitalId: credentials.hospitalId, // NEW - optional
    });

    // Store hospital context
    if (response.data.user.hospitalId) {
      localStorage.setItem('hospitalId', response.data.user.hospitalId);
      localStorage.setItem('hospitalName', response.data.hospital?.name);
    }

    localStorage.setItem('token', response.data.token);
    navigate('/dashboard');
  } catch (error) {
    setError(error.response?.data?.error || 'Login failed');
  }
};
```

### 6. Update API Service

Add hospital context to all requests:

```javascript
// hospital-frontend/src/services/api.js

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const hospitalId = localStorage.getItem('hospitalId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (hospitalId) {
    config.headers['X-Hospital-Id'] = hospitalId;
  }

  return config;
});

export default api;
```

### 7. Create Hospital Onboarding UI

Create a page for Super Admin to create hospitals:

```javascript
// hospital-frontend/src/pages/admin/CreateHospital.jsx

const CreateHospital = () => {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    subdomain: '',
    hospitalAdminEmail: '',
    hospitalAdminName: '',
    hospitalAdminPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/super-admin/hospitals', form);
      toast.success('Hospital created successfully!');
      navigate('/super-admin/hospitals');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create hospital');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Hospital</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <input type="text" placeholder="Hospital Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
        {/* Add other form fields */}
        <button type="submit" className="bg-primary text-white px-6 py-2 rounded">Create Hospital</button>
      </form>
    </div>
  );
};

export default CreateHospital;
```

## Testing Multi-Tenancy

### Test 1: Create Super Admin
```bash
npm run create:super-admin
```

### Test 2: Login as Super Admin
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@yourhospitalapp.com",
    "password": "SuperAdmin@123"
  }'
```

### Test 3: Create Hospital
```bash
curl -X POST http://localhost:5000/api/v1/super-admin/hospitals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Central Hospital",
    "slug": "central-hospital",
    "subdomain": "central",
    "hospitalAdminEmail": "admin@centralhospital.com",
    "hospitalAdminName": "Dr. Admin",
    "hospitalAdminPassword": "AdminPass@123"
  }'
```

### Test 4: Login as Hospital Admin
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@centralhospital.com",
    "password": "AdminPass@123",
    "hospitalId": "RETURNED_HOSPITAL_ID"
  }'
```

### Test 5: Invite Staff
```bash
curl -X POST http://localhost:5000/api/v1/hospital-admin/staff/invite \
  -H "Authorization: Bearer HOSPITAL_ADMIN_TOKEN" \
  -H "X-Hospital-Id: HOSPITAL_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Smith",
    "email": "jane@centralhospital.com",
    "role": "doctor",
    "department": "Cardiology"
  }'
```

## Common Issues & Solutions

### Issue: "Hospital context required" error
**Solution**: Make sure you're sending `X-Hospital-Id` header or `?hospitalId=xxx` in requests

### Issue: User can't login to hospital
**Solution**: Check that user's `hospitalId` matches the one in request

### Issue: Data visible across hospitals
**Solution**: Ensure all queries filter by `hospitalId` from `req.tenant`

### Issue: Email unique constraint error
**Solution**: Compound index on `(email, hospitalId)` should be created - check database

## Database Migration

If you're migrating existing data:

```bash
# Connect to MongoDB
mongosh

# Create indexes
db.users.createIndex({ email: 1, hospitalId: 1 }, { unique: true, sparse: true })
db.hospitals.createIndex({ slug: 1 })
db.hospitaladmins.createIndex({ hospitalId: 1, userId: 1 })

# Assign existing users to a "main" hospital
db.users.updateMany({}, { $set: { hospitalId: ObjectId("MAIN_HOSPITAL_ID"), isSuperAdmin: false } })
```

## Next Steps

1. ✅ Update `server.js` with middleware and routes
2. ✅ Update `authController.js` for multi-tenant login/registration
3. ✅ Create Super Admin using setup script
4. ✅ Update all route controllers to filter by hospitalId
5. ✅ Update frontend login/API service
6. ✅ Create Hospital Onboarding UI
7. ✅ Create Staff Invitation UI
8. ✅ Test end-to-end flow

## Support & Questions

See `MULTI_TENANT_IMPLEMENTATION.md` for detailed documentation.

Good luck! 🚀
