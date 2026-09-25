import '../../styles/student.css';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Trophy } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFilters();
    fetchLeaderboard();
  }, []);

  const fetchFilters = async () => {
    try {
      const [exRes, grpRes] = await Promise.all([
        API.get('/exams?status=published'),
        API.get('/groups').catch(() => ({ data: { groups: [] } })),
      ]);
      setExams(exRes.data.exams || []);
      setGroups(grpRes.data.groups || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async (examId = selectedExam, groupId = selectedGroup) => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (examId) params.examId = examId;
      if (groupId) params.groupId = groupId;

      const res = await API.get('/leaderboard', { params });
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      setError('We could not load the leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (e) => {
    const val = e.target.value;
    setSelectedExam(val);
    fetchLeaderboard(val, selectedGroup);
  };

  const handleGroupChange = (e) => {
    const val = e.target.value;
    setSelectedGroup(val);
    fetchLeaderboard(selectedExam, val);
  };

  const topCandidates = leaderboard.slice(0, 3);

  return (
    <div className="student-page">
      <PageHeader eyebrow="Community progress" title="Leaderboard" description="Celebrate strong performances and explore assessment rankings across your groups." />
      <div className="student-toolbar">
        <div className="d-flex align-items-center gap-2"><Trophy size={19} className="text-primary" /><span className="fw-semibold">Assessment rankings</span></div>
        <div className="d-flex flex-wrap gap-2">
          <select className="form-select w-auto" aria-label="Filter rankings by group" value={selectedGroup} onChange={handleGroupChange}>
            <option value="">All groups</option>
            {groups.map((group) => <option key={group._id} value={group._id}>{group.name}</option>)}
          </select>
          <select className="form-select w-auto" aria-label="Filter rankings by assessment" value={selectedExam} onChange={handleExamChange}>
            <option value="">All published assessments</option>
            {exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.title}</option>)}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="student-loading card" role="status"><span className="spinner-border text-primary" aria-hidden="true" /><p>Loading assessment rankings…</p></div>
      ) : error ? (
        <EmptyState title="Rankings unavailable" description={error} actionLabel="Try again" onAction={() => fetchLeaderboard()} />
      ) : leaderboard.length === 0 ? (
        <EmptyState icon={Trophy} title="Every achievement starts somewhere" description="Completed assessment rankings will appear here. Try another group or assessment filter." />
      ) : (
        <>
          <section aria-label="Top ranked candidates" className="student-leader-podium">
            {topCandidates.map((candidate) => (
              <article className="card student-leader-card" key={candidate.rank}>
                <span className="student-leader-rank" aria-label={'Rank ' + candidate.rank}>{candidate.rank === 1 ? <Trophy size={23} /> : '#' + candidate.rank}</span>
                <h2 className="h5 mb-1">{candidate.studentName}</h2>
                <p className="text-muted small mb-3">{candidate.examTitle || 'Assessment'}</p>
                <div className="student-leader-score">{candidate.totalScore}<span className="small fw-normal text-muted ms-1">pts</span></div>
                <div className="small text-muted mt-1">{candidate.percentage}% score</div>
              </article>
            ))}
          </section>
          <div className="card overflow-hidden">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center gap-2">
              <h2 className="h6 mb-0">All rankings</h2><span className="text-muted small">{leaderboard.length} entries</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 student-leader-table">
                <caption className="visually-hidden">Assessment leaderboard with candidate scores and results</caption>
                <thead><tr><th scope="col" className="ps-4">Rank</th><th scope="col">Candidate</th><th scope="col">Assessment</th><th scope="col">Points</th><th scope="col">Score</th><th scope="col" className="text-end pe-4">Result</th></tr></thead>
                <tbody>
                  {leaderboard.map((row) => (
                    <tr key={row.rank}>
                      <td className="ps-4"><span className={row.rank <= 3 ? 'badge bg-primary' : 'text-muted fw-semibold'}>#{row.rank}</span></td>
                      <td><div className="d-flex align-items-center gap-3"><span className="profile-avatar">{row.studentName?.slice(0, 1) || 'S'}</span><div><div className="fw-semibold">{row.studentName}</div><div className="text-muted small">{row.studentEmail}</div></div></div></td>
                      <td>{row.examTitle}</td>
                      <td className="fw-semibold">{row.totalScore}</td>
                      <td><span className="fw-semibold text-primary">{row.percentage}%</span></td>
                      <td className="text-end pe-4"><span className={'badge ' + (row.status === 'Pass' ? 'bg-success' : row.status === 'Fail' ? 'bg-danger' : 'bg-secondary')}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
