import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline-primary' etc.
  size = 'md',        // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon: Icon = null,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Map custom variants to clean Bootstrap 5 button classes
  const getBootstrapVariant = (v) => {
    switch (v) {
      case 'primary': return 'btn-primary';
      case 'secondary': return 'btn-secondary';
      case 'success': return 'btn-success';
      case 'danger': return 'btn-danger';
      case 'warning': return 'btn-warning';
      case 'info': return 'btn-info';
      case 'ghost': return 'btn-link text-decoration-none';
      case 'outline-primary': return 'btn-outline-primary';
      case 'outline-secondary': return 'btn-outline-secondary';
      default: return `btn-${v}`;
    }
  };

  // Size mapping using Bootstrap standard spacing classes
  const sizeClass =
    size === 'sm' ? 'btn-sm px-3 py-1 fs-7' :
      size === 'lg' ? 'btn-lg px-4 py-2 fs-5' :
        'px-3 py-2';

  const variantClass = getBootstrapVariant(variant);

  return (
    <button
      type={type}
      className={`btn d-inline-flex align-items-center justify-content-center gap-2 fw-semibold transition-all ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <Loader2
            size={size === 'sm' ? 14 : 18}
            className="spinner-border spinner-border-sm me-1 flex-shrink-0"
            role="status"
            aria-hidden="true"
          />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 18} className="flex-shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;