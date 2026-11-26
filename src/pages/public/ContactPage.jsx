/* Draft - to be reviewed by the college */

/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.3 /contact: Institutional Contact Directory & Office Details
 * Formatted with Wine & Ivory tokens, semantic cards, and accessible typography.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/common/PageContainer';
import Card, { CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { PageEnter } from '../../components/motion';
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Building2,
  ExternalLink,
  Sparkles,
  Send,
  GraduationCap
} from 'lucide-react';

const DEPARTMENTS = [
  { name: 'Computer Science & Engineering', code: 'CSE', email: 'events.cse@francisxavier.ac.in' },
  { name: 'Artificial Intelligence & Data Science', code: 'AI&DS', email: 'events.aids@francisxavier.ac.in' },
  { name: 'Electronics & Communication Engineering', code: 'ECE', email: 'events.ece@francisxavier.ac.in' },
  { name: 'Electrical & Electronics Engineering', code: 'EEE', email: 'events.eee@francisxavier.ac.in' },
  { name: 'Mechanical Engineering', code: 'MECH', email: 'events.mech@francisxavier.ac.in' },
  { name: 'Civil Engineering', code: 'CIVIL', email: 'events.civil@francisxavier.ac.in' },
  { name: 'Information Technology', code: 'IT', email: 'events.it@francisxavier.ac.in' },
  { name: 'Master of Business Administration', code: 'MBA', email: 'events.mba@francisxavier.ac.in' },
  { name: 'Master of Computer Applications', code: 'MCA', email: 'events.mca@francisxavier.ac.in' },
];

export default function ContactPage() {
  return (
    <PageEnter className="py-10 sm:py-16 bg-bg min-h-[calc(100vh-64px)]">
      <PageContainer className="max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-3 pb-6 border-b border-line">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold tracking-wider uppercase select-none">
            <Mail className="w-3.5 h-3.5" />
            <span>Campus Directory</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            Institutional Contact & Office
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            Get in touch with the Francis Xavier Engineering College Event Management Cell, department coordinators, or administrative support.
          </p>
        </div>

        {/* Primary Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Central Office */}
          <Card className="border border-line bg-surface p-6 rounded-[20px] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink">
              Event Management Cell
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Main Administrative Block, 1st Floor, Francis Xavier Engineering College.
            </p>
            <p className="text-xs text-muted">
              Mon – Fri: 8:45 AM – 5:00 PM IST
            </p>
          </Card>

          {/* Email Enquiries */}
          <Card className="border border-line bg-surface p-6 rounded-[20px] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink">
              Institutional Email
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Direct official inquiries regarding sessions, credentials, and industry speaker proposals:
            </p>
            <a
              href="mailto:campusconnect@francisxavier.ac.in"
              className="text-xs font-semibold text-primary hover:underline break-all block"
            >
              campusconnect@francisxavier.ac.in
            </a>
          </Card>

          {/* Campus Location */}
          <Card className="border border-line bg-surface p-6 rounded-[20px] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink">
              Campus Address
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              103/G2, Bypass Road, Vannarpettai, Tirunelveli - 627 003, Tamil Nadu, India.
            </p>
            <a
              href="https://maps.google.com/?q=Francis+Xavier+Engineering+College+Tirunelveli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </Card>
        </div>

        {/* Department Coordinators Directory */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
              Department Event Coordinators
            </h2>
            <Badge variant="neutral" size="sm">
              {DEPARTMENTS.length} Academic Departments
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEPARTMENTS.map((dept) => (
              <div
                key={dept.code}
                className="p-4 rounded-[16px] bg-surface border border-line space-y-2 hover:border-primary/30 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm" className="font-mono font-bold text-xs">
                    {dept.code}
                  </Badge>
                </div>
                <h4 className="font-serif font-bold text-sm text-ink leading-tight">
                  {dept.name}
                </h4>
                <a
                  href={`mailto:${dept.email}`}
                  className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1.5 pt-1"
                >
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{dept.email}</span>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Email Launcher CTA */}
        <div className="p-8 rounded-[24px] bg-gradient-to-br from-primary-soft via-surface to-surface-2 border border-line text-center space-y-4 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface border border-line text-xs font-semibold text-ink shadow-2xs">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span>Francis Xavier Engineering College (Autonomous)</span>
          </div>
          <h3 className="font-serif font-bold text-2xl text-ink">
            Need Support or Technical Assistance?
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto leading-relaxed">
            Whether you are an industry expert proposing a lecture, a student with attendance verification questions, or a faculty coordinator needing event support, our team is here to assist.
          </p>
          <div className="pt-2">
            <a href="mailto:campusconnect@francisxavier.ac.in?subject=Campus%20Connect%20Support%20Request">
              <Button variant="primary" size="md" className="gap-2">
                <Send className="w-4 h-4" />
                <span>Launch Email Client</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4 text-xs">
          <Link to="/privacy" className="text-primary hover:underline font-semibold">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-primary hover:underline font-semibold">
            Terms of Service
          </Link>
          <Link to="/verify" className="text-muted hover:text-ink transition-colors">
            Verify Digital Certificate Registry
          </Link>
        </div>
      </PageContainer>
    </PageEnter>
  );
}
