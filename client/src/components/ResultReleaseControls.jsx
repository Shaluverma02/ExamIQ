import React from 'react';
const ResultReleaseControls = ({ mode = 'manual', delayHours = 24, onChange, idPrefix = 'result-release' }) => {
  const total = Math.max(0, Number(delayHours) || 0);
  const days = Math.floor(total / 24), hours = total % 24;
  return <section className="border rounded-3 p-3 mt-3">
    <h3 className="h6 fw-bold">Student result visibility</h3>
    <label className="form-label small" htmlFor={idPrefix + '-mode'}>Release results</label>
    <select id={idPrefix + '-mode'} className="form-select" value={mode} onChange={event => onChange({ resultReleaseMode: event.target.value })}>
      <option value="manual">Keep locked until faculty releases</option>
      <option value="delay">Automatically after days / hours</option>
      <option value="immediate">Show results immediately</option>
    </select>
    {mode === 'delay' && <div className="row g-2 mt-1">
      <div className="col-6"><label className="form-label small" htmlFor={idPrefix + '-days'}>Days</label><input id={idPrefix + '-days'} className="form-control" type="number" min="0" max="365" step="1" value={days} onChange={event => onChange({ resultReleaseDelayHours: Math.min(8760, Math.max(0, Math.floor(Number(event.target.value) || 0)) * 24 + hours) })} /></div>
      <div className="col-6"><label className="form-label small" htmlFor={idPrefix + '-hours'}>Hours</label><input id={idPrefix + '-hours'} className="form-control" type="number" min="0" max="23" step="1" value={hours} onChange={event => onChange({ resultReleaseDelayHours: Math.min(8760, days * 24 + Math.min(23, Math.max(0, Math.floor(Number(event.target.value) || 0)))) })} /></div>
    </div>}
    <p className="small text-muted mt-2 mb-0">{mode === 'delay' ? 'The delay starts when each student submits. Results unlock automatically when this time has passed.' : mode === 'manual' ? 'Students see “Locked for analysis”. You can release results later from Manage Exams.' : 'Students can view scores and analysis after submission.'}</p>
  </section>;
};
export default ResultReleaseControls;
