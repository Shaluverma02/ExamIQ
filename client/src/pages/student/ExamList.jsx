import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Clock, Award, CheckCircle2, ArrowRight } from 'lucide-react';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await API.get('/exams?status=published');
      setExams(res.data.exams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((ex) =>
    ex.title.toLowerCase().includes(search.toLowerCase()) ||
    ex.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold text-light m-0">Exams Portal</h3>
          <p className="text-muted small m-0">Browse and attempt objective MCQs & coding assessments</p>
        </div>

        <div className="position-relative" style={{ width: 280 }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control bg-secondary text-light border-0 ps-5"
            placeholder="Search exam by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Loading available exams...</div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-5 glass-card text-muted">No exams match your search criteria.</div>
      ) : (
        <div className="row g-4">
          {filteredExams.map((exam) => (
            <div key={exam._id} className="col-12 col-md-6 col-lg-4">
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between border border-secondary">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-20">
                      {exam.category}
                    </span>
                    <span className="text-muted small d-flex align-items-center gap-1">
                      <Clock size={14} /> {exam.duration} mins
                    </span>
                  </div>

                  <h5 className="fw-bold text-light mb-2">{exam.title}</h5>
                  <p className="text-secondary small line-clamp-2 mb-3">{exam.description || 'Comprehensive assessment test.'}</p>

                  <div className="d-flex gap-3 small text-muted mb-4 border-top border-bottom border-secondary py-2">
                    <div>Questions: <strong className="text-light">{exam.questions?.length || 0} MCQ</strong></div>
                    <div>Coding: <strong className="text-light">{exam.codingProblems?.length || 0} Code</strong></div>
                    <div>Marks: <strong className="text-light">{exam.totalMarks}</strong></div>
                  </div>
                </div>

                <Link
                  to={`/student/exam/${exam._id}/attempt`}
                  className="btn btn-primary w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                >
                  Start Assessment <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;
