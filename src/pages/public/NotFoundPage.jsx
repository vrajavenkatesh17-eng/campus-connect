import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { HelpCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto border border-neutral-200">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">404 - Page Not Found</h1>
        <p className="text-sm text-neutral-600">
          The page you requested does not exist or may have been moved.
        </p>

        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" icon={Home}>
              Return to Campus Connect
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
