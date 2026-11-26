/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * HelpPage: S-O 2 In-App Interactive Help & FAQs
 * Route: /help
 * Categorized FAQs for Students, Coordinators, and Administrators.
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/app/AppButton';
import AppSegmented from '../../components/app/AppSegmented';
import Input from '../../components/common/Input';
import Card, { CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import {
  HelpCircle,
  Search,
  ChevronDown,
  GraduationCap,
  CalendarCheck,
  ShieldCheck,
  QrCode,
  Award,
  Mail,
  ArrowRight,
} from 'lucide-react';

const FAQ_CATEGORIES = [
  { value: 'all', label: 'All Topics' },
  { value: 'student', label: 'Student Guide' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'attendance', label: 'QR Attendance' },
  { value: 'certificates', label: 'Certificates' },
];

const FAQS = [
  {
    category: 'student',
    question: 'How do I log into Campus Connect?',
    answer:
      'Log in using your official Francis Xavier Engineering College Google Workspace account (@francisxavier.ac.in). On your first login, you will be prompted to confirm your official display name, college register number, department, and current year of study.',
  },
  {
    category: 'student',
    question: 'Can I register for events outside my department?',
    answer:
      'Yes, if the coordinator marked the event as "Open to All Departments". If an event is department-targeted, only students belonging to the eligible engineering branches can register.',
  },
  {
    category: 'attendance',
    question: 'How does rotating QR attendance work?',
    answer:
      'During live sessions, the event coordinator presents a rotating cryptographic QR code on the auditorium projector screen. The QR changes every 30 seconds to prevent forwarding or screenshot proxies. Open Campus Connect on your phone, navigate to "Scan Attendance", and point your camera at the screen.',
  },
  {
    category: 'attendance',
    question: 'What if my phone camera cannot scan the QR code?',
    answer:
      'If your phone battery is depleted or camera permissions fail, report immediately to the event coordinator. Coordinators have access to a real-time student roster and can record manual attendance upon verifying your physical presence in the hall.',
  },
  {
    category: 'certificates',
    question: 'When and how do I receive my participation certificate?',
    answer:
      'Certificates are generated once the event is marked completed and attendance has been verified. You can view, download printable A4 PDFs, and share your official verification links from the "My Certificates" section.',
  },
  {
    category: 'certificates',
    question: 'How do employers verify my certificate?',
    answer:
      'Every certificate issued has a unique cryptographic credential code (e.g. FXEC-2026-XXXX) and QR code. Employers or verifiers can visit https://campus-connect-fxec.vercel.app/verify and enter the code to confirm authenticity.',
  },
  {
    category: 'coordinator',
    question: 'How do I submit an event proposal?',
    answer:
      'Faculty and student coordinators can propose sessions using the 5-step Event Wizard under Coordinator Portal -> Propose Event. Proposals undergo live venue overlap validation before being routed to the Admin team for approval.',
  },
  {
    category: 'coordinator',
    question: 'Can I save a draft of my event proposal before submitting?',
    answer:
      'Yes! The Event Wizard automatically saves private drafts in your account as you transition between steps. You can resume editing drafts from your Coordinator dashboard at any time.',
  },
];

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndices, setExpandedIndices] = useState(new Set([0]));

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory =
        selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesQuery =
        searchQuery.trim() === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const toggleAccordion = (index) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <PageHeader
        title="Help & Knowledge Base"
        subtitle="Frequently asked questions and step-by-step guides for students, faculty coordinators, and staff"
        badge="Documentation & Support"
      />

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search FAQs, features, rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <AppSegmented
          options={FAQ_CATEGORIES}
          value={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-line bg-surface text-muted text-sm">
            No help topics found matching your query.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = expandedIndices.has(idx);
            return (
              <Card
                key={idx}
                className="overflow-hidden transition-all duration-200"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAccordion(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAccordion(idx);
                    }
                  }}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 select-none hover:bg-surface-2/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-base text-ink">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </div>

                {isOpen && (
                  <CardContent className="pt-0 pb-5 px-5 text-sm text-muted leading-relaxed border-t border-line/50">
                    <p className="mt-3">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Contact & Support Escalation */}
      <div className="p-6 rounded-3xl bg-surface border border-line flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-serif text-lg font-bold text-ink">Still need assistance?</h3>
          <p className="text-xs text-muted max-w-md">
            Our autonomous event coordinators and IT desk at Francis Xavier Engineering College are ready to help.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/contact">
            <AppButton variant="primary" size="sm" iconRight={ArrowRight}>
              Contact College Support
            </AppButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
