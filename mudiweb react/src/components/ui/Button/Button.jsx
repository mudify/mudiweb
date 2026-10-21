import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'text' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon = null,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  id,
  ariaLabel
}) {
  return (
    <button
      id={id}
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      <span className="btn__text">{children}</span>
    </button>
  );
}
