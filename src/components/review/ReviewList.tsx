import { useState } from "react";
import { Star, MessageSquare, Pencil, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useReviews, useReviewStats, useDeleteReview } from "@/hooks/useReviews";
import ReviewForm from "@/components/review/ReviewForm";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReviewListProps {
  productId: string;
  /** Logged-in user id — own reviews get edit/delete buttons */
  userId?: string;
}

const ReviewList = ({ productId, userId }: ReviewListProps) => {
  const { data: reviews, isLoading: reviewsLoading } = useReviews(productId);
  const { toast } = useToast();
  const deleteMutation = useDeleteReview();

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const { stats, isLoading: statsLoading } = useReviewStats(productId);

  if (reviewsLoading || statsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!stats || stats.count === 0) {
    return null; // handled by parent empty state
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="flex items-start gap-6 p-4 rounded-lg bg-muted/50">
        <div className="text-center shrink-0">
          <span className="text-4xl font-bold text-foreground">
            {stats.average.toFixed(1)}
          </span>
          <div className="flex items-center gap-0.5 mt-1 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-3.5 w-3.5",
                  star <= Math.round(stats.average)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.count} review{stats.count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const pct =
              stats.count > 0
                ? ((stats.distribution[star] ?? 0) / stats.count) * 100
                : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right text-muted-foreground shrink-0">
                  {star}
                </span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-muted-foreground/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">
                  {stats.distribution[star] ?? 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4 divide-y divide-border">
        {reviews?.map((review) => {
          const date = new Date(review.created_at);
          const formatted = date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          const isOwnReview = review.user_id === userId;
          const isEditingThis = editingReviewId === review.id;

          if (isEditingThis) {
            return (
              <div key={review.id} className="pt-4 first:pt-0">
                <ReviewForm
                  productId={productId}
                  userId={userId!}
                  reviewId={review.id}
                  initialRating={review.rating}
                  initialText={review.review_text}
                  onSubmitted={() => setEditingReviewId(null)}
                  onCancel={() => setEditingReviewId(null)}
                />
              </div>
            );
          }

          return (
            <div key={review.id} className="pt-4 first:pt-0 group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {review.user_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatted}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Star rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3 w-3",
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/20",
                        )}
                      />
                    ))}
                  </div>

                  {/* Edit/delete (own review only) */}
                  {isOwnReview && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingReviewId(review.id)}
                        title="Edit review"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletingReviewId(review.id)}
                        title="Delete review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {review.review_text && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.review_text}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingReviewId}
        onOpenChange={(open) => !open && setDeletingReviewId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your review will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              onClick={async () => {
                if (!deletingReviewId) return;
                const res = await deleteMutation.mutateAsync({
                  reviewId: deletingReviewId,
                  productId,
                  userId: userId!,
                });
                setDeletingReviewId(null);
                if (res === "deleted") {
                  toast({ title: "Review deleted", description: "Your review has been removed." });
                }
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewList;

/** Empty-state component shown when there are no reviews yet */
export const ReviewEmptyState = () => (
  <div className="text-center py-8 space-y-2">
    <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto" />
    <p className="text-sm font-medium text-foreground">No reviews yet</p>
    <p className="text-xs text-muted-foreground">
      Be the first to share your thoughts on this product.
    </p>
  </div>
);
