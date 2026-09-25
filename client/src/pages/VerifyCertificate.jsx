import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, Loader2, Terminal, XCircle } from 'lucide-react';
import API from '../services/api';

const VerifyCertificate = () => {
  const { id: certificateId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await API.get(`/certificates/verify/${certificateId}`);
        setCert(res.data.certificate);
      } catch (err) {
        setError(err.response?.data?.message || 'Certificate record not found or invalid.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [certificateId]);

  return (
    <main className="auth-shell d-flex align-items-center justify-content-center px-3 py-5">
      <section className="card p-4 p-md-5 w-100" style={{ maxWidth: 640 }}>
        <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            <ArrowLeft size={16} />
            Home
          </Link>
          <span className="badge bg-primary d-inline-flex align-items-center gap-1">
            <Award size={14} />
            Public verification
          </span>
        </div>

        <div className="text-center mb-4">
          <div className="brand-mark mb-3">
            <Terminal size={28} />
          </div>
          <h1 className="h3 fw-bold mb-2">ExamiQ credential verification</h1>
          <p className="text-secondary small mb-0">Validate a certificate record using its public verification ID.</p>
        </div>

        {loading ? (
          <div className="surface-muted border rounded-3 p-4 text-center">
            <Loader2 size={34} className="animate-spin text-primary mb-3" />
            <div className="fw-semibold">Checking certificate record</div>
            <p className="text-muted small mb-0">Please wait while ExamiQ validates this ID.</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center mb-0">
            <XCircle size={36} className="mb-2" />
            <h2 className="h5 fw-bold">Invalid certificate</h2>
            <p className="small mb-0">{error}</p>
          </div>
        ) : (
          <div className="alert alert-success mb-0">
            <div className="d-flex align-items-center gap-2 fw-bold fs-5 mb-3">
              <CheckCircle2 size={24} />
              Certificate verified
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="section-label">Certificate ID</div>
                <div className="fw-bold text-primary">{cert.certificateId}</div>
              </div>
              <div className="col-md-6">
                <div className="section-label">Candidate</div>
                <div className="fw-bold">{cert.studentId?.name}</div>
              </div>
              <div className="col-md-6">
                <div className="section-label">Assessment</div>
                <div className="fw-bold">{cert.examId?.title}</div>
              </div>
              <div className="col-md-3">
                <div className="section-label">Score</div>
                <div className="fw-bold">{cert.percentage}%</div>
              </div>
              <div className="col-md-3">
                <div className="section-label">Issued</div>
                <div className="fw-bold">{new Date(cert.issueDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default VerifyCertificate;
