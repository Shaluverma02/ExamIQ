import '../../styles/student.css';
import './student-achievements.css';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
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
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/certificates');
      setCertificates(res.data.certificates || []);
    } catch (err) {
      setError('We could not load your certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (certId) => {
    const input = document.getElementById(`cert-card-${certId}`);
    if (!input) return;

    try {
      setDownloadingId(certId);
      toast.info('Preparing your certificate PDF…');
      const canvas = await html2canvas(input, { scale: 2.5, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = Math.min(pdfHeight - 20, (canvas.height * (pdfWidth - 20)) / canvas.width);
      const imageWidth = imageHeight * canvas.width / canvas.height;
      pdf.addImage(imgData, 'PNG', (pdfWidth - imageWidth) / 2, (pdfHeight - imageHeight) / 2, imageWidth, imageHeight);
      pdf.save(`Certificate_${certId}.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="student-page">
      <PageHeader
        className="student-achievement-header"
        eyebrow="YOUR ACHIEVEMENTS"
        title="Certificates"
        description="A record of your hard work. Download and share your verified assessment credentials."
        icon={Award}
        actions={<span className="student-achievement-count"><Award size={15} />{loading ? 'Loading…' : `${certificates.length} ${certificates.length === 1 ? 'credential' : 'credentials'}`}</span>}
      />
      {loading ? (
        <div className="student-loading card" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><p>Loading your certificates…</p></div>
      ) : error ? (
        <EmptyState title="Certificates unavailable" description={error} actionLabel="Try again" onAction={fetchCertificates} />
      ) : certificates.length === 0 ? (
        <EmptyState icon={Award} title="Your achievements belong here" description="Pass an eligible assessment to earn your first certificate. Your verified credentials will appear here." />
      ) : (
        <div className="student-certificate-grid">
          {certificates.map((cert) => (
            <article key={cert._id} className="student-certificate-card">
              <div id={'cert-card-' + cert.certificateId} className="student-certificate">
                <div className="student-certificate-topline">
                  <div className="student-certificate-brand">
                    <span className="student-certificate-brand-icon"><Award size={20} /></span>
                    <div><strong>ExamIQ</strong><span>Verified achievement</span></div>
                  </div>
                  <div className="student-certificate-qr" aria-label="Certificate verification QR code">
                    <QRCodeSVG value={cert.verificationUrl || window.location.origin + '/verify-certificate/' + cert.certificateId} size={64} />
                  </div>
                </div>
                <div className="student-certificate-copy">
                  <span className="student-certificate-kicker"><Sparkles size={14} /> CERTIFICATE OF ACHIEVEMENT</span>
                  <h2>{cert.studentId?.name || 'Student'}</h2>
                  <p>has successfully completed</p>
                  <h3>{cert.examId?.title || 'Assessment'}</h3>
                </div>
                <div className="student-certificate-metrics">
                  <div><span>Grade</span><strong className="is-grade">{cert.grade || 'Pass'}</strong></div>
                  <div><span>Score</span><strong>{cert.percentage}%</strong></div>
                  <div><span>Points</span><strong>{cert.score}</strong></div>
                </div>
                <div className="student-certificate-meta">
                  <div className="student-certificate-issued"><span>ISSUED ON</span><strong>{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable'}</strong></div>
                  <div className="student-certificate-seal"><CheckCircle2 size={17} /><span><strong>Verified credential</strong><small>ExamIQ digital certificate</small></span></div>
                </div>
                <div className="student-certificate-id">CERTIFICATE ID <strong>{cert.certificateId}</strong></div>
              </div>
              <div className="student-certificate-actions" data-html2canvas-ignore="true">
                <a href={cert.verificationUrl || '/verify-certificate/' + cert.certificateId} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm"><ExternalLink size={15} /> Verify credential</a>
                <button type="button" className="btn btn-primary btn-sm" disabled={Boolean(downloadingId)} onClick={() => handleDownloadPDF(cert.certificateId)}><Download size={15} /> {downloadingId === cert.certificateId ? 'Preparing PDF…' : 'Download PDF'}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
