/* Draft - to be reviewed by the college */

/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.3 /terms: Institutional Terms of Service
 * Formatted with Navy & Gold tokens, semantic cards, and accessible typography.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/common/PageContainer';
import Card from '../../components/common/Card';
import { PageEnter } from '../../components/motion';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <PageEnter className="py-10 sm:py-16 bg-bg min-h-[calc(100vh-64px)]">
      <PageContainer className="max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-3 pb-6 border-b border-line">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold tracking-wider uppercase select-none">
            <FileText className="w-3.5 h-3.5" />
            <span>Institutional Policies</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            Terms of Service & Usage
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            Terms governing participation, seat reservations, digital credentials, and academic conduct across the Francis Xavier Engineering College autonomous event platform.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
              1. Platform Purpose & Eligibility
            </h2>
            <div className="p-6 rounded-[16px] bg-surface border border-line text-xs sm:text-sm text-muted leading-relaxed space-y-3">
              <p>
                Campus Connect is the official autonomous event management and experiential learning platform of Francis Xavier Engineering College (FXEC). Access to authenticated features is restricted to verified students, faculty members, and authorized college personnel.
              </p>
              <p>
                Users must sign in using their official college-issued Google account (<span className="font-mono text-ink">@francisxavier.ac.in</span>) or designated administrative credentials. Account credentials are non-transferable.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
              2. Seat Reservations & Attendance Code of Conduct
            </h2>
            <div className="p-6 rounded-[16px] bg-surface border border-line text-xs sm:text-sm text-muted leading-relaxed space-y-3">
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Seat Reservations:</strong> Registering for an approved session constitutes a commitment to attend. If unable to attend, students must cancel their reservation before the registration deadline so waiting list participants can be accommodated.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Attendance Verification:</strong> Attendance is authenticated through live rotating dynamic QR code scanning at the venue. Any attempt to spoof, share, screen-record, or falsify QR codes will result in disciplinary escalation under the college's academic integrity policy.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Punctuality:</strong> Venue capacity rules require registered attendees to take their seats 10 minutes prior to session commencement. Unclaimed seats may be released to spot registrants.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
              3. Digital Certificates & Reward Points
            </h2>
            <div className="p-6 rounded-[16px] bg-surface border border-line text-xs sm:text-sm text-muted leading-relaxed space-y-3">
              <p>
                Participation certificates and activity points are awarded based on verified QR attendance timestamps and submission of the mandatory post-session feedback review.
              </p>
              <p>
                Certificates carry a cryptographically unique credential identifier (<span className="font-mono text-ink">FXEC-YYYY-XXXX-XXXX</span>) logged in the institutional registry. Certificates are tamper-evident and can be independently verified on the public verification registry.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
              4. Intellectual Property
            </h2>
            <div className="p-6 rounded-[16px] bg-surface border border-line text-xs sm:text-sm text-muted leading-relaxed space-y-3">
              <p>
                Session presentation materials, seminar decks, and lecture recordings uploaded by industry speakers remain the intellectual property of their respective creators and are licensed strictly for educational use by FXEC scholars.
              </p>
              <p>
                The Campus Connect autonomous software architecture is architected and patented by Krish & Ihsan under institutional patent reference <span className="font-mono text-ink">KRISH-IHSAN-FXEC-PATENT-2026-CC</span>.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-ink">
              5. Contact & Institutional Queries
            </h2>
            <div className="p-6 rounded-[16px] bg-surface border border-line text-xs sm:text-sm text-muted leading-relaxed space-y-2">
              <p>
                For questions regarding event policies or institutional terms:
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
              <p>
                <strong className="text-ink">Office: </strong> Dean of Academic Affairs, Francis Xavier Engineering College, Tirunelveli.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4 text-xs">
          <Link to="/privacy" className="text-primary hover:underline font-semibold">
            &larr; Read Privacy Policy
          </Link>
          <Link to="/contact" className="text-muted hover:text-ink transition-colors">
            Contact College Administration
          </Link>
        </div>
      </PageContainer>
    </PageEnter>
  );
}
