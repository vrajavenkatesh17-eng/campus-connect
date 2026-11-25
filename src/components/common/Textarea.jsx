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
          className="block text-sm font-medium text-ink mb-1.5"
        >
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-[12px] shadow-xs">
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          className={`block w-full rounded-[12px] text-sm bg-surface border transition-colors py-2.5 px-3.5
            ${
              error
                ? 'border-danger text-danger placeholder:text-danger/60 focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger'
                : 'border-line text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            }
            disabled:bg-surface-2 disabled:text-muted disabled:border-line/60 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
