import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user ?? null;
        if (!user) {
          // fallback to localStorage token for older flows
          const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
          if (token && mounted) setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Check admins table for this user id
        // admins table may not be typed in Database types; use any to avoid TS issues
        const { data, error } = await (supabase as any).from('admins').select('id').eq('user_id', user.id).limit(1);
        if (error) {
          console.error('Error checking admin table', error);
          if (mounted) setIsAdmin(false);
        } else if (data && data.length > 0) {
          if (mounted) setIsAdmin(true);
        } else {
          if (mounted) setIsAdmin(false);
        }
      } catch (err) {
        console.error('AdminRoute error', err);
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="py-20 text-center">Verificando acesso...</div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

export default AdminRoute;
