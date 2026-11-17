import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const { role } = useAuth();

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'coordinator') return '/coordinator';
    return '/student';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Access Restricted</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          You do not have the required permissions to access this portal or resource. Every screen is strictly protected by database Row Level Security.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={getDashboardPath()}>
            <Button variant="primary" icon={Home}>
              Go to My Portal
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" icon={ArrowLeft}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
