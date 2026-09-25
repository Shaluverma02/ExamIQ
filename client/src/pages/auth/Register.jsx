import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import AuthLayout from '../../components/common/AuthLayout';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import API from '../../services/api';

const CollegeField = ({ formData, setFormData, publicColleges, error }) => (
  <div className="mb-3">
    <label htmlFor="registration-college" className="form-label">College / Institution *</label>
    <select
      id="registration-college"
      className={`form-select fw-semibold ${error ? 'is-invalid' : ''}`}
      value={formData.collegeId || ''}
      onChange={(e) => {
        const selected = publicColleges.find((college) => college._id === e.target.value);
        setFormData({
          ...formData,
          collegeId: selected?._id || '',
          college: selected?.name || '',
          groupId: '',
        });
      }}
      required
      disabled={publicColleges.length === 0}
    >
      <option value="">{publicColleges.length ? 'Select registered college' : 'No colleges available for registration'}</option>
      {publicColleges.map((college) => (
        <option key={college._id} value={college._id}>{college.name}</option>
      ))}
    </select>
    {error && <div className="invalid-feedback d-block">{error}</div>}
    <div className="form-text">Select a registered institution. Your dashboard, exams, groups and results will use this workspace.</div>
  </div>
);

const uniqueValues = (groups, field) => [...new Set(groups.map((group) => group[field]).filter(Boolean))].sort();

const stepLabels = ['Account', 'Academics', 'Review'];

const StepIndicator = ({ step }) => (
  <ol className="eq-registration-steps" aria-label="Registration progress">
    {stepLabels.map((label, index) => (
      <li key={label} className={step === index + 1 ? 'is-active' : step > index + 1 ? 'is-complete' : ''} aria-current={step === index + 1 ? 'step' : undefined}>
        <span>{step > index + 1 ? <CheckCircle2 size={16} /> : String(index + 1).padStart(2, '0')}</span>
        <strong>{label}</strong>
      </li>
    ))}
  </ol>
);

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [publicColleges, setPublicColleges] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    collegeId: '',
    college: '',
    groupId: '',
    course: '',
    branch: '',
    semester: '',
    rollNumber: '',
    customFields: {},
  });

  useEffect(() => {
    fetchPublicGroups(formData.college, formData.collegeId);
  }, [formData.college, formData.collegeId]);

  useEffect(() => {
    const fetchPublicColleges = async () => {
      try {
        const res = await API.get('/colleges/public');
        setPublicColleges(res.data?.colleges || []);
      } catch (err) {
        setPublicColleges([]);
      }
    };
    fetchPublicColleges();
  }, []);

  const fetchPublicGroups = async (collegeName, collegeId) => {
    try {
      setGroupsLoading(true);
      const url = collegeId
        ? `/groups/public?collegeId=${encodeURIComponent(collegeId)}`
        : collegeName
          ? `/groups/public?college=${encodeURIComponent(collegeName)}`
          : '/groups/public';
      const res = await API.get(url);
      setAvailableGroups(res.data.groups || []);
    } catch (e) {
      console.error('Error fetching public groups:', e);
      setAvailableGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Full name is required';
    if (!formData.email.trim()) nextErrors.email = 'Valid email is required';
    if (!formData.password || formData.password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  const handleAcademicChange = (field, value) => {
    const nextFormData = { ...formData, [field]: value, groupId: '' };
    if (field === 'course') {
      nextFormData.branch = '';
      nextFormData.semester = '';
    }
    if (field === 'branch') nextFormData.semester = '';
    setFormData(nextFormData);
  };

  const handleGroupSelect = (groupId) => {
    const selected = availableGroups.find((group) => group._id === groupId);
    if (selected) {
      setFormData({
        ...formData,
        groupId,
        course: selected.course || formData.course,
        branch: selected.department || formData.branch,
        semester: selected.semester || formData.semester,
      });
    } else {
      setFormData({ ...formData, groupId });
    }
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();

    if (formData.role === 'student' && availableGroups.length > 0 && !formData.groupId) {
      setErrors({ groupId: 'Please select a group or batch to complete registration' });
      toast.warning('Please select a group or batch');
      return;
    }

    if (!formData.college.trim()) {
      setErrors({ college: 'College or institution is required' });
      toast.warning('Please enter or select your college');
      return;
    }

    setErrors({});
    setStep(3);
  };

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await register(formData);
      if (user?.pendingVerification && user?.phoneVerificationRequired) navigate(`/verify-phone?email=${encodeURIComponent(formData.email)}`);
      else if (user?.pendingVerification) navigate('/login');
      else if (user?.role === 'admin') navigate('/admin/dashboard');
      else if (user?.role === 'faculty') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      // The auth context already displays the API message.
    } finally {
      setLoading(false);
    }
  };

  const handleDynamicChange = (fieldId, value) => {
    setFormData({
      ...formData,
      customFields: { ...formData.customFields, [fieldId]: value },
    });
  };

  const selectedGroupObj = availableGroups.find((group) => group._id === formData.groupId);
  const courseOptions = uniqueValues(availableGroups, 'course');
  const branchOptions = uniqueValues(
    availableGroups.filter((group) => !formData.course || group.course === formData.course),
    'department'
  );
  const semesterOptions = uniqueValues(
    availableGroups.filter((group) => (
      (!formData.course || group.course === formData.course)
      && (!formData.branch || group.department === formData.branch)
    )),
    'semester'
  );
  const mappedGroups = availableGroups.filter((group) => (
    (!formData.course || group.course === formData.course)
    && (!formData.branch || group.department === formData.branch)
    && (!formData.semester || group.semester === formData.semester)
  ));

  return (
    <AuthLayout title="Create your account" description="Your learning workspace starts here. Let's get you connected to your institution." maxWidth={560} eyebrow="Get started with ExamiQ">
          <StepIndicator step={step} />

          {step === 1 && (
            <form onSubmit={handleNextStep1} className="auth-form-stack">
              <Input
                label="Full Name"
                autoComplete="name"
                required
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                autoFocus
              />
              <Input
                label="Email Address"
                autoComplete="email"
                type="email"
                required
                placeholder="name@institute.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />
              <Input
                label="Mobile Number"
                autoComplete="tel"
                type="tel"
                required
                placeholder="Your mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="row g-2">
                <div className="col-12 col-sm-6">
                  <Input
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <Input
                    label="Confirm Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-100 mt-2 fw-semibold">
                Continue <ArrowRight size={16} />
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep2} className="auth-form-stack">
              <div className="auth-step-card">
                <CollegeField
                  formData={formData}
                  setFormData={setFormData}
                  publicColleges={publicColleges}
                  error={errors.college}
                />

                <div className="mb-3">
                  <label htmlFor="registration-group" className="form-label d-flex justify-content-between align-items-center">
                    <span>Assigned Group / Batch *</span>
                    {groupsLoading && <span className="spinner-border spinner-border-sm text-primary" role="status" />}
                  </label>

                  {groupsLoading ? (
                    <div className="form-control bg-body-tertiary text-muted small">Loading available groups...</div>
                  ) : availableGroups.length === 0 ? (
                    <div className="alert alert-warning p-2 small mb-0 d-flex align-items-center gap-2 rounded-3">
                      <AlertCircle size={16} className="text-warning flex-shrink-0" />
                      <span>No active groups available for <strong>{formData.college || 'the selected institution'}</strong></span>
                    </div>
                  ) : (
                    <select
                      id="registration-group"
                      className={`form-select fw-semibold ${errors.groupId ? 'is-invalid' : ''}`}
                      value={formData.groupId}
                      onChange={(e) => handleGroupSelect(e.target.value)}
                      required
                    >
                      <option value="">Select your assigned group</option>
                      {mappedGroups.map((group) => (
                        <option key={group._id} value={group._id}>
                          {group.name} [{group.code}] ({group.course} - Sem {group.semester})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.groupId && <div className="invalid-feedback d-block">{errors.groupId}</div>}
                </div>

                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="registration-course" className="form-label">Course</label>
                    <select id="registration-course" className="form-select" value={formData.course} onChange={(e) => handleAcademicChange('course', e.target.value)}>
                      <option value="">Select course</option>
                      {courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label htmlFor="registration-branch" className="form-label">Branch / Dept</label>
                    <select id="registration-branch" className="form-select" value={formData.branch} onChange={(e) => handleAcademicChange('branch', e.target.value)} disabled={!formData.course}>
                      <option value="">Select branch</option>
                      {branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="registration-semester" className="form-label">Semester</label>
                    <select id="registration-semester" className="form-select" value={formData.semester} onChange={(e) => handleAcademicChange('semester', e.target.value)} disabled={!formData.branch}>
                      <option value="">Select semester</option>
                      {semesterOptions.map((semester) => <option key={semester} value={semester}>{semester}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <Input label="Roll Number" placeholder="Roll number" value={formData.rollNumber} onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} />
                  </div>
                </div>
              </div>

              <DynamicFormRenderer formType="student_registration" values={formData.customFields} onChange={handleDynamicChange} />

              <div className="d-flex gap-2 mt-3">
                <Button type="button" variant="outline-secondary" onClick={() => setStep(1)} className="w-50 fw-semibold">
                  <ArrowLeft size={16} /> Back
                </Button>
                <Button type="submit" variant="primary" className="w-50 fw-semibold">
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmitFinal} className="auth-form-stack">
              <div className="auth-summary-box">
                <h6 className="fw-bold text-body mb-3">Review your information</h6>
                <div className="auth-review-grid">
                  <div className="text-secondary">Name <strong className="text-body">{formData.name}</strong></div>
                  <div className="text-secondary">Email <strong className="text-body">{formData.email}</strong></div>
                  <div className="text-secondary">Role <strong className="text-primary text-uppercase">{formData.role}</strong></div>
                  {formData.role === 'student' && (
                    <>
                      <div className="text-secondary">College <strong className="text-body">{formData.college}</strong></div>
                      <div className="text-secondary">Group / Batch <strong className="text-primary">{selectedGroupObj ? `${selectedGroupObj.name} [${selectedGroupObj.code}]` : 'Not assigned'}</strong></div>
                      <div className="text-secondary">Course / Dept <strong className="text-body">{formData.course || '-'} ({formData.branch || '-'})</strong></div>
                      <div className="text-secondary">Roll No <strong className="text-body">{formData.rollNumber || 'Will be assigned by institute'}</strong></div>
                    </>
                  )}
                </div>
              </div>

              <div className="d-flex gap-2">
                <Button type="button" variant="outline-secondary" onClick={() => setStep(2)} className="w-50 fw-semibold">
                  <ArrowLeft size={16} /> Edit Info
                </Button>
                <Button type="submit" variant="success" loading={loading} className="w-50 fw-semibold">
                  <CheckCircle2 size={16} /> Create account
                </Button>
              </div>
            </form>
          )}

          <div className="text-center mt-4 pt-3 border-top small text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary text-decoration-none fw-semibold">
              Sign in
            </Link>
          </div>
    </AuthLayout>
  );
};

export default Register;