/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppButton: Design System Button Wrapper
 * Enforces DESIGN_SPEC v2 tokens:
 * - Variants: primary (wine solid + ClickSpark), secondary (surface + border line, text ink), ghost, danger
 * - Heights: sm (32px), md (40px), lg (48px); touch target min 44px on mobile
 * - Focus ring: 2px primary with 2px offset in both themes
 * - ClickSpark animation active exclusively on primary variant
 */

import React, { forwardRef } from 'react';
import ClickSpark from '../ui/ClickSpark/ClickSpark';
import Spinner from '../common/Spinner';

const AppButton = forwardRef(function AppButton(
  {
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    isLoading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    spark = true,
    className = '',
    onClick,
    ...props
  },
  ref
) {
  const isPending = loading || isLoading;
  const isDisabled = disabled || isPending;

  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-[12px] transition-all select-none ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] ' +
    'min-h-[44px] sm:min-h-0'; // Ensure >=44px touch target on mobile

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-base px-5 py-2.5 h-12 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-hover shadow-xs border border-transparent font-semibold',
    secondary:
      'bg-surface border border-line text-ink hover:bg-surface-2 hover:border-line shadow-xs',
    ghost:
      'bg-transparent text-muted hover:text-ink hover:bg-surface-2 border border-transparent',
    danger:
      'bg-danger text-white hover:opacity-90 shadow-xs border border-transparent font-semibold',
  };

  const buttonElement = (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {isPending ? (
        <>
          <Spinner size="sm" className="shrink-0" />
          <span>{typeof children === 'string' ? children : 'Loading...'}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
          {children}
          {IconRight && <IconRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </>
      )}
    </button>
  );

  // Apply ClickSpark animation strictly to primary variant
  if (variant === 'primary' && spark && !isDisabled) {
    return (
      <ClickSpark
        sparkColor="rgba(255, 255, 255, 0.75)"
        sparkCount={8}
        sparkRadius={24}
        sparkSize={10}
        duration={360}
      >
        {buttonElement}
      </ClickSpark>
    );
  }

  return buttonElement;
});

export default AppButton;
