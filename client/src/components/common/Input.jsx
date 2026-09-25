import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({
  label,
  type = 'text',
  required = false,
  error = '',
  success = '',
  placeholder = '',
  value,
  onChange,
  autoFocus = false,
  className = '',
  icon: Icon = null,
  ...props
}) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const feedbackId = `${inputId}-feedback`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`mb-3 app-input ${className}`}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="position-relative d-flex align-items-center">
        {Icon && (
          <span className="position-absolute start-0 ms-3 text-muted d-flex align-items-center pointer-events-none">
            <Icon size={16} aria-hidden="true" />
          </span>
        )}

        <input
          id={inputId}
          type={inputType}
          className={`form-control ${Icon ? 'ps-5' : ''} ${isPassword ? 'pe-5' : ''} ${error ? 'is-invalid' : success ? 'is-valid' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error || success ? feedbackId : undefined}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="btn btn-link text-muted position-absolute end-0 me-2 p-1 border-0 text-decoration-none shadow-none"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <div id={feedbackId} className="invalid-feedback d-block small mt-1">{error}</div>}
      {success && <div id={feedbackId} className="valid-feedback d-block small mt-1">{success}</div>}
    </div>
  );
};

export default Input;
