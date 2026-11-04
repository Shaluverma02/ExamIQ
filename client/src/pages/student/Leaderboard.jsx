import '../../styles/student.css';
import './student-achievements.css';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Award, Medal, Trophy, UsersRound } from 'lucide-react';

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
      <PageHeader
        className="student-achievement-header"
        eyebrow="COMMUNITY PROGRESS"
        title="Leaderboard"
        description="Celebrate strong performances and explore assessment rankings across your groups."
        icon={Trophy}
      />
      <div className="student-ranking-toolbar">
        <div className="student-ranking-toolbar-copy">
          <span className="student-ranking-toolbar-icon"><Trophy size={18} /></span>
          <div><strong>Assessment rankings</strong><span>Find a group or assessment</span></div>
        </div>
        <div className="student-ranking-filters">
          <label>
            <span>GROUP</span>
            <select className="form-select" aria-label="Filter rankings by group" value={selectedGroup} onChange={handleGroupChange}>
              <option value="">All groups</option>
              {groups.map((group) => <option key={group._id} value={group._id}>{group.name}</option>)}
            </select>
          </label>
          <label>
            <span>ASSESSMENT</span>
            <select className="form-select" aria-label="Filter rankings by assessment" value={selectedExam} onChange={handleExamChange}>
              <option value="">All published assessments</option>
              {exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.title}</option>)}
            </select>
          </label>
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
          <div className="student-ranking-section-heading">
            <div><span>THE STANDOUTS</span><h2>Top performers</h2></div>
            <div className="student-ranking-total"><UsersRound size={15} />{leaderboard.length} {leaderboard.length === 1 ? 'participant' : 'participants'}</div>
          </div>
          <section aria-label="Top ranked candidates" className="student-leader-podium">
            {topCandidates.map((candidate) => (
              <article className={`card student-leader-card ${candidate.rank === 1 ? 'is-first' : ''}`} key={candidate.rank}>
                <div className="student-leader-card-top">
                  <span className={`student-leader-rank rank-${candidate.rank}`} aria-label={'Rank ' + candidate.rank}>
                    {candidate.rank === 1 ? <Trophy size={21} /> : candidate.rank === 2 ? <Medal size={21} /> : <Award size={21} />}
                  </span>
                  <span className="student-leader-rank-label">RANK #{candidate.rank}</span>
                </div>
                <span className="student-leader-avatar">{candidate.studentName?.slice(0, 1) || 'S'}</span>
                <h3>{candidate.studentName}</h3>
                <p>{candidate.examTitle || 'Assessment'}</p>
                <div className="student-leader-score">{candidate.totalScore}<span>pts</span></div>
                <div className="student-leader-score-caption">{candidate.percentage}% score</div>
              </article>
            ))}
          </section>
          <section className="card student-ranking-board">
            <div className="student-ranking-board-header">
              <div><span>FULL STANDINGS</span><h2>All rankings</h2></div>
              <span className="student-ranking-entry-count">{leaderboard.length} entries</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 student-leader-table">
                <caption className="visually-hidden">Assessment leaderboard with candidate scores and results</caption>
                <thead><tr><th scope="col" className="ps-4">RANK</th><th scope="col">CANDIDATE</th><th scope="col">ASSESSMENT</th><th scope="col">POINTS</th><th scope="col">SCORE</th><th scope="col" className="text-end pe-4">RESULT</th></tr></thead>
                <tbody>
                  {leaderboard.map((row) => (
                    <tr key={row.rank}>
                      <td className="ps-4"><span className={`student-leader-table-rank ${row.rank <= 3 ? `is-top rank-${row.rank}` : ''}`}>{row.rank <= 3 && <Trophy size={13} />}#{row.rank}</span></td>
                      <td><div className="student-leader-candidate"><span className="student-leader-table-avatar">{row.studentName?.slice(0, 1) || 'S'}</span><div><strong>{row.studentName}</strong><span>{row.studentEmail}</span></div></div></td>
                      <td>{row.examTitle}</td>
                      <td className="fw-semibold">{row.totalScore}</td>
                      <td><span className="fw-semibold text-primary">{row.percentage}%</span></td>
                      <td className="text-end pe-4"><span className={`student-leader-result ${row.status === 'Pass' ? 'is-pass' : row.status === 'Fail' ? 'is-fail' : ''}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
