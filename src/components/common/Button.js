// src/components/common/Button.js
import React from 'react';

const Button = ({
  children = 'Button',
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  variant = 'outline', // 'primary', 'secondary', 'outline'
  size = 'normal',     // 'normal', 'large'
  className = '',
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };
  const sizeClasses = {
    normal: '',
    large: 'btn-large',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
};

export default Button;
