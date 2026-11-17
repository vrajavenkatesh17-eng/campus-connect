import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import { GraduationCap, Hash, Building2, Calendar, Phone, CheckCircle2 } from 'lucide-react';

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
    if (profile) {
      setName(profile.name || user?.email?.split('@')[0] || '');
      if (profile.department_id) setDepartmentId(profile.department_id);
      if (profile.year) setYear(profile.year.toString());
      if (profile.register_number) setRegisterNumber(profile.register_number);
      if (profile.phone) setPhone(profile.phone);
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
        register_number: registerNumber.trim(),
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
          <div className="w-12 h-12 rounded-2xl bg-burgundy text-white flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Complete Student Profile
          </h1>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Please provide your official college details. These will be verified on certificates and event attendance logs.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>
                Linked to your official account: <span className="font-semibold text-neutral-800">{user?.email}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your official student name"
                error={formErrors.name}
              />

              {isLoadingDepts ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Year of Study"
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Select year"
                  options={[
                    { value: '1', label: '1st Year' },
                    { value: '2', label: '2nd Year' },
                    { value: '3', label: '3rd Year' },
                    { value: '4', label: '4th Year' },
                    { value: '5', label: '5th Year (Integrated)' },
                  ]}
                  error={formErrors.year}
                />

                <Input
                  label="Register / Roll Number"
                  required
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  placeholder="e.g. 21IT045"
                  icon={Hash}
                  error={formErrors.registerNumber}
                />
              </div>

              <Input
                label="Contact Phone Number (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                icon={Phone}
                helperText="Used for urgent event schedule or venue change updates."
              />
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
              >
                Complete Profile & Enter
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
