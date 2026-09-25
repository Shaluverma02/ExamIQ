import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Trash2, Save, FormInput, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';

const FORM_TYPES = [
  { id: 'student_registration', name: 'Student Registration Form' },
  { id: 'course_registration', name: 'Course Registration Form' },
  { id: 'college_registration', name: 'College Registration Form' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown / Select' },
  { value: 'textarea', label: 'Multi-line Textarea' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date Picker' },
];

const DynamicFormBuilder = () => {
  const [selectedFormType, setSelectedFormType] = useState('student_registration');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFormSchema(selectedFormType);
  }, [selectedFormType]);

  const fetchFormSchema = async (formType) => {
    try {
      setLoading(true);
      const res = await API.get(`/admin/forms/${formType}`);
      if (res.data.schema && res.data.schema.title) {
        setTitle(res.data.schema.title);
        setDescription(res.data.schema.description || '');
        setFields(res.data.schema.fields || []);
      } else {
        const defaultTitle = FORM_TYPES.find((f) => f.id === formType)?.name || 'Custom Form';
        setTitle(defaultTitle);
        setDescription('Dynamically generated field schema');
        setFields([]);
      }
    } catch (err) {
      toast.error('Failed to load form schema');
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    const newFieldId = `field_${Date.now()}`;
    setFields([
      ...fields,
      {
        fieldId: newFieldId,
        label: 'New Field',
        fieldType: 'text',
        required: false,
        options: [],
        placeholder: '',
        order: fields.length,
      },
    ]);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const handleFieldChange = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleOptionChange = (fieldIdx, optionsStr) => {
    const opts = optionsStr.split(',').map((s) => s.trim()).filter(Boolean);
    const updated = [...fields];
    updated[fieldIdx].options = opts;
    setFields(updated);
  };

  const handleMoveField = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    )
      return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFields(updated);
  };

  const handleSaveSchema = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('Form title is required');
      return;
    }

    try {
      setSaving(true);
      const res = await API.post('/admin/forms', {
        formType: selectedFormType,
        title,
        description,
        fields,
      });

      toast.success(res.data.message || 'Form schema saved successfully!');
    } catch (err) {
      toast.error('Failed to save form schema');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-4 rounded-3 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-body m-0 d-flex align-items-center gap-2">
            <FormInput size={24} className="text-primary" /> Dynamic Form Generator
          </h4>
          <p className="text-muted small m-0">
            Create, edit, and append custom dynamic fields to platform registration workflows
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select bg-body-tertiary text-body border fw-semibold"
            value={selectedFormType}
            onChange={(e) => setSelectedFormType(e.target.value)}
          >
            {FORM_TYPES.map((ft) => (
              <option key={ft.id} value={ft.id}>
                {ft.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-success btn-sm fw-bold px-4 d-flex align-items-center gap-1 rounded-pill"
            onClick={handleSaveSchema}
            disabled={saving}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Form Schema'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Loading form schema configuration...</div>
      ) : (
        <div>
          {/* Metadata Controls */}
          <div className="row g-3 mb-4 p-3 rounded-3 bg-body-tertiary border">
            <div className="col-12 col-md-6">
              <label className="form-label small text-muted fw-bold">Form Title *</label>
              <input
                type="text"
                className="form-control bg-secondary text-body border-0"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small text-muted fw-bold">Form Description</label>
              <input
                type="text"
                className="form-control bg-secondary text-body border-0"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Fields List */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-body m-0 d-flex align-items-center gap-2">
              <Settings2 size={18} className="text-info" /> Custom Dynamic Fields ({fields.length})
            </h6>
            <button
              className="btn btn-outline-primary btn-sm fw-bold rounded-pill px-3 d-flex align-items-center gap-1"
              onClick={handleAddField}
            >
              <Plus size={16} /> Add Custom Field
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-4 bg-body-tertiary text-muted rounded-3 border">
              No custom fields added yet. Click "+ Add Custom Field" to construct dynamic form elements.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {fields.map((field, idx) => (
                <div key={field.fieldId || idx} className="p-3 rounded-3 bg-body-tertiary border">
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-3">
                      <label className="form-label small text-muted mb-1">Field Label *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-secondary text-body border-0"
                        value={field.label}
                        onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                        placeholder="e.g. Guardian Phone"
                      />
                    </div>

                    <div className="col-12 col-md-2">
                      <label className="form-label small text-muted mb-1">Input Type</label>
                      <select
                        className="form-select form-select-sm bg-secondary text-body border-0"
                        value={field.fieldType}
                        onChange={(e) => handleFieldChange(idx, 'fieldType', e.target.value)}
                      >
                        {FIELD_TYPES.map((ft) => (
                          <option key={ft.value} value={ft.value}>
                            {ft.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label small text-muted mb-1">Placeholder</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-secondary text-body border-0"
                        value={field.placeholder || ''}
                        onChange={(e) => handleFieldChange(idx, 'placeholder', e.target.value)}
                        placeholder="e.g. Enter details..."
                      />
                    </div>

                    {field.fieldType === 'select' && (
                      <div className="col-12 col-md-2">
                        <label className="form-label small text-muted mb-1">Options (comma-sep)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm bg-secondary text-body border-0"
                          value={(field.options || []).join(', ')}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder="Opt1, Opt2, Opt3"
                        />
                      </div>
                    )}

                    <div className="col-6 col-md-1 text-center">
                      <label className="form-label small text-muted mb-1 d-block">Required</label>
                      <input
                        type="checkbox"
                        className="form-check-input bg-secondary border-0"
                        checked={field.required}
                        onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                      />
                    </div>

                    <div className="col-6 col-md-1 d-flex gap-1 justify-content-end align-items-center pt-3 pt-md-0">
                      <button
                        className="btn btn-outline-secondary btn-sm p-1 text-body border-0"
                        onClick={() => handleMoveField(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm p-1 text-body border-0"
                        onClick={() => handleMoveField(idx, 'down')}
                        disabled={idx === fields.length - 1}
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm p-1 border-0 ms-1"
                        onClick={() => handleRemoveField(idx)}
                        title="Delete Field"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicFormBuilder;