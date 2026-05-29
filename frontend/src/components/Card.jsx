import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = true,
  title,
  action,
  ...props 
}) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-card ${hover ? 'hover:shadow-soft transition-shadow duration-300' : ''} ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100">
          {title && <h3 className="text-lg font-semibold text-secondary-800">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  );
};

export default Card;
