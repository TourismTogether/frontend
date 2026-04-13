"use client";

import { useState, useEffect } from "react";
import { X, Star, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/toast";
import { API_ENDPOINTS } from "@/constants/api";

interface Review {
  traveller_id: string;
  destination_id: string;
  no: number;
  rating_star: number;
  comment?: string | null;
  created_at?: string;
}

interface Props {
  destinationId: string;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "create" | "edit";
  initialData?: Review;
}

const ratingLabels: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

export default function CreateReviewModal({
  destinationId,
  onClose,
  onSuccess,
  mode = "create",
  initialData,
}: Props) {
  const { user } = useAuth();

  const [rating, setRating] = useState(initialData?.rating_star ?? 5);
  const [comment, setComment] = useState(initialData?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setRating(initialData.rating_star);
      setComment(initialData.comment ?? "");
    }
  }, [initialData]);

  const submitReview = async () => {
    if (!user?.id) {
      toast.warning("Sign in required", "Please sign in to leave a review.");
      return;
    }

    if (!rating) {
      toast.warning("Rating required", "Please select a star rating.");
      return;
    }

    if (
      mode === "edit" &&
      (initialData?.no == null || initialData.no === undefined)
    ) {
      toast.error("Cannot edit review", "Missing review reference. Please try again.");
      return;
    }

    setLoading(true);

    const body: any = {
      traveller_id: user.id,
      destination_id: destinationId,
      rating_star: rating,
      comment: comment.trim() || null,
    };

    if (mode === "edit" && initialData?.no != null) {
      body.no = initialData.no;
    }

    try {
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(API_ENDPOINTS.REVIEWS.CREATE, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.message || "Something went wrong");
      }

      if (mode === "create") {
        setRating(5);
        setComment("");
      }

      toast.success(mode === "create" ? "Review submitted" : "Review updated", "Thank you for your feedback!");
      onSuccess();
    } catch (err: unknown) {
      console.error("submitReview error:", err);
      toast.error("Failed to save review", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white" id="review-modal-title">
            {mode === "create" ? "Rate this place" : "Edit your review"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={loading}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3" id="rating-label">
              Your rating
            </label>
            <div className="flex flex-col items-center space-y-3">
              <div
                className="flex gap-2"
                onMouseLeave={() => setHoveredRating(null)}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHoveredRating(i)}
                    disabled={loading}
                    aria-label={`${i} star${i > 1 ? "s" : ""}`}
                    aria-pressed={rating === i}
                    className="transition-all duration-200 transform hover:scale-125 focus:outline-none disabled:opacity-50"
                  >
                    <Star
                      className={`w-10 h-10 transition-all duration-200 ${
                        i <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-300 dark:fill-gray-600 dark:text-gray-500"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {ratingLabels[displayRating as keyof typeof ratingLabels]}
              </p>
            </div>
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3" htmlFor="review-comment">
              Share your experience{" "}
              <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              id="review-comment"
              aria-describedby="review-comment-hint"
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all dark:bg-gray-700 dark:text-white"
              rows={5}
              placeholder="Write a detailed review about this place..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <p id="review-comment-hint" className="text-xs text-gray-500 dark:text-gray-400">
                Help others learn more about this place
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {comment.length}/500
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submitReview}
            disabled={loading || !rating}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                <span>{mode === "create" ? "Submitting..." : "Updating..."}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" aria-hidden />
                <span>
                  {mode === "create" ? "Submit review" : "Update review"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
