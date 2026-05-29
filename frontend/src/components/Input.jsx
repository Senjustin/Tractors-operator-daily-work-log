import React from 'react';

const Input = ({ 
  label, 
  error, 
  className = '',
  readOnly,
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <input
        className={`input-field ${readOnly ? 'bg-secondary-50 cursor-not-allowed' : ''} ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        readOnly={readOnly}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
