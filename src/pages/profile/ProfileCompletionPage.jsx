import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import AppButton from '../../components/app/AppButton';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import { GraduationCap, Hash, Building2, Calendar, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileCompletionPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [detectedConfirmation, setDetectedConfirmation] = useState(null);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    profileService.getDepartments()
      .then((data) => {
        if (isMounted) {
          setDepartments(data || []);
          setIsLoadingDepts(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching departments:', err);
        if (isMounted) setIsLoadingDepts(false);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const rawName = user?.user_metadata?.full_name || profile?.name || '';
    // Detect a trailing ID token like 25CSR101 in Google Name (do NOT auto-split silently, confirm with user)
    const idMatch = rawName.match(/[\s\-_(]+([0-9]{2}[A-Z]{2,4}[0-9]{2,4})\)?$/i);

    let cleanInitialName = rawName.trim();
    let detectedId = '';

    if (idMatch) {
      detectedId = idMatch[1].toUpperCase();
      cleanInitialName = rawName.slice(0, idMatch.index).trim();
      setDetectedConfirmation({
        name: cleanInitialName,
        regNo: detectedId,
      });
    }

    if (profile) {
      setName(profile.name || cleanInitialName || user?.email?.split('@')[0] || '');
      if (profile.department_id) setDepartmentId(profile.department_id);
      if (profile.year) setYear(profile.year.toString());
      if (profile.register_number) {
        setRegisterNumber(profile.register_number);
      } else if (detectedId) {
        setRegisterNumber(detectedId);
      }
      if (profile.phone) setPhone(profile.phone);
    } else {
      if (cleanInitialName) setName(cleanInitialName);
      if (detectedId) setRegisterNumber(detectedId);
    }
  }, [profile, user]);

  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Full name is required.';
    if (!departmentId) errors.departmentId = 'Please select your department.';
    if (!year) errors.year = 'Please select your current year of study.';
    if (!registerNumber.trim()) errors.registerNumber = 'College register/roll number is required.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await profileService.updateOwnProfile(user.id, {
        name: name.trim(),
        department_id: departmentId,
        year: parseInt(year, 10),
        register_number: registerNumber.trim().toUpperCase(),
        phone: phone.trim() || null,
      });

      await refreshProfile();
      showToast('Profile completed successfully! Welcome to Campus Connect.', 'success');
      navigate('/student', { replace: true });
    } catch (err) {
      console.error('Profile completion error:', err);
      showToast(err.message || 'Failed to complete profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Complete Student Profile
          </h1>
          <p className="text-sm text-muted max-w-md mx-auto">
            Please verify your official college details. Clean display name is used across the system; your register number appears only on your ID card, profile, and rosters.
          </p>
        </div>

        {/* Identity Confirmation Banner */}
        {detectedConfirmation && (
          <div className="p-4 rounded-[16px] bg-primary-soft border border-primary/20 text-xs text-ink space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-primary dark:text-ink">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>Identity Confirmation Step</span>
            </div>
            <p className="text-muted leading-relaxed">
              Name: <strong className="text-ink">{name}</strong> / Register no:{' '}
              <strong className="text-ink font-mono">{registerNumber || detectedConfirmation.regNo}</strong> — correct? Please review and edit below if needed.
            </p>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>
                Linked to your official account: <span className="font-semibold text-ink">{user?.email}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                label="Full Display Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Krishna Raja V"
                error={formErrors.name}
              />

              <Input
                label="Register Number"
                required
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
                placeholder="e.g., 25CSR101"
                error={formErrors.registerNumber}
                className="font-mono uppercase"
              />

              {isLoadingDepts ? (
                <div className="flex items-center gap-2 text-sm text-muted py-2">
                  <Spinner size="sm" />
                  <span>Loading college departments...</span>
                </div>
              ) : (
                <Select
                  label="Department"
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  placeholder="Select your department"
                  options={departments.map((d) => ({
                    value: d.id,
                    label: `${d.code} - ${d.name}`,
                  }))}
                  error={formErrors.departmentId}
                />
              )}

              <Select
                label="Year of Study"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Select current year"
                options={[
                  { value: '1', label: '1st Year (B.E. / B.Tech / MBA / MCA)' },
                  { value: '2', label: '2nd Year (B.E. / B.Tech / MBA / MCA)' },
                  { value: '3', label: '3rd Year (B.E. / B.Tech)' },
                  { value: '4', label: '4th Year (B.E. / B.Tech)' },
                ]}
                error={formErrors.year}
              />

              <Input
                label="Mobile Phone (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +91 98765 43210"
              />
            </CardContent>

            <CardFooter className="flex justify-end gap-3 pt-4 border-t border-line/60">
              <AppButton
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving Profile...
                  </>
                ) : (
                  'Confirm & Complete Profile'
                )}
              </AppButton>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
