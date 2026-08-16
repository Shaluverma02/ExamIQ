import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { CheckCircle2, XCircle, Award, Terminal, ArrowLeft } from 'lucide-react';

const VerifyCertificate = () => {
  const { id: certificateId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    verify();
  }, [certificateId]);

  const verify = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/certificates/verify/${certificateId}`);
      setCert(res.data.certificate);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate record not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-dark text-light d-flex flex-column align-items-center justify-content-center py-5 px-3" style={{ backgroundColor: '#0b0f19' }}>
      <Link to="/" className="btn btn-outline-secondary btn-sm mb-4 d-inline-flex align-items-center gap-1">
        <ArrowLeft size={16} /> Home
      </Link>

      <div className="glass-card p-5 w-100 animate-fade-in text-center" style={{ maxWidth: 580 }}>
        <div className="rounded-3 bg-primary p-3 d-inline-block text-white mb-3">
          <Terminal size={32} />
        </div>
        <h3 className="fw-extrabold text-light mb-1">ExamiQ Credential Verification</h3>
        <p className="text-muted small mb-4">Official Public Certificate Authentication Portal</p>

        {loading ? (
          <div className="py-4 text-muted">Authenticating certificate record against MongoDB ledger...</div>
        ) : error ? (
          <div className="p-4 rounded-3 bg-danger bg-opacity-20 border border-danger text-danger">
            <XCircle size={36} className="mb-2" />
            <h5 className="fw-bold m-0">Invalid Certificate</h5>
            <p className="small m-0 mt-1">{error}</p>
          </div>
        ) : (
          <div className="p-4 rounded-4 bg-success bg-opacity-10 border border-success text-start">
            <div className="d-flex align-items-center gap-2 text-success fw-bold fs-5 mb-3">
              <CheckCircle2 size={24} /> Certificate Verified & Authentic
            </div>

            <div className="mb-2">
              <span className="text-muted small d-block">Certificate ID:</span>
              <strong className="text-warning fs-5">{cert.certificateId}</strong>
            </div>

            <div className="mb-2">
              <span className="text-muted small d-block">Candidate Name:</span>
              <strong className="text-light">{cert.studentId?.name}</strong>
            </div>

            <div className="mb-2">
              <span className="text-muted small d-block">Assessment Title:</span>
              <strong className="text-light">{cert.examId?.title}</strong>
            </div>

            <div className="d-flex justify-content-between border-top border-secondary pt-3 mt-3">
              <div>
                <span className="text-muted small d-block">Score:</span>
                <strong className="text-success fs-5">{cert.percentage}% ({cert.score} pts)</strong>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Issue Date:</span>
                <span className="text-light">{new Date(cert.issueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
