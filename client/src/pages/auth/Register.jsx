import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, ArrowRight, ArrowLeft, CheckCircle2, Users, Layers, AlertCircle } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import API from '../../services/api';
import { toast } from 'react-toastify';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Dynamic Group Loading State
  const [availableGroups, setAvailableGroups] = useState([]);
  const [collegesList, setCollegesList] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    college: 'Engineering College',
    groupId: '',
    course: 'B.Tech CS',
    branch: 'Computer Science',
    semester: '6th',
    rollNumber: '',
    customFields: {},
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPublicGroups(formData.college);
  }, [formData.college]);

  const fetchPublicGroups = async (collegeName) => {
    try {
      setGroupsLoading(true);
      const url = collegeName ? `/groups/public?college=${encodeURIComponent(collegeName)}` : '/groups/public';
      const res = await API.get(url);
      setAvailableGroups(res.data.groups || []);
      if (res.data.colleges && res.data.colleges.length > 0) {
        setCollegesList(res.data.colleges);
      }
    } catch (e) {
      console.error('Error fetching public groups:', e);
      setAvailableGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    if (!formData.email.trim()) newErrors.email = 'Valid Email is required';
    if (!formData.password || formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleGroupSelect = (groupId) => {
    const selected = availableGroups.find((g) => g._id === groupId);
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

    if (formData.role === 'student') {
      if (availableGroups.length > 0 && !formData.groupId) {
        setErrors({ groupId: 'Please select a Group/Batch to complete registration' });
        toast.warning('Please select a Group/Batch');
        return;
      }
    }

    setErrors({});
    setStep(3);
  };

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await register(formData);
      if (user?.role === 'admin') navigate('/admin/dashboard');
      else if (user?.role === 'faculty') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      // toast in context
    } finally {
      setLoading(false);
    }
  };

  const handleDynamicChange = (fieldId, val) => {
    setFormData({
      ...formData,
      customFields: { ...formData.customFields, [fieldId]: val },
    });
  };

  const selectedGroupObj = availableGroups.find((g) => g._id === formData.groupId);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary py-5 px-3">
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 w-100 bg-body" style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div className="rounded-3 bg-primary p-3 d-inline-block text-white mb-2 shadow-sm">
            <Terminal size={32} />
          </div>
          <h3 className="fw-bold text-body m-0">Create Account</h3>
          <p className="text-secondary small mt-1 mb-0">Join the next-generation examination & learning platform</p>
        </div>

        {/* Step Indicator Bar */}
        <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
          <span className={`badge ${step >= 1 ? 'bg-primary' : 'bg-secondary'} font-monospace px-3 py-2 rounded-pill`}>
            1. Account
          </span>
          <span className="text-secondary">───</span>
          <span className={`badge ${step >= 2 ? 'bg-primary' : 'bg-secondary'} font-monospace px-3 py-2 rounded-pill`}>
            2. Academic & Group
          </span>
          <span className="text-secondary">───</span>
          <span className={`badge ${step >= 3 ? 'bg-primary' : 'bg-secondary'} font-monospace px-3 py-2 rounded-pill`}>
            3. Confirmation
          </span>
        </div>

        {/* Step 1: Account Details */}
        {step === 1 && (
          <form onSubmit={handleNextStep1}>
            <Input
              label="Full Name"
              required
              placeholder="Aman Verma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              autoFocus
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="aman@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />

            <Input
              label="Mobile Number"
              type="tel"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
            />

            <Button type="submit" variant="primary" className="w-100 mt-2 py-2.5 rounded-pill fw-semibold shadow-sm">
              Next Step (Academic & Group) <ArrowRight size={16} />
            </Button>
          </form>
        )}

        {/* Step 2: Academic Details & Group Assignment */}
        {step === 2 && (
          <form onSubmit={handleNextStep2}>
            <div className="mb-3">
              <label className="form-label small text-secondary fw-semibold">Registering As Role *</label>
              <select
                className="form-select fw-semibold py-2"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student Candidate</option>
                <option value="faculty">Faculty Instructor</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                {/* College Selection */}
                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold">College / Institution *</label>
                  <input
                    type="text"
                    list="colleges-list"
                    className="form-control fw-semibold"
                    placeholder="Type or select college..."
                    value={formData.college}
                    onChange={(e) => {
                      setFormData({ ...formData, college: e.target.value, groupId: '' });
                    }}
                    required
                  />
                  <datalist id="colleges-list">
                    {collegesList.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                    <option value="Engineering College" />
                    <option value="Lucknow College" />
                  </datalist>
                </div>

                {/* Group Dropdown (Dynamically Loaded based on selected College) */}
                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold d-flex justify-content-between align-items-center">
                    <span>Assigned Group / Batch *</span>
                    {groupsLoading && <span className="spinner-border spinner-border-sm text-primary" role="status" />}
                  </label>

                  {groupsLoading ? (
                    <div className="form-control bg-body-tertiary text-muted small">Loading available groups...</div>
                  ) : availableGroups.length === 0 ? (
                    <div className="alert alert-warning p-2 small mb-0 d-flex align-items-center gap-2 rounded-3">
                      <AlertCircle size={16} className="text-warning flex-shrink-0" />
                      <span>No groups available for <strong>"{formData.college}"</strong></span>
                    </div>
                  ) : (
                    <select
                      className={`form-select fw-semibold ${errors.groupId ? 'is-invalid' : ''}`}
                      value={formData.groupId}
                      onChange={(e) => handleGroupSelect(e.target.value)}
                      required
                    >
                      <option value="">-- Select Your Assigned Group --</option>
                      {availableGroups.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name} [{g.code}] ({g.course} - Sem {g.semester})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.groupId && <div className="invalid-feedback">{errors.groupId}</div>}
                </div>

                {/* Auto-filled / Editable Academic Info */}
                <div className="row g-2">
                  <div className="col-6">
                    <Input
                      label="Course"
                      placeholder="B.Tech"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <Input
                      label="Branch / Dept"
                      placeholder="CSE"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <Input
                      label="Semester"
                      placeholder="6th"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <Input
                      label="Roll Number"
                      placeholder="CS2026042"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Dynamic Form Custom Fields */}
            <DynamicFormRenderer
              formType="student_registration"
              values={formData.customFields}
              onChange={handleDynamicChange}
            />

            <div className="d-flex gap-2 mt-3">
              <Button type="button" variant="outline-secondary" onClick={() => setStep(1)} className="w-50 rounded-pill fw-semibold">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button type="submit" variant="primary" className="w-50 rounded-pill fw-semibold shadow-sm">
                Next Step <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <form onSubmit={handleSubmitFinal}>
            <div className="p-3 rounded-4 bg-body-tertiary border mb-4 small">
              <h6 className="fw-bold text-body mb-2">Review Your Information</h6>
              <div className="text-secondary mb-1">Name: <strong className="text-body">{formData.name}</strong></div>
              <div className="text-secondary mb-1">Email: <strong className="text-body">{formData.email}</strong></div>
              <div className="text-secondary mb-1">Role: <strong className="text-primary text-uppercase">{formData.role}</strong></div>
              {formData.role === 'student' && (
                <>
                  <div className="text-secondary mb-1">College: <strong className="text-body">{formData.college}</strong></div>
                  <div className="text-secondary mb-1">
                    Group / Batch: <strong className="text-primary">{selectedGroupObj ? `${selectedGroupObj.name} [${selectedGroupObj.code}]` : 'Not assigned'}</strong>
                  </div>
                  <div className="text-secondary mb-1">Course / Dept: <strong className="text-body">{formData.course} ({formData.branch})</strong></div>
                  <div className="text-secondary">Roll No: <strong className="text-body">{formData.rollNumber || 'Auto-generated'}</strong></div>
                </>
              )}
            </div>

            <div className="d-flex gap-2">
              <Button type="button" variant="outline-secondary" onClick={() => setStep(2)} className="w-50 rounded-pill fw-semibold">
                <ArrowLeft size={16} /> Edit Info
              </Button>
              <Button type="submit" variant="success" loading={loading} className="w-50 rounded-pill fw-semibold shadow-sm">
                <CheckCircle2 size={16} /> Complete Registration
              </Button>
            </div>
          </form>
        )}

        <div className="text-center mt-4 pt-3 border-top small text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary text-decoration-none fw-semibold">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;