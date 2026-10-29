import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, BarChart3, Download, GraduationCap, TrendingUp, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { CollegeMetric, CollegePanel, CollegeError, CollegeLoading } from '../../components/college/CollegeUI';
import useCollegeOverview from '../../hooks/useCollegeOverview';
import { downloadResultsExcel } from '../../utils/downloadExcel';
import { downloadCSV } from '../../utils/exportCSV';
import API, { getApiErrorMessage } from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/super-admin.css';

export default function CollegeAnalytics({ platform = false }) {
  const { analytics, loading, error, reload } = useCollegeOverview({ includeGroups: !platform });
  const [exporting, setExporting] = useState('');
  const a = analytics || {};
  const exportResults = async format => {
    if (exporting) return;
    setExporting(format);
    try {
      if (format === 'excel') await downloadResultsExcel();
      else {
        const response = await API.get('/results');
        const results = response.data.results || [];
        if (!results.length) return toast.info('No results available to export.');
        downloadCSV(results.map(r => ({ Student: r.studentId?.name || '', Email: r.studentId?.email || '', Assessment: r.examId?.title || '', Score: r.totalScore, 'Total marks': r.totalMarks, Percentage: r.percentage, Status: r.status })), 'college-results.csv');
      }
    } catch (err) { toast.error(getApiErrorMessage(err)); }
    finally { setExporting(''); }
  };
  const outcomes = [{ name: 'Passed', value: a.passCount || 0 }, { name: 'Needs improvement', value: a.failCount || 0 }];
  const participation = [{ name: 'Students', total: a.totalStudents || 0 }, { name: 'Faculty', total: a.totalFaculty || 0 }, { name: 'Assessments', total: a.totalExams || 0 }, { name: 'Attempts', total: a.totalAttempts || 0 }];
  return <div className={'workspace-page' + (platform ? ' sa-dashboard' : '')}>
    <PageHeader icon={BarChart3} eyebrow={platform ? 'PERFORMANCE & PARTICIPATION' : 'COLLEGE INSIGHTS'} title={platform ? 'System analytics' : 'See the bigger picture.'} description={platform ? 'Assessment outcomes and participation · ' + (analytics?.college?.name || 'Across the platform') : 'Understand participation, progress and assessment outcomes in your institution.'} actions={<><button className="btn btn-outline-secondary" onClick={reload} disabled={loading} aria-label="Refresh analytics"><RefreshCw size={16} /></button><button className="btn btn-outline-primary" disabled={!!exporting || loading || !!error} onClick={() => exportResults('csv')}>Export CSV</button><button className="btn btn-primary" disabled={!!exporting || loading || !!error} onClick={() => exportResults('excel')}><Download size={16} />{exporting ? 'Exporting…' : 'Download Excel'}</button></>} />
    {error && <CollegeError message={error} retry={reload} />}
    <div className="ca-metric-grid"><CollegeMetric icon={GraduationCap} label="Students" note="College membership" value={loading ? null : a.totalStudents} /><CollegeMetric icon={Activity} label="Evaluated attempts" note="Submitted assessments" value={loading ? null : a.totalAttempts} tone="blue" /><CollegeMetric icon={TrendingUp} label="Pass rate" note="Assessment outcomes" value={loading ? null : `${Math.round(a.passPercentage || 0)}%`} tone="amber" /><CollegeMetric icon={BarChart3} label="Average score" note="Across evaluated results" value={loading ? null : `${Math.round(a.averagePercentage || 0)}%`} tone="violet" /></div>
    <div className="ca-chart-grid"><CollegePanel title="Participation at a glance" description="People, assessments and completed attempts.">{loading ? <CollegeLoading /> : <div className="ca-chart" role="img" aria-label={participation.map(item => `${item.name}: ${item.total}`).join(', ')}><ResponsiveContainer width="100%" height={300}><BarChart data={participation} margin={{ top: 15, right: 10, bottom: 0, left: -20 }}><CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--app-border)" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 12 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 12 }} /><Tooltip contentStyle={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: 12 }} cursor={{ fill: 'var(--app-subtle)' }} /><Bar dataKey="total" name="Total" fill="#168b78" radius={[8, 8, 0, 0]} maxBarSize={55} /></BarChart></ResponsiveContainer></div>}</CollegePanel><CollegePanel title="Assessment outcomes" description="A clear view of where students stand.">{loading ? <CollegeLoading /> : !a.totalAttempts ? <div className="ca-empty"><BarChart3 size={30} /><h3>Ready for your first result</h3><p>Outcomes will appear after assessments are submitted.</p></div> : <><div className="ca-donut" role="img" aria-label={`Passed: ${a.passCount || 0}, failed: ${a.failCount || 0}`}><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={outcomes} dataKey="value" innerRadius={65} outerRadius={95} paddingAngle={4} stroke="none">{outcomes.map((item, index) => <Cell key={item.name} fill={index ? '#e4ab69' : '#168b78'} />)}</Pie><Tooltip contentStyle={{ background: 'var(--app-surface)', borderRadius: 12, border: '1px solid var(--app-border)' }} /></PieChart></ResponsiveContainer></div><div className="ca-chart-legend">{outcomes.map((item, index) => <div key={item.name}><span style={{ background: index ? '#e4ab69' : '#168b78' }} /><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></>}</CollegePanel></div>
    <div className="ca-note"><Activity size={18} /><p>{platform ? 'Figures follow the current reporting scope shown above.' : 'These figures use evaluated results from your active college.'} Exports include the result records you have permission to access.</p></div>
  </div>;
}
