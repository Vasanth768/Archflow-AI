import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function ProtectedRoute() {
    const { isAuthenticated, authLoading } = useArchFlow();

    if (authLoading) {
        // While session is resolving, wait and do NOT redirect prematurely
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
