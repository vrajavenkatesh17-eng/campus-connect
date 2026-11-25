/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppSelect: Design System Select Wrapper
 * Wraps React Bits GlideSelect with form labels, errors, and theme tokens.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import GlideSelect from '../ui/GlideSelect/GlideSelect';

export default function AppSelect({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  children,
  placeholder = 'Select…',
  error,
  helperText,
  required = false,
  disabled = false,
  size = 'md',
  radius = 12,
  className = '',
  id,
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Support both options array and <option> children
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) return options;
    if (children) {
      const opts = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          opts.push({
            value: child.props.value ?? child.props.children,
            label: child.props.children || child.props.value,
          });
        }
      });
      return opts;
    }
    return [];
  }, [options, children]);

  const handleChange = (selectedVal) => {
    if (!onChange) return;
    // Provide both event-like shape (for (e) => e.target.value) and direct value
    const eventLike = {
      target: { value: selectedVal, name: props.name },
      currentTarget: { value: selectedVal, name: props.name },
      value: selectedVal,
    };
    onChange(eventLike, selectedVal);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-muted uppercase tracking-wider">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      <div className={`relative ${className}`}>
        <GlideSelect
          options={parsedOptions}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          placeholder={placeholder}
          size={size}
          radius={radius}
          surfaceColor={isDark ? '#161012' : '#FFFFFF'} // surface
          highlightColor={isDark ? '#1F1719' : '#F5EFEA'} // surface-2
          accentColor={isDark ? '#C95D78' : '#7A1230'} // primary
          textColor={isDark ? '#F6EFEA' : '#1C1417'} // ink
          disabled={disabled}
          ariaLabel={label || 'Select option'}
          {...props}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
    </div>
  );
}
