import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function PublicRoute({ restricted = false }) {
    const { isAuthenticated, authLoading } = useArchFlow();

    if (authLoading) {
        // While session is resolving, keep public page stable and do NOT redirect prematurely
        return null;
    }

    // Only redirect if route is strictly restricted to unauthenticated users AND user is genuinely authenticated
    if (restricted && isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
