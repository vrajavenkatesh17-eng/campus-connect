import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    rightElement,
    id,
    type = 'text',
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`block w-full rounded-lg text-sm bg-white border transition-colors
            ${Icon ? 'pl-9' : 'pl-3.5'}
            ${rightElement ? 'pr-10' : 'pr-3.5'}
            py-2.5
            ${
              error
                ? 'border-red-400 text-red-900 placeholder-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500'
                : 'border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy'
            }
            disabled:bg-neutral-50 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
