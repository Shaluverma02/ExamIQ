import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
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

  const sizeClass =
    size === 'sm' ? 'btn-sm px-3' :
      size === 'lg' ? 'btn-lg px-4' :
        'px-3 py-2';

  return (
    <button
      type={type}
      className={`btn app-button ${getBootstrapVariant(variant)} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" aria-hidden="true" />
          <span>{children || 'Processing...'}</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 18} aria-hidden="true" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
