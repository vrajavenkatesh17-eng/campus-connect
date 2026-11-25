/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { HelpCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <Card className="border-line shadow-xs">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-[20px] bg-surface-2 text-muted flex items-center justify-center mx-auto border border-line shadow-xs">
              <HelpCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <Badge variant="neutral" size="sm" className="uppercase tracking-widest font-bold">
                Error 404
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink">Page Not Found</h1>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              The requested campus route or resource does not exist, may have expired, or was relocated.
            </p>

            <div className="pt-4 flex justify-center">
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="primary" icon={Home} className="w-full">
                  Return to Campus Connect
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
