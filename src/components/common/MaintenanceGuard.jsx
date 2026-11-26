/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.4 Maintenance Page Switch
 * Controlled via app_settings table (`maintenance_mode` or `maintenance`).
 * Allows administrators through; displays institutional maintenance notice to others.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Card, { CardContent } from './Card';
import Badge from './Badge';
import Button from './Button';
import { Wrench, Mail, ShieldAlert, RefreshCw } from 'lucide-react';

export default function MaintenanceGuard({ children }) {
  const { role, user } = useAuth();
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkMaintenanceStatus() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value')
          .in('key', ['maintenance_mode', 'maintenance'])
          .limit(2);

        if (!error && data && data.length > 0) {
          const setting = data.find((d) => d.key === 'maintenance_mode' || d.key === 'maintenance');
          if (setting) {
            const val = setting.value;
            const enabled =
              val === true ||
              val === 'true' ||
              val?.enabled === true ||
              val?.status === 'active';

            if (isMounted) {
              setIsMaintenanceActive(Boolean(enabled));
              if (val?.message) setMaintenanceMessage(val.message);
            }
          }
        }
      } catch (err) {
        // Fail open so offline or initial setup does not brick the application
        console.warn('Maintenance check notice:', err);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    }

    checkMaintenanceStatus();

    // Listen for realtime app_settings updates
    const channel = supabase
      .channel('app_settings_maintenance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.maintenance_mode' },
        (payload) => {
          if (payload.new) {
            const val = payload.new.value;
            const enabled = val === true || val === 'true' || val?.enabled === true;
            setIsMaintenanceActive(Boolean(enabled));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Admins always bypass maintenance mode to allow administrative access
  if (isMaintenanceActive && role !== 'admin') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 sm:p-6 select-none">
        <Card className="max-w-md w-full border border-line bg-surface rounded-[24px] shadow-sm text-center">
          <CardContent className="p-8 space-y-6">
            <div className="w-16 h-16 rounded-[20px] bg-warning-soft text-warning flex items-center justify-center mx-auto border border-warning/20 shadow-xs">
              <Wrench className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <Badge variant="warning" size="sm" className="uppercase tracking-widest font-bold">
                Platform Maintenance
              </Badge>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                Scheduled Maintenance
              </h1>
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm mx-auto">
                {maintenanceMessage ||
                  'Campus Connect is temporarily undergoing scheduled maintenance to upgrade system infrastructure. Please check back shortly.'}
              </p>
            </div>

            <div className="p-4 rounded-[14px] bg-surface-2 border border-line text-xs text-muted space-y-1">
              <p className="font-semibold text-ink">Francis Xavier Engineering College</p>
              <p>Autonomous Institution • Tirunelveli</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => window.location.reload()}
                icon={RefreshCw}
                className="w-full sm:w-auto"
              >
                Check Status
              </Button>

              <a
                href="mailto:campusconnect@francisxavier.ac.in"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="secondary"
                  size="md"
                  icon={Mail}
                  className="w-full sm:w-auto"
                >
                  Contact Desk
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
