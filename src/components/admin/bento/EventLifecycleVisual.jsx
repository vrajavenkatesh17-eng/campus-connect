/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6B: Event Lifecycle Steps Visual
 */

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon, Clock01Icon, AlertCircleIcon, SparklesIcon } from '@hugeicons/core-free-icons';

export default function EventLifecycleVisual({ data = {} }) {
  const lifecycle = {
    pending: Number(data.pending) || 0,
    approved: Number(data.approved) || 0,
    ongoing: Number(data.ongoing) || 0,
    completed: Number(data.completed) || 0,
  };

  const totalEvents = lifecycle.pending + lifecycle.approved + lifecycle.ongoing + lifecycle.completed;

  const steps = [
    {
      id: 'pending',
      label: 'Pending Review',
      count: lifecycle.pending,
      icon: AlertCircleIcon,
      statusClass: 'bg-amber-100 text-amber-700 border-amber-300',
      active: lifecycle.pending > 0,
    },
    {
      id: 'approved',
      label: 'Approved & Scheduled',
      count: lifecycle.approved,
      icon: Clock01Icon,
      statusClass: 'bg-blue-100 text-blue-700 border-blue-300',
      active: lifecycle.approved > 0,
    },
    {
      id: 'ongoing',
      label: 'Ongoing Sessions',
      count: lifecycle.ongoing,
      icon: SparklesIcon,
      statusClass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      active: lifecycle.ongoing > 0,
    },
    {
      id: 'completed',
      label: 'Completed & Closed',
      count: lifecycle.completed,
      icon: Tick02Icon,
      statusClass: 'bg-primary/15 text-primary border-burgundy/30',
      active: lifecycle.completed > 0,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="magic-bento__figure flex items-baseline justify-between mb-1">
        <span className="magic-bento__figure-value text-xl font-bold text-ink tracking-tight">
          {totalEvents} Events
        </span>
        <span className="magic-bento__figure-note text-xs font-medium text-muted">
          Lifecycle Pipeline
        </span>
      </div>

      <ol className="magic-bento__steps" style={{ '--n': steps.length }}>
        <div className="magic-bento__rail">
          <div className="magic-bento__rail-fill" style={{ transform: 'scaleY(1)' }} />
        </div>

        {steps.map((step, index) => {
          const IconComp = step.icon;
          return (
            <li key={step.id} className="magic-bento__step" style={{ '--i': index }}>
              <span className="magic-bento__status">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-xs ${step.statusClass}`}>
                  <HugeiconsIcon icon={IconComp} size={10} strokeWidth={2.5} />
                </span>
              </span>
              <span className="font-medium text-xs text-ink truncate">
                {step.label}
              </span>
              <span className="magic-bento__step-time font-bold text-xs text-ink">
                {step.count}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
