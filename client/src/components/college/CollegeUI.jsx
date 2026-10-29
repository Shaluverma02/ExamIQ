import React from 'react';
import { RefreshCw } from 'lucide-react';

export function CollegeMetric({ icon: Icon, label, value, note, tone = 'teal' }) {
  return <article className={`ca-metric ca-tone-${tone}`}><div className="ca-metric-top"><span className="ca-icon"><Icon size={21} strokeWidth={1.7} /></span><span className="ca-metric-caption">{note}</span></div><strong className="ca-metric-value">{value ?? '—'}</strong><span className="ca-metric-label">{label}</span></article>;
}

export function CollegeLoading() {
  return <div className="ca-loading" role="status"><span className="spinner-border spinner-border-sm" /><span>Loading your college workspace…</span></div>;
}

export function CollegeError({ message, retry }) {
  return <div className="ca-error" role="alert"><span>{message}</span><button className="btn btn-outline-secondary btn-sm" onClick={retry}><RefreshCw size={14} /> Try again</button></div>;
}

export function CollegePanel({ title, description, action, children, className = '' }) {
  return <section className={`ca-panel ${className}`}><div className="ca-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>{children}</section>;
}

