import { useState } from "react";
import { Star, Loader2, Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSubmitReview, useUpdateReview } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

const STAR_LABELS = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

interface ReviewFormProps {
  productId: string;
  userId: string;
  /** Called after a successful (non-profanity-blocked) submission */
  onSubmitted?: () => void;
  /** Edit mode — pre-fill with existing review data */
  reviewId?: string;
  initialRating?: number;
  initialText?: string;
  onCancel?: () => void;
}

const ReviewForm = ({ productId, userId, onSubmitted, reviewId, initialRating, initialText, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState(initialText ?? "");
  const { toast } = useToast();
  const isEditing = !!reviewId;
  const submit = useSubmitReview();
  const update = useUpdateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Select a rating",
        description: "Please give a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    const result = isEditing
      ? await update.mutateAsync({
          reviewId,
          productId,
          rating,
          reviewText,
        })
      : await submit.mutateAsync({
          productId,
          userId,
          rating,
          reviewText,
        });

    if (result === "profanity") {
      toast({
        title: "Inappropriate language detected",
        description:
          "Please remove any offensive language from your review. This helps keep our community respectful.",
        variant: "destructive",
      });
      return;
    }

    if (result === "error") {
      toast({
        title: "Something went wrong",
        description: "Could not submit your review. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Success
    toast({
      title: isEditing ? "Review updated" : "Review submitted",
      description: isEditing
        ? "Your review has been updated."
        : "Thank you for your feedback!",
    });
    if (!isEditing) {
      setRating(0);
      setReviewText("");
    }
    onSubmitted?.();
  };

  const handleCancelEdit = () => {
    setRating(initialRating ?? 0);
    setReviewText(initialText ?? "");
    onCancel?.();
  };

  const busy = isEditing ? update.isPending : submit.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Stars */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Your Rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= (hoveredStar || rating);
            return (
              <button
                key={star}
                type="button"
                disabled={busy}
                className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    filled
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30",
                  )}
                />
              </button>
            );
          })}
          {(hoveredStar || rating) > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              {STAR_LABELS[(hoveredStar || rating) - 1]}
            </span>
          )}
        </div>
      </div>

      {/* Review text */}
      <div className="space-y-2">
        <label htmlFor="review-text" className="text-sm font-medium text-foreground">
          Your Review
        </label>
        <Textarea
          id="review-text"
          placeholder="Share your experience with this product…"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={3}
          disabled={busy}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {reviewText.length}/2000
        </p>
      </div>

      {/* Profanity notice */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Flag className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <p>
          Reviews are automatically checked for inappropriate language.
          Offensive content will be blocked.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
            disabled={busy}
            className="gap-1.5"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}

        <Button type="submit" disabled={busy || rating === 0} className="gap-2">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditing ? "Updating…" : "Submitting…"}
            </>
          ) : isEditing ? (
            "Update Review"
          ) : (
            "Submit Review"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
