// "use client";

// import { useState } from "react";
// import { X, Star } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { IAssessDestination } from "@/lib/type/interface";

// interface Props {
//   destinationId: string;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function CreateReviewModal({
//   destinationId,
//   onClose,
//   onSuccess,
// }: Props) {
//   const { user } = useAuth();
//   const [rating, setRating] = useState(5);
//   const [comment, setComment] = useState("");
//   const [loading, setLoading] = useState(false);

//   const submitReview = async () => {
//     if (!user?.id) {
//       alert("Bạn cần đăng nhập");
//       return;
//     }

//     setLoading(true);

//     const payload: IAssessDestination = {
//       traveller_id: user.id,
//       destination_id: destinationId,
//       rating_star: rating,
//       comment,
//     };

//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/assess-destination`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       const result = await res.json();

//       if (!res.ok || result.error) {
//         throw new Error(result.message || "Gửi đánh giá thất bại");
//       }

//       setComment("");
//       setRating(5);
//       onSuccess();
//     } catch (err: any) {
//       alert(err.message || "Có lỗi xảy ra");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-card p-6 rounded-xl w-full max-w-md relative">
//         <button onClick={onClose} className="absolute top-3 right-3">
//           <X />
//         </button>

//         <h2 className="text-xl font-bold mb-4">Đánh giá địa điểm</h2>

//         <div className="flex gap-1 mb-4">
//           {[1, 2, 3, 4, 5].map((i) => (
//             <Star
//               key={i}
//               onClick={() => setRating(i)}
//               className={`cursor-pointer w-6 h-6 ${
//                 i <= rating
//                   ? "fill-yellow-400 text-yellow-400"
//                   : "text-gray-300"
//               }`}
//             />
//           ))}
//         </div>

//         <textarea
//           className="w-full border rounded p-2 mb-4"
//           rows={3}
//           placeholder="Chia sẻ cảm nhận của bạn..."
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//         />

//         <button
//           disabled={loading}
//           onClick={submitReview}
//           className="w-full bg-trip text-white py-2 rounded disabled:opacity-50"
//         >
//           {loading ? "Đang gửi..." : "Gửi đánh giá"}
//         </button>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import { X, Star, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  destinationId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    rating_star: number;
    comment?: string;
  };
  isEdit?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const ratingLabels = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Tuyệt vời",
};

export default function CreateReviewModal({
  destinationId,
  onClose,
  onSuccess,
  initialData,
  isEdit = false,
}: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(initialData?.rating_star || 5);
  const [comment, setComment] = useState(initialData?.comment || "");
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setRating(initialData.rating_star || 5);
      setComment(initialData.comment || "");
    }
  }, [initialData]);

  const submitReview = async () => {
    if (!user?.id) {
      alert("Bạn cần đăng nhập");
      return;
    }

    if (!rating) {
      alert("Vui lòng chọn đánh giá");
      return;
    }

    setLoading(true);

    try {
      const url = `${API_URL}/api/assess-destination`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          traveller_id: user.id,
          destination_id: destinationId,
          rating_star: rating,
          comment: comment.trim() || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(
          result.message ||
            (isEdit ? "Cập nhật đánh giá thất bại" : "Gửi đánh giá thất bại")
        );
      }

      // Reset form
      if (!isEdit) {
        setRating(5);
        setComment("");
      }
      onSuccess();
    } catch (err: any) {
      console.error("submitReview error:", err);
      alert(err.message || "Có lỗi xảy ra");
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Chỉnh sửa đánh giá" : "Đánh giá địa điểm"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Đánh giá của bạn
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Chia sẻ cảm nhận của bạn{" "}
              <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <textarea
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all dark:bg-gray-700 dark:text-white"
              rows={5}
              placeholder="Viết đánh giá chi tiết về địa điểm này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Giúp người khác hiểu thêm về địa điểm này
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
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={submitReview}
            disabled={loading || !rating}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{isEdit ? "Cập nhật đánh giá" : "Gửi đánh giá"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
