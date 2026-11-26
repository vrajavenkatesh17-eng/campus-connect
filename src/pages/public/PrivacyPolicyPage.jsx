/* Draft - to be reviewed by the college */

/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.3 /privacy: Institutional Privacy & Data Governance Policy
 * Formatted with Navy & Gold tokens, semantic cards, and accessible typography.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { PageEnter } from '../../components/motion';
import {
  ShieldCheck,
  Lock,
  Eye,
  Clock,
  Mail,
  Building2,
  FileText,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <PageEnter className="py-10 sm:py-16 bg-bg min-h-[calc(100vh-64px)]">
      <PageContainer className="max-w-4xl space-y-10">
        {/* Page Header */}
        <div className="space-y-3 pb-6 border-b border-line">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold tracking-wider uppercase select-none">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            Privacy & Data Governance Policy
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            How Francis Xavier Engineering College collects, utilizes, and protects student and faculty information on the Campus Connect autonomous event platform.
          </p>
        </div>

        {/* Executive Summary Card */}
        <Card className="border border-line bg-surface p-6 sm:p-8 rounded-[20px] shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-xl text-ink">
            Institutional Privacy Commitment
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Campus Connect is designed as an autonomous, privacy-conscious event management platform for Francis Xavier Engineering College (FXEC). We adhere to strict institutional data governance principles. Student and faculty personal information is never sold, shared with third-party advertisers, or used for commercial marketing.
          </p>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* 1. Data Collected */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
                What Data We Collect
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-[16px] bg-surface border border-line space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>Google Authentication Profile</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  When authenticating with your verified campus Google ID, we collect your full name, campus email address (<span className="font-mono text-ink">@francisxavier.ac.in</span>), and Google avatar photo URL.
                </p>
              </div>

              <div className="p-5 rounded-[16px] bg-surface border border-line space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Academic Department & Role</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Your designated academic department (e.g. CSE, ECE, Mechanical, AI&DS), class batch, register number, and authorized portal role (Student, Faculty Coordinator, or Administrator).
                </p>
              </div>

              <div className="p-5 rounded-[16px] bg-surface border border-line space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Session Attendance Records</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Cryptographically timestamped check-ins logged via live rotating QR code verification during guest lectures and symposiums.
                </p>
              </div>

              <div className="p-5 rounded-[16px] bg-surface border border-line space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Feedback Reviews & Activity Points</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Post-session feedback ratings, lecture quality reviews, earned reward points, and issued autonomous digital certificates.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Who Sees It */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
                Who Has Access to Your Data
              </h2>
            </div>

            <div className="p-6 rounded-[16px] bg-surface border border-line space-y-4">
              <ul className="space-y-3 text-xs sm:text-sm text-muted">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Event Coordinators:</strong> Can view verified attendee lists, attendance counts, and anonymized aggregated feedback for their own scheduled sessions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Department Heads & Administrators:</strong> Have access to college-wide analytics, seat utilization, and departmental turnout metrics for statutory reporting.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Autonomous Examination Committee:</strong> Validates earned activity points for degree requirement audits and accredited credentials.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Public Certificate Verification:</strong> External viewers using the credential lookup registry only see your verified name, event title, date, and issuing authority. Personal email addresses and student register numbers are never disclosed publicly.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* 3. Retention Policy */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
                Data Retention & Security
              </h2>
            </div>

            <div className="p-6 rounded-[16px] bg-surface border border-line space-y-3 text-xs sm:text-sm text-muted leading-relaxed">
              <p>
                Student academic profiles and activity ledgers are retained for the duration of the student's active enrollment at Francis Xavier Engineering College, plus a minimum statutory retention window required for NBA, NAAC, and NIRF accreditation audits.
              </p>
              <p>
                All data transmission is encrypted using TLS 1.3 encryption. Database access is guarded with Supabase Row Level Security (RLS) policies enforcing zero cross-role privilege escalation.
              </p>
            </div>
          </section>

          {/* 4. Contact Details */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-xs shrink-0">
                4
              </div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
                Contact & Governance Enquiries
              </h2>
            </div>

            <div className="p-6 rounded-[16px] bg-surface border border-line space-y-3">
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                For questions regarding student data protection or privacy audits, please contact the institution:
              </p>
              <div className="pt-2 space-y-1.5 text-xs text-muted">
                <p>
                  <strong className="text-ink">Department: </strong> Office of Academic Affairs & Event Management Cell
                </p>
                <p>
                  <strong className="text-ink">Address: </strong> Francis Xavier Engineering College (Autonomous), 103/G2, Bypass Road, Vannarpettai, Tirunelveli - 627 003, Tamil Nadu, India.
                </p>
                <p>
                  <strong className="text-ink">Email: </strong>{' '}
                  <a
                    href="mailto:campusconnect@francisxavier.ac.in"
                    className="text-primary hover:underline font-semibold"
                  >
                    campusconnect@francisxavier.ac.in
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4 text-xs">
          <Link to="/terms" className="text-primary hover:underline font-semibold">
            Review Terms of Service &rarr;
          </Link>
          <Link to="/contact" className="text-muted hover:text-ink transition-colors">
            Contact College Administration
          </Link>
        </div>
      </PageContainer>
    </PageEnter>
  );
}
