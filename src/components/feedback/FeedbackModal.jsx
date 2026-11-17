import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Textarea from '../common/Textarea';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { Star, ShieldCheck, MessageSquare, CheckCircle2, Info } from 'lucide-react';

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

  // Star selector subcomponent
  const StarRating = ({ label, value, onChange, description }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-800">{label}</span>
        <span className="text-xs font-bold text-burgundy">{value} / 5</span>
      </div>
      {description && <p className="text-[11px] text-neutral-400">{description}</p>}
      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 rounded-md hover:bg-neutral-100 transition-transform active:scale-95"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= value
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-neutral-300 hover:text-amber-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Feedback"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg bg-burgundy/5 border border-burgundy/15 p-3 space-y-1">
          <p className="text-xs font-bold text-burgundy truncate">{event.title}</p>
          <p className="text-[11px] text-neutral-500">
            {event.speaker_name ? `Speaker: ${event.speaker_name}` : 'Francis Xavier Engineering College'}
          </p>
        </div>

        {/* 3 Rating Categories */}
        <div className="space-y-3.5 bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200">
          <StarRating
            label="1. Content Quality & Relevance"
            description="Topic depth, learning takeaways, and industrial applicability"
            value={ratingContent}
            onChange={setRatingContent}
          />

          <StarRating
            label="2. Speaker Delivery & Engagement"
            description="Clarity, presentation style, and Q&A responsiveness"
            value={ratingSpeaker}
            onChange={setRatingSpeaker}
          />

          <StarRating
            label="3. Session Organization & Venue"
            description="Audio/video clarity, punctuality, and hall arrangement"
            value={ratingOrg}
            onChange={setRatingOrg}
          />
        </div>

        {/* Written Comments */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
            <span>Comments & Constructive Suggestions</span>
          </label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share specific insights, topics you enjoyed most, or areas of improvement..."
            rows={3}
            className="text-xs"
          />
        </div>

        {/* Anonymous Privacy Toggle */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${isAnonymous ? 'text-emerald-600' : 'text-neutral-400'}`} />
              <label htmlFor="anon-toggle" className="text-xs font-semibold text-neutral-900 cursor-pointer">
                Submit Anonymously
              </label>
            </div>
            <input
              id="anon-toggle"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-burgundy focus:ring-burgundy border-neutral-300 cursor-pointer"
            />
          </div>

          <p className="text-[11px] text-neutral-500 leading-relaxed">
            {isAnonymous ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Identity Protected: Your feedback will be saved completely decoupled from your profile. Coordinators cannot see who wrote it.
              </span>
            ) : (
              'When off, your name will be visible to event organizers on the feedback review panel.'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
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
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  );
}
