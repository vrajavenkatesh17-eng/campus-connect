import React from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { GraduationCap, Calendar, Shield, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-burgundy text-white flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
            Francis Xavier Engineering College
          </h1>
          <p className="text-base text-neutral-600 max-w-lg mx-auto">
            Select your institutional portal to authenticate using your Google account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Portal */}
          <Link to="/login/student" className="group">
            <Card hover className="h-full border-neutral-200 transition-all group-hover:border-emerald-300">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <Badge variant="student" size="sm" className="mb-2">Student Access</Badge>
                    <h3 className="font-bold text-lg text-neutral-900 group-hover:text-emerald-700 transition-colors">
                      Student Portal
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Explore guest lectures, submit willingness to attend, scan QR attendance, and collect reward points.
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-semibold text-emerald-700 gap-1 pt-2">
                  <span>Sign In as Student</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Coordinator Portal */}
          <Link to="/login/coordinator" className="group">
            <Card hover className="h-full border-neutral-200 transition-all group-hover:border-indigo-300">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <Badge variant="coordinator" size="sm" className="mb-2">Faculty & Staff</Badge>
                    <h3 className="font-bold text-lg text-neutral-900 group-hover:text-indigo-700 transition-colors">
                      Coordinator Portal
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Propose guest lectures, manage attendee lists, launch live QR attendance, and award interaction points.
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-semibold text-indigo-700 gap-1 pt-2">
                  <span>Sign In as Coordinator</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Admin Portal */}
          <Link to="/login/admin" className="group">
            <Card hover className="h-full border-neutral-200 transition-all group-hover:border-burgundy-300">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-burgundy-50 text-burgundy flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <Badge variant="admin" size="sm" className="mb-2">Administration</Badge>
                    <h3 className="font-bold text-lg text-neutral-900 group-hover:text-burgundy transition-colors">
                      Admin Portal
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Review and approve sessions, manage coordinator role authorizations, and oversee college-wide analytics.
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-semibold text-burgundy gap-1 pt-2">
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
