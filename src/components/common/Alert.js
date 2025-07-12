// src/components/common/Alert.js
import React from 'react';
import PropTypes from 'prop-types';

const icons = {
  error: '⚠',
  success: '✅',
  info: 'ℹ️',
  warning: '⚠️'
};

const Alert = ({ children, type = 'error' }) => {
  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-icon">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
};

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['error', 'success', 'info', 'warning']),
};

export default Alert;
