import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateService } from '../../services/certificateService';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import {
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Calendar,
  User,
  Building2,
  Award,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function VerifyCertificatePage() {
  const { code: urlCode } = useParams();
  const [searchCode, setSearchCode] = useState(urlCode || '');
  const [certResult, setCertResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const verifyCode = async (targetCode) => {
    if (!targetCode?.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await certificateService.verifyCertificate(targetCode);
      setCertResult(res);
    } catch (err) {
      console.error('Verification failure:', err);
      setErrorMessage(err.message || 'Unable to verify credential at this time.');
      setCertResult({ valid: false, message: 'Server verification error.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (urlCode) {
      setSearchCode(urlCode);
      verifyCode(urlCode);
    } else {
      setIsLoading(false);
    }
  }, [urlCode]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (searchCode.trim()) {
      verifyCode(searchCode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* FXEC Institution Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-burgundy flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-bold text-neutral-900 group-hover:text-burgundy transition-colors">
                Francis Xavier Engineering College
              </h2>
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Autonomous Institution • E-Credential Registry
              </p>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight pt-4">
            Digital Certificate Verification
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
            Verify the authenticity of participation certificates issued for guest lectures, seminars, and technical symposia.
          </p>
        </div>

        {/* Verification Lookup Input */}
        <form onSubmit={handleManualSearch} className="flex gap-2 max-w-md mx-auto">
          <Input
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="e.g. FXEC-2026-ABCD-1234"
            className="font-mono uppercase text-sm"
            required
          />
          <Button type="submit" variant="primary" icon={Search} isLoading={isLoading}>
            Verify
          </Button>
        </form>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-16 text-center space-y-3">
            <Spinner size="lg" />
            <p className="text-xs text-neutral-500 font-medium">Validating cryptographic credential with database...</p>
          </div>
        )}

        {/* Verification Result Card */}
        {!isLoading && certResult && (
          <div>
            {certResult.valid ? (
              <Card className="border-emerald-200 bg-white shadow-md overflow-hidden">
                <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-6 h-6 text-white" />
                    <div>
                      <h3 className="text-base font-bold tracking-tight">Verified Credential</h3>
                      <p className="text-xs text-emerald-100">Official FXEC Autonomous E-Certificate</p>
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm" className="bg-white/20 text-white font-mono text-xs border-0">
                    {certResult.certificate_code}
                  </Badge>
                </div>

                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Student & Department */}
                  <div className="border-b border-neutral-100 pb-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Awarded To</span>
                    <h2 className="text-2xl font-black text-burgundy mt-0.5 tracking-tight uppercase">
                      {certResult.student_name}
                    </h2>
                    <p className="text-sm text-neutral-600 mt-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                      Department of {certResult.department || 'Engineering'}
                    </p>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Lecture / Event
                      </span>
                      <p className="text-sm font-bold text-neutral-900 leading-snug">
                        {certResult.event_title}
                      </p>
                      {certResult.event_date && (
                        <p className="text-xs text-neutral-500 flex items-center gap-1.5 pt-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          {new Date(certResult.event_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Keynote Speaker
                      </span>
                      <p className="text-sm font-bold text-neutral-900">
                        {certResult.speaker_name || 'Industry Expert'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {certResult.speaker_designation ? `${certResult.speaker_designation}, ` : ''}
                        {certResult.speaker_company || 'Guest Faculty'}
                      </p>
                    </div>
                  </div>

                  {/* Issuance Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Issued on{' '}
                        {certResult.issued_at
                          ? new Date(certResult.issued_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Valid Session'}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">
                      ID: {certResult.certificate_code}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-red-200 bg-white shadow-md overflow-hidden">
                <div className="bg-red-600 px-6 py-4 text-white flex items-center gap-2.5">
                  <ShieldAlert className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-base font-bold tracking-tight">Invalid or Unverified Credential</h3>
                    <p className="text-xs text-red-100">No matching official certificate found</p>
                  </div>
                </div>
                <CardContent className="p-6 sm:p-8 space-y-4 text-center">
                  <p className="text-sm text-neutral-700">
                    {certResult.message || 'The credential code provided does not exist in the Francis Xavier Engineering College verified registry.'}
                  </p>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Please ensure that the certificate code was copied accurately (format: <code className="font-mono text-neutral-800">FXEC-YYYY-XXXX-XXXX</code>). If you believe this is an error, please contact the event coordinator.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link to="/" className="text-xs font-semibold text-burgundy hover:underline inline-flex items-center gap-1">
            Back to FXEC Campus Connect <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
