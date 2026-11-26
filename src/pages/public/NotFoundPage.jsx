/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.4 404 Not Found Page
 * Friendly, with "Back to home" button and "Report a problem" mailto.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card, { CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { HelpCircle, Home, Mail, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const location = useLocation();
  const mailtoSubject = encodeURIComponent(`Campus Connect: Broken Link / 404 on ${location.pathname}`);
  const mailtoBody = encodeURIComponent(
    `Hello Campus Connect Team,\n\nI encountered a 404 Not Found error while accessing:\n${window?.location?.href || location.pathname}\n\nDetails:\n`
  );

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-bg">
      <div className="max-w-md w-full text-center space-y-6">
        <Card className="border border-line bg-surface shadow-xs rounded-[24px]">
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-[20px] bg-surface-2 text-primary flex items-center justify-center mx-auto border border-line shadow-xs">
              <HelpCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="neutral" size="sm" className="uppercase tracking-widest font-bold">
                Error 404
              </Badge>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                Page Not Found
              </h1>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              The requested campus route or resource does not exist, may have expired, or was relocated.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="primary" size="md" icon={Home} className="w-full sm:w-auto">
                  Back to home
                </Button>
              </Link>

              <a
                href={`mailto:campusconnect@francisxavier.ac.in?subject=${mailtoSubject}&body=${mailtoBody}`}
                className="w-full sm:w-auto"
              >
                <Button variant="secondary" size="md" icon={Mail} className="w-full sm:w-auto">
                  Report a problem
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
