# Professional Path Restructuring - Complete Documentation

## Overview
The hospital management system has been professionally restructured with role-based separation of concerns for both frontend and backend. This modern architecture provides better scalability, maintainability, and security.

---

## 🔧 Backend Structure (`/hospital-backend`)

### New Versioned API Routes
All API endpoints now follow professional RESTful conventions with version prefixing:

```
/api/v1/auth/*          - Authentication & User Management
/api/v1/doctors/*       - Doctor-specific Operations
/api/v1/patients/*      - Patient-specific Operations
/api/v1/admin/*         - Admin Management Operations
/api/legacy/*           - Legacy endpoints (backward compatibility)
```

### Backend File Structure
```
routes/
├── api/
│   └── v1/
│       ├── authRoutes.js        (Authentication)
│       ├── doctorRoutes.js      (Doctor Management)
│       ├── patientRoutes.js     (Patient Management)
│       └── adminRoutes.js       (Admin Operations)
├── appointmentRoutes.js         (Legacy - Appointments)
├── prescriptionRoutes.js        (Legacy - Prescriptions)
├── labRoutes.js                 (Legacy - Lab Tests)
├── radiologyRoutes.js           (Legacy - Radiology)
├── billingRoutes.js             (Legacy - Billing)
├── medicalRecordRoutes.js       (Legacy - Medical Records)
├── pharmacyRoutes.js            (Legacy - Pharmacy)
├── auditRoutes.js               (Legacy - Audit Logs)
└── userRoutes.js                (Legacy - Users)
```

### API v1 Endpoints

#### Authentication (`/api/v1/auth`)
```
POST   /api/v1/auth/register     - Register new user (patient/doctor)
POST   /api/v1/auth/login        - User login
GET    /api/v1/auth/me           - Get current user info
```

#### Doctors (`/api/v1/doctors`)
```
GET    /api/v1/doctors           - List all doctors
POST   /api/v1/doctors           - Create new doctor (admin only)
PUT    /api/v1/doctors/:id       - Update doctor (admin only)
DELETE /api/v1/doctors/:id       - Delete doctor (admin only)
```

#### Patients (`/api/v1/patients`)
```
GET    /api/v1/patients          - List all patients
GET    /api/v1/patients/search/existing        - Search patients
GET    /api/v1/patients/registrations/pending  - Get pending registrations (admin)
POST   /api/v1/patients          - Create patient (admin/receptionist)
PUT    /api/v1/patients/:id      - Update patient (admin only)
PUT    /api/v1/patients/:id/approve       - Approve registration (admin)
PUT    /api/v1/patients/:id/reject        - Reject registration (admin)
DELETE /api/v1/patients/:id      - Delete patient (admin only)
```

#### Admin (`/api/v1/admin`)
```
Reserved for admin-specific operations
```

### Server Configuration
- **Database**: MongoDB Atlas
- **Port**: 5000
- **Versioning**: API v1 with backward compatibility support
- **Security**: JWT authentication, role-based access control, audit logging

---

## 🎨 Frontend Structure (`/hospital-frontend`)

### New Organized Routes

#### Authentication Routes (`/auth/*`)
```
/auth/login/:role              - User login (patient/doctor)
/auth/register/patient         - Patient registration
/auth/admin-setup              - Initial admin setup
```

#### Admin Routes (`/admin/*`)
```
/admin/register-doctor         - Register new doctor (admin only)
/admin/doctors                 - Manage doctors
/admin/patients                - Manage patients
/admin/pending-approvals       - Approve pending registrations
/admin/audit-logs              - View audit logs (admin only)
/admin/settings                - System settings (admin only)
```

#### Doctor Routes (`/doctor/*`)
```
/doctor/dashboard              - Doctor's main dashboard
/doctor/appointments           - Manage appointments
/doctor/prescriptions          - View/create prescriptions
/doctor/medical-records        - View patient medical records
/doctor/lab-tests              - View lab test results
/doctor/radiology              - View radiology reports
```

#### Patient Routes (`/patient/*`)
```
/patient/billing               - View invoices and billing
/patient/pharmacy              - View prescriptions and pharmacy
```

### Frontend File Structure
```
src/pages/
├── auth/
│   ├── Login.jsx              - Login form (both patient & doctor)
│   └── Register.jsx           - Patient registration
├── admin/
│   ├── DoctorRegister.jsx    - Register doctors (admin)
│   ├── Doctors.jsx            - Manage doctors list
│   ├── Patients.jsx           - Manage patients list
│   └── PendingPatients.jsx    - Pending approvals
├── doctor/
│   ├── Dashboard.jsx          - Doctor dashboard
│   ├── Appointments.jsx       - Doctor's appointments
│   ├── Prescriptions.jsx      - Prescriptions
│   ├── MedicalRecords.jsx     - Medical records
│   ├── LabTest.jsx            - Lab test results
│   └── Radiology.jsx          - Radiology reports
└── patient/
    ├── Billing.jsx            - Patient billing
    └── Pharmacy.jsx           - Patient pharmacy
```

### Import Updates
All page imports have been updated to reference the new directory structure:
```javascript
// Before
import Login from "./pages/Login";
import DoctorRegister from "./pages/DoctorRegister";

// After
import Login from "./pages/auth/Login";
import DoctorRegister from "./pages/admin/DoctorRegister";
```

---

## 🔗 API Service Layer (`/src/services/api.js`)

### Dual API Instances
The frontend now uses two API instances for smooth migration:

```javascript
// V1 API - New versioned endpoints
const API = axios.create({
    baseURL: "http://localhost:5000/api/v1",
});

// Legacy API - Backward compatibility
const API_LEGACY = axios.create({
    baseURL: "http://localhost:5000/api",
});
```

### Endpoint Organization

#### V1 Endpoints (Modern)
- `registerUser()` → `/api/v1/auth/register`
- `loginUser()` → `/api/v1/auth/login`
- `getMe()` → `/api/v1/auth/me`
- `getPatients()` → `/api/v1/patients`
- `getDoctors()` → `/api/v1/doctors`
- `createPatient()` → `/api/v1/patients`
- `createDoctor()` → `/api/v1/doctors`

#### Legacy Endpoints (Backward Compatible)
- Appointments: `/api/appointments`
- Prescriptions: `/api/prescriptions`
- Lab: `/api/lab`
- Radiology: `/api/radiology`
- Billing: `/api/billing`
- Medical Records: `/api/medical-records`
- Pharmacy: `/api/pharmacy`

---

## 🔒 Access Control

### Role-Based Routes

| Role | Accessible Paths | Features |
|------|------------------|----------|
| **ADMIN** | `/admin/*` | Doctor management, patient oversight, approvals, audit logs, settings |
| **DOCTOR** | `/doctor/*` | Appointments, prescriptions, medical records, lab results, radiology |
| **PATIENT** | `/patient/*` | Billing, pharmacy prescriptions |
| **Public** | `/auth/*` | Login, registration |

### Protected Route Component
All dashboard routes use `<ProtectedRoute>` wrapper with role validation:
```javascript
<Route 
  path="/doctor/dashboard" 
  element={<ProtectedRoute requiredRole="DOCTOR"><DoctorDashboard /></ProtectedRoute>} 
/>
```

---

## 🚀 Running the Application

### Start Backend
```bash
cd hospital-backend
npm start
```
- API available at: `http://localhost:5000`
- v1 endpoints: `http://localhost:5000/api/v1/*`

### Start Frontend
```bash
cd hospital-frontend
npm run dev
```
- App available at: `http://localhost:5173`

---

## 📋 Navigation Examples

### Patient Flow
1. **Login**: Navigate to `/auth/login/patient`
2. **Register**: Navigate to `/auth/register/patient`
3. **Dashboard**: Patient views available features
4. **Billing**: Access `/patient/billing`
5. **Pharmacy**: Access `/patient/pharmacy`

### Doctor Flow
1. **Login**: Navigate to `/auth/login/doctor`
2. **Dashboard**: Access `/doctor/dashboard`
3. **Appointments**: Manage at `/doctor/appointments`
4. **Prescriptions**: Create at `/doctor/prescriptions`
5. **Records**: View at `/doctor/medical-records`

### Admin Flow
1. **Initial Setup**: `/auth/admin-setup`
2. **Doctor Management**: `/admin/register-doctor`, `/admin/doctors`
3. **Patient Management**: `/admin/patients`, `/admin/pending-approvals`
4. **System**: `/admin/audit-logs`, `/admin/settings`

---

## ✅ Benefits of This Structure

1. **Separation of Concerns**: Each role has dedicated routes and components
2. **Scalability**: Easy to add new features per role
3. **Maintainability**: Clear directory structure and naming conventions
4. **Security**: Role-based access control at frontend and API levels
5. **API Versioning**: Future-proof with `/api/v1` structure
6. **Backward Compatibility**: Legacy endpoints still functional
7. **Professional Standards**: RESTful API design patterns followed
8. **Clear Navigation**: Intuitive URL structure for different user types

---

## 🔄 Migration Path

### Existing Code Compatibility
- Old API calls still work via `API_LEGACY` instance
- Old routes still accessible but redirected appropriately
- No breaking changes to core functionality

### Moving Forward
- Gradually migrate remaining endpoints to `/api/v1` structure
- Move legacy pages to appropriate role-based folders
- Update all API calls to use new v1 endpoints
- Implement enhanced audit logging for role-based actions

---

## 📝 Summary of Changes

| Component | Change | Impact |
|-----------|--------|--------|
| Backend Routes | Organized under `/api/v1/` | Professional versioning |
| Frontend Pages | Organized by role (auth/admin/doctor/patient) | Better maintainability |
| API Service | Dual instances for v1 and legacy | Smooth transition |
| Route Structure | Clear role-based paths | Intuitive navigation |
| Access Control | Role-based protected routes | Enhanced security |

---

**Created**: April 21, 2026  
**Status**: ✅ Implementation Complete  
**Next Steps**: Deploy and test all role-specific flows
