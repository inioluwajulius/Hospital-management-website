import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // No token = not logged in
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Has required role = allow access
    if (requiredRole && user.role !== requiredRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-lg text-slate-600 mb-6">You do not have permission to access this page.</p>
                    <p className="text-sm text-slate-500">Required role: <strong>{requiredRole}</strong> | Your role: <strong>{user.role}</strong></p>
                    <a href="/dashboard" className="mt-6 inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
