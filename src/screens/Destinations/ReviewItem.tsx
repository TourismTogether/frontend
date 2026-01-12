"use client";

import { Star, User, Calendar, Edit2, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS, GRADIENTS } from "@/constants/colors";
import CreateReviewModal from "./CreateReviewModal";

interface Review {
  traveller_id: string;
  destination_id: string;
  no: number;
  rating_star: number;
  comment?: string | null;
  created_at?: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  };
}

interface Props {
  review: Review;
  destinationId: string;
  onUpdated: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ReviewItem({
  review,
  destinationId,
  onUpdated,
}: Props) {
  const { user } = useAuth();
  const [openEdit, setOpenEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "vừa xong";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) return;

    if (!user || review.traveller_id !== user.id) {
      alert("Bạn không có quyền xóa đánh giá này!");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/assess-destination`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          traveller_id: review.traveller_id,
          destination_id: destinationId,
          no: review.no,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.message || "Xóa đánh giá thất bại");
      }

      onUpdated();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err.message || "Có lỗi khi xóa đánh giá");
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = user && review.traveller_id === user.id;

  return (
    <>
      <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden`}>
        <div className="p-4 sm:p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full ${GRADIENTS.PRIMARY} flex items-center justify-center shrink-0 shadow-md border-2 ${COLORS.BACKGROUND.CARD}`}>
              {review.user?.avatar_url ? (
                <img
                  src={review.user.avatar_url}
                  alt={review.user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold ${COLORS.TEXT.DEFAULT} text-base sm:text-lg mb-1 transition-colors duration-200`}>
                    {review.user?.full_name || "Anonymous"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            i <= review.rating_star
                              ? "fill-yellow-400 text-yellow-400"
                              : `${COLORS.TEXT.MUTED} opacity-40`
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                      {review.rating_star}.0
                    </span>
                  </div>
                </div>

                {review.created_at && (
                  <div className={`flex items-center gap-1 text-xs sm:text-sm ${COLORS.TEXT.MUTED} shrink-0 transition-colors duration-200`}>
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{formatTimeAgo(review.created_at)}</span>
                    <span className="sm:hidden">{formatTimeAgo(review.created_at).split(' ')[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comment */}
          {review.comment ? (
            <p className={`${COLORS.TEXT.DEFAULT} leading-relaxed pl-0 sm:pl-12 md:pl-16 text-sm sm:text-base transition-colors duration-200 break-words`}>
              {review.comment}
            </p>
          ) : (
            <p className={`${COLORS.TEXT.MUTED} italic pl-0 sm:pl-12 md:pl-16 text-sm sm:text-base transition-colors duration-200`}>
              Không có bình luận
            </p>
          )}

          {/* Delete / Edit */}
          {isOwner && (
            <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-5 pl-0 sm:pl-12 md:pl-16">
              <button
                onClick={() => setOpenEdit(true)}
                disabled={deleting}
                className={`flex items-center gap-1.5 ${COLORS.PRIMARY.TEXT} ${COLORS.TEXT.PRIMARY_HOVER} font-medium transition-colors text-xs sm:text-sm`}
              >
                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Sửa
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`flex items-center gap-1.5 ${COLORS.DESTRUCTIVE.TEXT} ${COLORS.DESTRUCTIVE.TEXT_HOVER} font-medium transition-colors text-xs sm:text-sm`}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Đang xóa...</span>
                    <span className="sm:hidden">Xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    Xóa
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal sửa đánh giá */}
      {openEdit && (
        <CreateReviewModal
          mode="edit"
          destinationId={destinationId}
          initialData={review}
          onClose={() => setOpenEdit(false)}
          onSuccess={() => {
            setOpenEdit(false);
            onUpdated();
          }}
        />
      )}
    </>
  );
}
