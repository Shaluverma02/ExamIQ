import React, { useEffect, useState } from 'react';
import API from '../services/api';

const DynamicFormRenderer = ({ formType, values = {}, onChange }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchema = async () => {
      if (!formType) return;
      try {
        setLoading(true);
        const res = await API.get(`/admin/forms/public/${formType}`);
        if (res.data.schema && res.data.schema.fields) {
          setFields(res.data.schema.fields);
        }
      } catch (e) {
        console.error('Failed to load dynamic form fields:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, [formType]);

  if (loading || fields.length === 0) return null;

  return (
    <div className="dynamic-form-fields-wrapper mt-3 pt-3 border-top border-secondary">
      <div className="text-uppercase text-muted fw-bold mb-3 small" style={{ letterSpacing: '0.8px' }}>
        Additional Custom Fields
      </div>
      <div className="row g-3">
        {fields.map((f) => {
          const val = values[f.fieldId] !== undefined ? values[f.fieldId] : '';
          const isFullWidth = f.fieldType === 'textarea';

          return (
            <div key={f.fieldId} className={isFullWidth ? "col-12" : "col-12 col-md-6"}>
              <label className="form-label small text-muted fw-semibold">
                {f.label} {f.required && <span className="text-danger">*</span>}
              </label>

              {f.fieldType === 'select' ? (
                <select
                  className="form-select bg-secondary text-light border-0"
                  value={val}
                  required={f.required}
                  onChange={(e) => onChange(f.fieldId, e.target.value)}
                >
                  <option value="">Select {f.label}</option>
                  {(f.options || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : f.fieldType === 'textarea' ? (
                <textarea
                  className="form-control bg-secondary text-light border-0"
                  rows={2}
                  value={val}
                  placeholder={f.placeholder}
                  required={f.required}
                  onChange={(e) => onChange(f.fieldId, e.target.value)}
                />
              ) : f.fieldType === 'checkbox' ? (
                <div className="form-check pt-2">
                  <input
                    type="checkbox"
                    className="form-check-input bg-secondary border-0"
                    id={f.fieldId}
                    checked={!!val}
                    onChange={(e) => onChange(f.fieldId, e.target.checked)}
                  />
                  <label className="form-check-label text-light small ms-1" htmlFor={f.fieldId}>
                    {f.label}
                  </label>
                </div>
              ) : (
                <input
                  type={f.fieldType || 'text'}
                  className="form-control bg-secondary text-light border-0"
                  value={val}
                  placeholder={f.placeholder}
                  required={f.required}
                  onChange={(e) => onChange(f.fieldId, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicFormRenderer;