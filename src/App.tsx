import React, { useState, useEffect, useCallback } from 'react';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { getAdminSession, logoutAdmin, AdminSession } from './services/adminAuthService';
import { testConnection } from './firebase';

export default function App() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(getAdminSession());
  const [route, setRoute] = useState<{
    type: 'customer' | 'admin-login' | 'admin-panel';
    token?: string;
    customerId?: string;
    adminSubroute?: string;
  }>({ type: 'admin-login' });

  // Resolve current route from pathname, hash, and search params
  const resolveCurrentRoute = useCallback(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    const currentSession = getAdminSession();
    setAdminSession(currentSession);

    // 1. Check for Customer Portal route (/customer/:token or #customer=TOKEN)
    let customerToken = '';
    let customerId = '';

    if (pathname.startsWith('/customer/')) {
      customerToken = pathname.replace('/customer/', '').split('/')[0];
    } else if (hash.startsWith('#/customer/')) {
      customerToken = hash.replace('#/customer/', '').split('/')[0];
    } else if (hash && hash.includes('customer=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      customerToken = params.get('customer') || '';
      customerId = params.get('id') || '';
    } else if (search && search.includes('customer=')) {
      const params = new URLSearchParams(search);
      customerToken = params.get('customer') || '';
      customerId = params.get('id') || '';
    }

    if (customerToken) {
      setRoute({
        type: 'customer',
        token: customerToken,
        customerId: customerId || undefined,
      });
      return;
    }

    // 2. Check for Admin routes
    const isAdminPath = pathname.startsWith('/admin') || hash.startsWith('#/admin');
    const pathStr = pathname.startsWith('/admin') ? pathname : hash.replace(/^#/, '');

    if (isAdminPath) {
      if (pathStr === '/admin/login' || pathStr.startsWith('/admin/login')) {
        // If already logged in, redirect to dashboard
        if (currentSession && currentSession.role === 'admin') {
          window.history.replaceState(null, '', '/admin/dashboard');
          setRoute({ type: 'admin-panel', adminSubroute: 'dashboard' });
        } else {
          setRoute({ type: 'admin-login' });
        }
        return;
      }

      // Any other /admin/* route: requires authenticated admin session
      if (!currentSession || currentSession.role !== 'admin') {
        // Access Denied: redirect unauthenticated user or customer to /admin/login
        window.history.replaceState(null, '', '/admin/login');
        setRoute({ type: 'admin-login' });
        return;
      }

      // Extract subroute (e.g. /admin/projects -> projects)
      const subroute = pathStr.replace('/admin/', '').replace('/admin', '') || 'dashboard';
      setRoute({ type: 'admin-panel', adminSubroute: subroute });
      return;
    }

    // 3. Root path (/) default handling
    if (currentSession && currentSession.role === 'admin') {
      window.history.replaceState(null, '', '/admin/dashboard');
      setRoute({ type: 'admin-panel', adminSubroute: 'dashboard' });
    } else {
      window.history.replaceState(null, '', '/admin/login');
      setRoute({ type: 'admin-login' });
    }
  }, []);

  useEffect(() => {
    testConnection();
    resolveCurrentRoute();

    window.addEventListener('popstate', resolveCurrentRoute);
    window.addEventListener('hashchange', resolveCurrentRoute);

    return () => {
      window.removeEventListener('popstate', resolveCurrentRoute);
      window.removeEventListener('hashchange', resolveCurrentRoute);
    };
  }, [resolveCurrentRoute]);

  // Handle successful Admin Login
  const handleAdminLoginSuccess = () => {
    const session = getAdminSession();
    setAdminSession(session);
    window.history.pushState(null, '', '/admin/dashboard');
    setRoute({ type: 'admin-panel', adminSubroute: 'dashboard' });
  };

  // Handle Admin Logout
  const handleAdminLogout = async () => {
    await logoutAdmin();
    setAdminSession(null);
    window.history.pushState(null, '', '/admin/login');
    setRoute({ type: 'admin-login' });
  };

  // Handle Subroute Navigation in Admin
  const handleAdminNavigateSubroute = (subroute: string) => {
    const newPath = `/admin/${subroute}`;
    window.history.pushState(null, '', newPath);
  };

  // Handle Opening Customer Portal from Admin
  const handleOpenCustomerPortalFromAdmin = (customerId: string, token: string) => {
    const customerUrl = `${window.location.origin}/customer/${token}`;
    window.open(customerUrl, '_blank');
  };

  // 1. Customer Route: ONLY Customer Dashboard with ZERO Admin UI
  if (route.type === 'customer' && route.token) {
    return (
      <CustomerPortal
        customerId={route.customerId || ''}
        token={route.token}
      />
    );
  }

  // 2. Admin Login Page: ONLY Login Functionality
  if (route.type === 'admin-login') {
    return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
  }

  // 3. Admin Panel: Protected for role = "admin"
  if (route.type === 'admin-panel' && adminSession && adminSession.role === 'admin') {
    return (
      <AdminPanel
        onOpenCustomerPortal={handleOpenCustomerPortalFromAdmin}
        adminUserEmail={adminSession.email}
        onLogout={handleAdminLogout}
        currentSubroute={route.adminSubroute}
        onNavigateSubroute={handleAdminNavigateSubroute}
      />
    );
  }

  // Fallback default
  return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
}
