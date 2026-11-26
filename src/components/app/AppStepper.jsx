/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppStepper: Design System Multi-Step Progress Wrapper
 * Wraps React Bits Stepper with theme tokens and animated spring indicators.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import Stepper, { Step } from '../ui/Stepper/Stepper';

export { Step };

export default function AppStepper({
  steps = [],
  activeStep = 0,
  onStepChange,
  className = '',
  children,
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`w-full ${className}`}>
      <Stepper
        steps={steps}
        activeStep={activeStep}
        onStepChange={onStepChange}
        theme={isDark ? 'dark' : 'light'}
        className="w-full"
        {...props}
      >
        {children}
      </Stepper>
    </div>
  );
}
