import React, { forwardRef } from 'react';

const Select = forwardRef(function Select(
  {
    label,
    options = [],
    error,
    helperText,
    id,
    placeholder = 'Select an option',
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={`block w-full rounded-lg text-sm bg-white border py-2.5 px-3.5 pr-8 appearance-none transition-colors
            ${
              error
                ? 'border-red-400 text-red-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500'
                : 'border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy'
            }
            disabled:bg-neutral-50 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
          </svg>
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
