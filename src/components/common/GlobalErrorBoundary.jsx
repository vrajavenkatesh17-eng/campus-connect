/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.4 Global Error Boundary
 * Friendly UI catching runtime rendering exceptions, with "Back to home" button
 * and "Report a problem" mailto.
 */

import React from 'react';
import Card, { CardContent } from './Card';
import Button from './Button';
import Badge from './Badge';
import { AlertTriangle, Home, Mail, RefreshCw } from 'lucide-react';

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Exception caught by GlobalErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected runtime exception occurred.';
      const mailtoSubject = encodeURIComponent('Campus Connect: Application Error Report');
      const mailtoBody = encodeURIComponent(
        `Hello Campus Connect Support Team,\n\nI encountered the following runtime error:\n\nURL: ${window.location.href}\nError Message: ${errorMsg}\nTime: ${new Date().toISOString()}\n\nStack Trace:\n${this.state.error?.stack || 'N/A'}\n`
      );

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 sm:p-6">
          <Card className="max-w-lg w-full border border-line bg-surface rounded-[24px] shadow-sm">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-[20px] bg-danger-soft text-danger flex items-center justify-center mx-auto border border-danger/20 shadow-xs">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <Badge variant="danger" size="sm" className="uppercase tracking-widest font-bold">
                  System Notice
                </Badge>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                  Something went wrong
                </h1>
                <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm mx-auto">
                  An unexpected error interrupted this session. Your data is safe, and our engineering team has been notified.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={this.handleGoHome}
                  icon={Home}
                  className="w-full sm:w-auto"
                >
                  Back to home
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={this.handleReload}
                  icon={RefreshCw}
                  className="w-full sm:w-auto"
                >
                  Retry
                </Button>

                <a
                  href={`mailto:campusconnect@francisxavier.ac.in?subject=${mailtoSubject}&body=${mailtoBody}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="ghost"
                    size="md"
                    icon={Mail}
                    className="w-full sm:w-auto"
                  >
                    Report a problem
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
