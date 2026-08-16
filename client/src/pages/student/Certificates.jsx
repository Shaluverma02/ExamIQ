import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Award, Download, ExternalLink, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await API.get('/certificates');
      setCertificates(res.data.certificates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (certId) => {
    const input = document.getElementById(`cert-card-${certId}`);
    if (!input) return;

    try {
      toast.info('Generating high-resolution Certificate PDF...');
      const canvas = await html2canvas(input, { scale: 2.5, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate_${certId}.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-extrabold text-light m-0 d-flex align-items-center gap-2">
          <Award className="text-warning" size={28} /> Verified Credentials & Certificates
        </h3>
        <p className="text-muted small m-0">Cryptographically verifiable certificates issued upon successful assessment completion</p>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Fetching credentials...</div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-5 glass-card text-muted">
          No certificates earned yet. Pass an examination to unlock your verified credential.
        </div>
      ) : (
        <div className="row g-4">
          {certificates.map((cert) => (
            <div key={cert._id} className="col-12 col-xl-6">
              {/* Luxury Gold-Framed Certificate Card */}
              <div
                id={`cert-card-${cert.certificateId}`}
                className="p-4 p-md-5 rounded-4 position-relative overflow-hidden shadow-lg border"
                style={{
                  background: 'linear-gradient(135deg, #0b0f19 0%, #151c2e 50%, #0f172a 100%)',
                  borderImage: 'linear-gradient(45deg, #f59e0b, #3b82f6, #f59e0b) 1',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                }}
              >
                {/* Certificate Background Pattern Overlay */}
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />

                {/* Header Header Seals */}
                <div className="d-flex justify-content-between align-items-start mb-4 position-relative">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-warning bg-opacity-20 text-warning p-2 border border-warning">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <span className="badge bg-warning text-dark text-uppercase font-monospace px-3 py-1 fw-extrabold">
                        Verified Academic Credential
                      </span>
                      <div className="small text-muted font-monospace mt-1">ID: {cert.certificateId}</div>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-3 shadow-sm">
                    <QRCodeSVG value={cert.verificationUrl || `http://localhost:5173/verify-certificate/${cert.certificateId}`} size={70} />
                  </div>
                </div>

                {/* Body Content */}
                <div className="text-center my-4 py-2 position-relative">
                  <div className="text-uppercase text-muted fw-bold small mb-1" style={{ letterSpacing: '2px' }}>
                    Certificate of Achievement
                  </div>
                  <h2 className="fw-extrabold text-light mb-3">{cert.studentId?.name || 'Candidate Student'}</h2>
                  <p className="text-secondary small mb-3" style={{ maxWidth: 500, margin: '0 auto' }}>
                    has successfully passed the comprehensive assessment for
                  </p>
                  <h4 className="fw-bold text-warning mb-3">{cert.examId?.title || 'Examination Assessment'}</h4>
                  <div className="d-inline-flex gap-3 px-4 py-2 rounded-pill bg-dark border border-secondary text-light small font-monospace">
                    <span>Grade: <strong className="text-success">{cert.grade || 'Pass'}</strong></span>
                    <span>•</span>
                    <span>Score: <strong className="text-info">{cert.percentage}%</strong> ({cert.score} pts)</span>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="d-flex justify-content-between align-items-end border-top border-secondary pt-3 mt-4 position-relative">
                  <div className="small text-muted">
                    <div>Issued: <strong className="text-light">{new Date(cert.issueDate || Date.now()).toLocaleDateString()}</strong></div>
                    <div className="text-success d-flex align-items-center gap-1 mt-1">
                      <ShieldCheck size={14} /> Official ExamiQ Digital Seal
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <a
                      href={cert.verificationUrl || `/verify-certificate/${cert.certificateId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 rounded-pill px-3"
                    >
                      <ExternalLink size={14} /> Verify Online
                    </a>
                    <button
                      className="btn btn-warning btn-sm fw-bold d-flex align-items-center gap-1 rounded-pill px-3"
                      onClick={() => handleDownloadPDF(cert.certificateId)}
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
