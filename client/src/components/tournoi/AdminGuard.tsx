import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'wouter';
import Loader from '@/components/ui/Loader';

const AdminGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  console.log('[AdminGuard]', { loading, hasUser: !!user, email: user?.email });

  if (loading) return <Loader />;
  if (!user) return <Redirect to="/tournoi/admin/login" />;

  return <>{children}</>;
};

export default AdminGuard;
