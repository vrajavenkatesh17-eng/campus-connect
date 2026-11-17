import React, { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    id,
    rows = 4,
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const textareaId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          className={`block w-full rounded-lg text-sm bg-white border transition-colors py-2.5 px-3.5
            ${
              error
                ? 'border-red-400 text-red-900 placeholder-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500'
                : 'border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy'
            }
            disabled:bg-neutral-50 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
