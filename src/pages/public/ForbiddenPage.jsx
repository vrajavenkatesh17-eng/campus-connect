import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { ShieldAlert, Home, LogOut } from 'lucide-react';

export default function ForbiddenPage() {
  const { role, signOut } = useAuth();

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'coordinator') return '/coordinator';
    return '/student';
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-red-600">Error 403</span>
          <h1 className="text-2xl font-bold text-neutral-900">Access Forbidden</h1>
        </div>
        <p className="text-sm text-neutral-600 leading-relaxed">
          You do not have the required institutional role to view this page. All administrative and coordinator portals are strictly guarded by PostgreSQL server-side permissions.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={getDashboardPath()}>
            <Button variant="primary" icon={Home}>
              Go to My Portal
            </Button>
          </Link>
          <Button variant="secondary" icon={LogOut} onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
