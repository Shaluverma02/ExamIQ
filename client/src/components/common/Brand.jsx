import React from 'react';
import { Layers } from 'lucide-react';

const Brand = ({ compact = false, className = '' }) => (
  <span className={`app-brand ${className}`}>
    <span className="brand-mark" aria-hidden="true"><Layers size={23} strokeWidth={2.2} /></span>
    {!compact && <span className="brand-wordmark">Exam<span>iQ</span><span className="brand-dot">.</span></span>}
  </span>
);

export default Brand;
