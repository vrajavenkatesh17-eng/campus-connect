import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card, { CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import {
  GraduationCap,
  Calendar,
  QrCode,
  Award,
  FileCheck2,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const { user, role, isConfigured } = useAuth();

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'coordinator') return '/coordinator';
    return '/student';
  };

  return (
    <div className="flex flex-col gap-16 py-8 sm:py-12">
      {/* Configuration Alert if needed */}
      {!isConfigured && (
        <div className="max-w-4xl mx-auto w-full px-4">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-sm flex items-start gap-3 shadow-xs">
            <span className="font-bold text-amber-700">Notice:</span>
            <div>
              <span>Supabase credentials are not connected yet. Set </span>
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
                VITE_SUPABASE_URL
              </code>
              <span> and </span>
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
                VITE_SUPABASE_ANON_KEY
              </code>
              <span> in </span>
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
                .env
              </code>
              <span> and apply SQL migrations to start live authentications.</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <Badge variant="primary" size="lg" className="mb-4">
          Francis Xavier Engineering College
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Connecting Campus, Industry & <span className="text-burgundy">Student Excellence</span>
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          The official guest lecture and event management system. Designed for seamless registrations, QR attendance, interactive reward points, and verified credentials.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link to={getDashboardPath()}>
              <Button size="lg" icon={ArrowRight}>
                Enter {role ? role.toUpperCase() : 'YOUR'} Portal
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="lg" icon={ArrowRight}>
                  Sign In with College ID
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg">
                  Explore Features
                </Button>
              </a>
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Exclusive access for students, faculty coordinators, and administration of FXEC.
        </p>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            A Platform Built for Complete Event Lifecycles
          </h2>
          <p className="mt-2 text-neutral-600 text-sm max-w-xl mx-auto">
            From industry guest lecture scheduling to real-time attendance and verified achievement tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card hover>
            <CardContent className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-burgundy-50 text-burgundy flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900">Guest Lecture Management</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Coordinators create proposals with speaker bios, venue, department targeting, and capacity limits. Admin review workflow ensures institutional quality.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-burgundy-50 text-burgundy flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900">Instant QR Attendance</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Unique encrypted event QR codes prevent proxy attendance. Real-time verification marks student presence with server-side atomic validation.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-burgundy-50 text-burgundy flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900">Student Reward Points</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Recognize active participation, questions asked to industry experts, and insightful discussions with transparent points and leaderboards.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-burgundy-50 text-burgundy flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900">Automated Certificates</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Automated certificate generation with unique verification IDs and QR verification. Students can download PDF certificates instantly.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-burgundy-50 text-burgundy flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900">Student Achievement Passport</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                An ongoing comprehensive profile capturing extracurricular hours, industry sessions attended, certificates, and skills acquired throughout college.
              </p>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-burgundy-50 text-burgundy flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900">Strict Role-Based Security</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Database-level Row Level Security and triggers ensure strict separation between Students, Coordinators, and Administrators.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* College Identity Callout */}
      <section className="max-w-4xl mx-auto px-4 w-full">
        <div className="bg-gradient-to-br from-burgundy-900 to-burgundy text-white rounded-2xl p-8 sm:p-10 shadow-md text-center space-y-4">
          <div className="inline-flex p-3 rounded-xl bg-white/10 text-white mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Francis Xavier Engineering College</h2>
          <p className="text-burgundy-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Empowering students with industry immersion, specialized technical workshops, and global guest lectures.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="secondary" size="md">
                Access Campus Connect Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
