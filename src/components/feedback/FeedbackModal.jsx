/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * FeedbackModal: Conforms strictly to DESIGN_SPEC v2 Section 4:
 * Uses Peek Rating (AppRating) and Squish Switch (AppSwitch) for anonymous review.
 */

import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Textarea from '../common/Textarea';
import AppRating from '../app/AppRating';
import AppSwitch from '../app/AppSwitch';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose, event, onSuccess }) {
  const { showToast } = useToast();
  const [ratingContent, setRatingContent] = useState(5);
  const [ratingSpeaker, setRatingSpeaker] = useState(5);
  const [ratingOrg, setRatingOrg] = useState(5);
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event?.id) return;

    setIsSubmitting(true);
    try {
      await attendanceService.submitFeedback({
        eventId: event.id,
        ratingContent,
        ratingSpeaker,
        ratingOrganization: ratingOrg,
        comments: comments.trim(),
        isAnonymous,
      });

      showToast('Thank you! Your feedback has been submitted successfully.', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Feedback submission error:', err);
      showToast(err.message || 'Failed to submit feedback.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Evaluation & Feedback"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl bg-surface-2 border border-line p-3.5 space-y-1">
          <p className="text-xs font-bold text-primary truncate">{event.title}</p>
          <p className="text-xs text-muted">
            {event.speaker_name ? `Keynote Speaker: ${event.speaker_name}` : 'Francis Xavier Engineering College'}
          </p>
        </div>

        {/* 3 Rating Categories using AppRating (PeekRating) */}
        <div className="space-y-4 bg-surface-2/60 p-4 rounded-xl border border-line">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">1. Content Relevance & Technical Depth</span>
              <span className="text-xs font-mono font-bold text-primary">{ratingContent} / 5</span>
            </div>
            <p className="text-xs text-muted">Industry applicability and academic learning takeaways</p>
            <div className="pt-1">
              <AppRating
                value={ratingContent}
                onChange={setRatingContent}
                size={22}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-line/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">2. Keynote Speaker Delivery</span>
              <span className="text-xs font-mono font-bold text-primary">{ratingSpeaker} / 5</span>
            </div>
            <p className="text-xs text-muted">Clarity, engagement, and Q&A interaction effectiveness</p>
            <div className="pt-1">
              <AppRating
                value={ratingSpeaker}
                onChange={setRatingSpeaker}
                size={22}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-line/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">3. Overall Venue & Session Organization</span>
              <span className="text-xs font-mono font-bold text-primary">{ratingOrg} / 5</span>
            </div>
            <p className="text-xs text-muted">Punctuality, AV quality, and seat coordination</p>
            <div className="pt-1">
              <AppRating
                value={ratingOrg}
                onChange={setRatingOrg}
                size={22}
              />
            </div>
          </div>
        </div>

        {/* Written Review */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">
            Key Learning Takeaways or Improvement Notes (Optional)
          </label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share specific insights, topics you enjoyed most, or suggestions for future topics..."
            rows={3}
            className="text-xs"
          />
        </div>

        {/* Anonymous Privacy Toggle via AppSwitch (SquishSwitch) */}
        <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${isAnonymous ? 'text-success' : 'text-muted'}`} />
              <span className="text-xs font-semibold text-ink select-none">
                Submit Anonymously
              </span>
            </div>
            <AppSwitch
              checked={isAnonymous}
              onChange={setIsAnonymous}
            />
          </div>

          <p className="text-xs text-muted leading-relaxed">
            {isAnonymous ? (
              <span className="text-success font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Identity Protected: Your feedback will be saved completely decoupled from your profile.
              </span>
            ) : (
              'When off, your name will be verified by the coordinator for interactive recognition points.'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
          >
            Submit Feedback
          </Button>
        </div>
      </form>
    </Modal>
  );
}
