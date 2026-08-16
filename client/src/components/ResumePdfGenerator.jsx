import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';
import { Download, FileText, Sparkles, ExternalLink } from 'lucide-react';

const ResumePdfGenerator = ({ user, profile }) => {
  const handleDownloadResumePdf = async () => {
    const input = document.getElementById('resume-pdf-template');
    if (!input) {
      toast.error('Resume template element not found');
      return;
    }

    try {
      toast.info('Generating ATS-Friendly Professional Resume PDF...');
      const canvas = await html2canvas(input, { scale: 2.5, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${(user?.name || 'Student').replace(/\s+/g, '_')}_Resume.pdf`);
      toast.success('Professional Resume PDF generated & downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Resume PDF');
    }
  };

  const skillsList = Array.isArray(profile?.skills) ? profile.skills : (profile?.skills || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div>
      <button
        type="button"
        className="btn btn-outline-info fw-bold btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-2 shadow-sm"
        onClick={handleDownloadResumePdf}
      >
        <FileText size={16} /> Download Resume PDF
      </button>

      {/* Hidden Render Template for High-Res HTML2Canvas capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div
          id="resume-pdf-template"
          style={{
            width: '800px',
            minHeight: '1130px',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            fontFamily: "'Inter', sans-serif",
            padding: '40px 50px',
            boxSizing: 'border-box',
          }}
        >
          {/* Resume Header */}
          <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '24px' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
              {user?.name || 'Candidate Student'}
            </h1>
            <div style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600', marginTop: '4px' }}>
              {profile?.course || 'Computer Science Engineering'} Candidate • {profile?.college || 'Institute of Technology'}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#475569' }}>
              <div>📧 {user?.email}</div>
              {user?.phone && <div>📞 {user.phone}</div>}
              {profile?.rollNumber && <div>🆔 Roll: {profile.rollNumber}</div>}
              {profile?.linkedinUrl && <div>🔗 LinkedIn: {profile.linkedinUrl}</div>}
              {profile?.githubUrl && <div>💻 GitHub: {profile.githubUrl}</div>}
              {profile?.portfolioUrl && <div>🌐 Portfolio: {profile.portfolioUrl}</div>}
            </div>
          </div>

          {/* Education Section */}
          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
              Education
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{profile?.college || 'Engineering Institution'}</strong>
                <div style={{ fontSize: '13px', color: '#475569' }}>{profile?.course || 'Bachelor of Technology'} — {profile?.branch || 'CSE'}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
                <div>Semester: {profile?.semester || '6th'}</div>
                {profile?.cgpa && <div style={{ fontWeight: '700', color: '#16a34a' }}>CGPA: {profile.cgpa}</div>}
              </div>
            </div>
          </div>

          {/* Technical Skills Section */}
          {skillsList.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
                Technical Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {profile?.projects && profile.projects.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
                Projects & Software Engineering
              </h3>
              {profile.projects.map((proj, pIdx) => (
                <div key={pIdx} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{proj.title}</strong>
                    {proj.techStack && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>{proj.techStack}</span>}
                  </div>
                  {proj.description && <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0' }}>{proj.description}</p>}
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {proj.githubUrl && <span>GitHub: {proj.githubUrl} </span>}
                    {proj.liveUrl && <span> | Live: {proj.liveUrl}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Experience Section */}
          {profile?.experience && profile.experience.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>
                Work Experience & Internships
              </h3>
              {profile.experience.map((exp, eIdx) => (
                <div key={eIdx} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{exp.role} — {exp.company}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{exp.duration}</span>
                  </div>
                  {exp.description && <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0' }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Footer watermark */}
          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f1f5f9', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
            Verified Student Credential Profile • Generated via ExamiQ Academic Portal
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePdfGenerator;
