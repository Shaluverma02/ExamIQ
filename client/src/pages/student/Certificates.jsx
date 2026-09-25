import '../../styles/student.css';
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
      <PageHeader eyebrow="Your achievements" title="Certificates" description="A record of your hard work. Download and share your verified assessment credentials." actions={<span className="badge bg-primary">{loading ? 'Loading…' : certificates.length + ' credentials'}</span>} />
      {loading ? (
        <div className="student-loading card" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><p>Loading your certificates…</p></div>
      ) : error ? (
        <EmptyState title="Certificates unavailable" description={error} actionLabel="Try again" onAction={fetchCertificates} />
      ) : certificates.length === 0 ? (
        <EmptyState icon={Award} title="Your achievements belong here" description="Pass an eligible assessment to earn your first certificate. Your verified credentials will appear here." />
      ) : (
        <div className="row g-4">
          {certificates.map((cert) => (
            <div key={cert._id} className="col-12 col-xl-6">
              <article className="card p-3 h-100">
                <div id={'cert-card-' + cert.certificateId} className="student-certificate h-100">
                  <div className="student-certificate-topline">
                    <div>
                      <div className="d-flex align-items-center gap-2 text-body fw-bold mb-2"><Award size={25} /> ExamIQ</div>
                      <div className="small text-muted">Verified assessment credential</div>
                      <div className="small text-muted mt-1" style={{ overflowWrap: 'anywhere' }}>ID: {cert.certificateId}</div>
                    </div>
                    <div className="bg-white p-2 rounded-3 align-self-start">
                      <QRCodeSVG value={cert.verificationUrl || window.location.origin + '/verify-certificate/' + cert.certificateId} size={64} />
                    </div>
                  </div>
                  <div className="text-center py-3">
                    <div className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.16em' }}>Certificate of achievement</div>
                    <h2 className="h3 mb-3">{cert.studentId?.name || 'Student'}</h2>
                    <p className="text-muted small mb-2">has successfully completed the assessment</p>
                    <h3 className="h5 text-body mb-4">{cert.examId?.title || 'Assessment'}</h3>
                    <div className="d-inline-flex flex-wrap justify-content-center gap-3 px-4 py-3 rounded-3 bg-body-tertiary small">
                      <span>Grade <strong className="text-success ms-1">{cert.grade || 'Pass'}</strong></span>
                      <span>Score <strong className="text-info ms-1">{cert.percentage}%</strong></span>
                      <span className="text-muted">{cert.score} points</span>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap justify-content-between gap-3 border-top pt-4 mt-3">
                    <div className="small text-muted">Issued {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable'}</div>
                    <div className="small text-success d-flex align-items-center gap-1"><ShieldCheck size={16} /> ExamIQ digital credential</div>
                  </div>
                </div>
                <div className="student-certificate-actions" data-html2canvas-ignore="true">
                  <a href={cert.verificationUrl || '/verify-certificate/' + cert.certificateId} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm"><ExternalLink size={15} /> Verify credential</a>
                  <button type="button" className="btn btn-primary btn-sm" disabled={Boolean(downloadingId)} onClick={() => handleDownloadPDF(cert.certificateId)}><Download size={15} /> {downloadingId === cert.certificateId ? 'Preparing PDF…' : 'Download PDF'}</button>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
