import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import {
  X,
  User,
  BookOpen,
  Code2,
  Briefcase,
  FolderGit2,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Save,
  GraduationCap,
  Link as LinkIcon,
} from 'lucide-react';

const StudentProfileModal = ({ isOpen, onClose, user, initialProfile, onProfileSaved }) => {
  const [activeTab, setActiveTab] = useState('academic'); // 'academic' | 'skills' | 'projects' | 'experience' | 'links'
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    college: '',
    course: '',
    branch: '',
    semester: '',
    rollNumber: '',
    cgpa: '',
    skillsStr: '',
    projects: [],
    experience: [],
    resumeUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  useEffect(() => {
    if (user || initialProfile) {
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        college: initialProfile?.college || '',
        course: initialProfile?.course || '',
        branch: initialProfile?.branch || '',
        semester: initialProfile?.semester || '',
        rollNumber: initialProfile?.rollNumber || '',
        cgpa: initialProfile?.cgpa || '',
        skillsStr: Array.isArray(initialProfile?.skills) ? initialProfile.skills.join(', ') : '',
        projects: initialProfile?.projects || [],
        experience: initialProfile?.experience || [],
        resumeUrl: initialProfile?.resumeUrl || '',
        linkedinUrl: initialProfile?.linkedinUrl || '',
        githubUrl: initialProfile?.githubUrl || '',
        portfolioUrl: initialProfile?.portfolioUrl || '',
      });
    }
  }, [user, initialProfile, isOpen]);

  if (!isOpen) return null;

  // Calculate section completions
  const secAcademic = Boolean(formData.rollNumber && formData.college && formData.course);
  const secSkills = Boolean(formData.skillsStr && formData.skillsStr.trim().length > 0);
  const secProjects = Boolean(formData.projects && formData.projects.length > 0);
  const secExp = Boolean(formData.experience && formData.experience.length > 0);
  const secLinks = Boolean(formData.resumeUrl || formData.linkedinUrl || formData.githubUrl || formData.portfolioUrl);

  const completedCount = [secAcademic, secSkills, secProjects, secExp, secLinks].filter(Boolean).length;
  const progressPercentage = completedCount * 20;

  // Project handlers
  const handleAddProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' }],
    }));
  };

  const handleUpdateProject = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.projects];
      updated[idx][field] = value;
      return { ...prev, projects: updated };
    });
  };

  const handleRemoveProject = (idx) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  // Experience handlers
  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: '' }],
    }));
  };

  const handleUpdateExperience = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      updated[idx][field] = value;
      return { ...prev, experience: updated };
    });
  };

  const handleRemoveExperience = (idx) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await API.put('/auth/profile', formData);
      toast.success('Student profile updated successfully!');
      if (onProfileSaved) onProfileSaved(res.data.user, res.data.profile);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content glass-card text-light border border-secondary shadow-lg rounded-4">
          {/* Modal Header */}
          <div className="modal-header border-bottom border-secondary px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-primary bg-opacity-20 text-primary rounded-3">
                <GraduationCap size={24} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-light m-0">Student Profile & Career Resume</h5>
                <p className="text-muted small m-0">
                  Complete all 5 sections to reach 100% profile completion
                </p>
              </div>
            </div>

            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          {/* Progress Indicator Header Bar */}
          <div className="bg-dark bg-opacity-50 px-4 py-3 border-bottom border-secondary">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small fw-semibold text-secondary">
                Profile Completion Progress: <strong className="text-success">{completedCount} of 5 sections done</strong>
              </span>
              <span className="badge bg-success font-monospace px-3 py-1">{progressPercentage}%</span>
            </div>

            <div className="progress" style={{ height: 8 }}>
              <div
                className="progress-bar bg-success transition-all"
                role="progressbar"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Nav Tabs Bar */}
          <div className="nav nav-pills nav-fill gap-1 p-2 bg-dark border-bottom border-secondary overflow-x-auto flex-nowrap">
            <button
              className={`nav-link small py-2 px-3 rounded-3 text-nowrap d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'academic' ? 'active bg-primary text-white' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('academic')}
            >
              <BookOpen size={14} /> Academic {secAcademic && <CheckCircle2 size={13} className="text-success" />}
            </button>

            <button
              className={`nav-link small py-2 px-3 rounded-3 text-nowrap d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'skills' ? 'active bg-primary text-white' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('skills')}
            >
              <Code2 size={14} /> Skills {secSkills && <CheckCircle2 size={13} className="text-success" />}
            </button>

            <button
              className={`nav-link small py-2 px-3 rounded-3 text-nowrap d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'projects' ? 'active bg-primary text-white' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('projects')}
            >
              <FolderGit2 size={14} /> Projects {secProjects && <CheckCircle2 size={13} className="text-success" />}
            </button>

            <button
              className={`nav-link small py-2 px-3 rounded-3 text-nowrap d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'experience' ? 'active bg-primary text-white' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('experience')}
            >
              <Briefcase size={14} /> Experience {secExp && <CheckCircle2 size={13} className="text-success" />}
            </button>

            <button
              className={`nav-link small py-2 px-3 rounded-3 text-nowrap d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'links' ? 'active bg-primary text-white' : 'text-secondary'
              }`}
              onClick={() => setActiveTab('links')}
            >
              <LinkIcon size={14} /> Resume & Links {secLinks && <CheckCircle2 size={13} className="text-success" />}
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              {/* Tab 1: Academic Info */}
              {activeTab === 'academic' && (
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small">Full Name</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-light"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small">Phone Number</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-light"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small">College / Institute</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-light"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      placeholder="e.g. ABC Institute of Technology"
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small">Degree / Course</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-light"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      placeholder="e.g. B.Tech Computer Science"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-secondary small">Branch</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-light"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="CSE / IT / ECE"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-secondary small">Semester</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-light"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      placeholder="e.g. 6th"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-secondary small">Roll / Enrollment No.</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-light"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      placeholder="2100450100"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-secondary small">CGPA / Aggregate %</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-light"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      placeholder="8.5 / 85%"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Technical Skills */}
              {activeTab === 'skills' && (
                <div>
                  <label className="form-label text-secondary small fw-bold">
                    Technical & Programming Skills (Comma-separated)
                  </label>
                  <textarea
                    rows={4}
                    className="form-control bg-dark border-secondary text-light mb-3"
                    placeholder="JavaScript, React, Node.js, Python, SQL, C++, HTML/CSS, Git, Docker"
                    value={formData.skillsStr}
                    onChange={(e) => setFormData({ ...formData, skillsStr: e.target.value })}
                  />

                  <div className="small text-muted mb-2">Preview Skill Badges:</div>
                  <div className="d-flex flex-wrap gap-2 p-3 bg-dark rounded-3 border border-secondary">
                    {formData.skillsStr
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean).length === 0 ? (
                      <span className="text-muted small">No skills entered yet.</span>
                    ) : (
                      formData.skillsStr
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((sk, idx) => (
                          <span key={idx} className="badge bg-primary bg-opacity-20 text-primary border border-primary px-3 py-1">
                            {sk}
                          </span>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Projects & Portfolio */}
              {activeTab === 'projects' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="small text-secondary">Showcase your technical projects to recruiters</span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1"
                      onClick={handleAddProject}
                    >
                      <Plus size={15} /> Add Project
                    </button>
                  </div>

                  {formData.projects.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-secondary rounded-4 text-muted">
                      No projects added yet. Click "+ Add Project" to showcase your work.
                    </div>
                  ) : (
                    formData.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="glass-card p-3 mb-3 border border-secondary rounded-3 position-relative">
                        <button
                          type="button"
                          className="btn btn-sm text-danger position-absolute top-0 end-0 m-2"
                          onClick={() => handleRemoveProject(pIdx)}
                          title="Remove project"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="row g-2 me-4">
                          <div className="col-12 col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="Project Title (e.g. AI Code Evaluator)"
                              value={proj.title}
                              onChange={(e) => handleUpdateProject(pIdx, 'title', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="Tech Stack (e.g. React, Node.js, MongoDB)"
                              value={proj.techStack}
                              onChange={(e) => handleUpdateProject(pIdx, 'techStack', e.target.value)}
                            />
                          </div>
                          <div className="col-12">
                            <textarea
                              rows={2}
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="Brief description of key features and architecture..."
                              value={proj.description}
                              onChange={(e) => handleUpdateProject(pIdx, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <input
                              type="url"
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="GitHub Repository URL"
                              value={proj.githubUrl}
                              onChange={(e) => handleUpdateProject(pIdx, 'githubUrl', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <input
                              type="url"
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="Live Project URL"
                              value={proj.liveUrl}
                              onChange={(e) => handleUpdateProject(pIdx, 'liveUrl', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Work Experience */}
              {activeTab === 'experience' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="small text-secondary">Add internship or work experience</span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1"
                      onClick={handleAddExperience}
                    >
                      <Plus size={15} /> Add Experience
                    </button>
                  </div>

                  {formData.experience.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-secondary rounded-4 text-muted">
                      No experience added yet. Click "+ Add Experience" to record internships.
                    </div>
                  ) : (
                    formData.experience.map((exp, eIdx) => (
                      <div key={eIdx} className="glass-card p-3 mb-3 border border-secondary rounded-3 position-relative">
                        <button
                          type="button"
                          className="btn btn-sm text-danger position-absolute top-0 end-0 m-2"
                          onClick={() => handleRemoveExperience(eIdx)}
                          title="Remove experience"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="row g-2 me-4">
                          <div className="col-12 col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="Company Name (e.g. TCS)"
                              value={exp.company}
                              onChange={(e) => handleUpdateExperience(eIdx, 'company', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="Role (e.g. Frontend Intern)"
                              value={exp.role}
                              onChange={(e) => handleUpdateExperience(eIdx, 'role', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="Duration (e.g. Jun 2025 - Aug 2025)"
                              value={exp.duration}
                              onChange={(e) => handleUpdateExperience(eIdx, 'duration', e.target.value)}
                            />
                          </div>
                          <div className="col-12">
                            <textarea
                              rows={2}
                              className="form-control form-control-sm bg-dark border-secondary text-light"
                              placeholder="Key responsibilities and contributions..."
                              value={exp.description}
                              onChange={(e) => handleUpdateExperience(eIdx, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: Resume & Social Links */}
              {activeTab === 'links' && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-secondary small">Resume PDF Link (Google Drive / Cloudinary)</label>
                    <input
                      type="url"
                      className="form-control bg-dark border-secondary text-light"
                      placeholder="https://drive.google.com/file/d/..."
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="form-control bg-dark border-secondary text-light"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small">GitHub Profile URL</label>
                    <input
                      type="url"
                      className="form-control bg-dark border-secondary text-light"
                      placeholder="https://github.com/username"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-secondary small">Personal Portfolio Website</label>
                    <input
                      type="url"
                      className="form-control bg-dark border-secondary text-light"
                      placeholder="https://myportfolio.com"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-top border-secondary px-4 py-3 d-flex justify-content-between">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                Cancel
              </button>

              <button type="submit" className="btn btn-success fw-bold rounded-pill px-4 d-flex align-items-center gap-2" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving Profile...' : 'Save & Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
