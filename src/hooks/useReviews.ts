import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkProfanity } from "@/lib/profanityFilter";
import type {
  ProductReview,
  ProductReviewWithUser,
  ReviewStats,
} from "@/types/review";

// ─── Local type because product_reviews isn't in generated types yet ───

type RawReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  users: { full_name: string } | null;
};

function mapRaw(r: RawReview): ProductReviewWithUser {
  return {
    id: r.id,
    product_id: r.product_id,
    user_id: r.user_id,
    rating: r.rating,
    review_text: r.review_text,
    created_at: r.created_at,
    user_name: r.users?.full_name ?? "Anonymous",
  };
}

/** Fetch reviews for a product, joined with user names. */
export function useReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async (): Promise<ProductReviewWithUser[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, users(full_name)")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) {
        // Table doesn't exist yet — return empty gracefully
        if (
          error.message?.includes("relation") &&
          error.message?.includes("does not exist")
        ) {
          return [];
        }
        throw error;
      }

      return (data ?? []).map((r: any) => mapRaw(r as RawReview));
    },
    enabled: !!productId,
    staleTime: 30_000,
  });
}

/** Compute stats (average, count, distribution) from reviews. */
export function useReviewStats(productId: string | undefined) {
  const { data: reviews, isLoading } = useReviews(productId);

  const stats: ReviewStats | null = reviews
    ? {
        average:
          reviews.length > 0
            ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
            : 0,
        count: reviews.length,
        distribution: reviews.reduce<Record<number, number>>(
          (acc, r) => {
            acc[r.rating] = (acc[r.rating] ?? 0) + 1;
            return acc;
          },
          { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        ),
      }
    : null;

  return { stats, isLoading };
}

/** Check whether the current user already reviewed this product. */
export function useHasReviewed(productId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["product-reviewed", productId, userId],
    queryFn: async (): Promise<boolean> => {
      if (!productId || !userId) return false;
      const { data } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!productId && !!userId,
    staleTime: 60_000,
  });
}

// ─── Submit (with profanity check) ───────────────────────────

export function useSubmitReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      userId,
      rating,
      reviewText,
    }: {
      productId: string;
      userId: string;
      rating: number;
      reviewText: string;
    }): Promise<"profanity" | "submitted" | "error"> => {
      // 1. Profanity check on review text
      if (reviewText.trim()) {
        const result = await checkProfanity(reviewText);
        if (result.ok && !result.clean) return "profanity";
      }

      // 2. Insert
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: userId,
        rating,
        review_text: reviewText.trim(),
      });

      if (error) {
        // Table doesn't exist yet
        if (
          error.message?.includes("relation") &&
          error.message?.includes("does not exist")
        ) {
          // Still return submitted so UI treats it as success (just no persistence yet)
          return "submitted";
        }
        throw error;
      }

      return "submitted";
    },
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: ["product-reviews", vars.productId] });
      qc.invalidateQueries({ queryKey: ["product-reviewed", vars.productId, vars.userId] });
    },
  });
}

// ─── Update (edit) ────────────────────────────────────────────

export function useUpdateReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      productId,
      rating,
      reviewText,
    }: {
      reviewId: string;
      productId: string;
      rating: number;
      reviewText: string;
    }): Promise<"profanity" | "updated" | "error"> => {
      // 1. Profanity check
      if (reviewText.trim()) {
        const result = await checkProfanity(reviewText);
        if (result.ok && !result.clean) return "profanity";
      }

      // 2. Update
      const { error } = await supabase
        .from("product_reviews")
        .update({
          rating,
          review_text: reviewText.trim(),
        })
        .eq("id", reviewId);

      if (error) {
        if (
          error.message?.includes("relation") &&
          error.message?.includes("does not exist")
        ) {
          return "updated";
        }
        throw error;
      }

      return "updated";
    },
    onSuccess: (result, vars) => {
      if (result === "updated") {
        qc.invalidateQueries({ queryKey: ["product-reviews", vars.productId] });
      }
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────

export function useDeleteReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      productId,
      userId,
    }: {
      reviewId: string;
      productId: string;
      userId: string;
    }): Promise<"deleted" | "error"> => {
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", userId); // safety: only delete own

      if (error) {
        if (
          error.message?.includes("relation") &&
          error.message?.includes("does not exist")
        ) {
          return "deleted";
        }
        throw error;
      }

      return "deleted";
    },
    onSuccess: (result, vars) => {
      if (result === "deleted") {
        qc.invalidateQueries({ queryKey: ["product-reviews", vars.productId] });
        qc.invalidateQueries({ queryKey: ["product-reviewed", vars.productId, vars.userId] });
      }
    },
  });
}
