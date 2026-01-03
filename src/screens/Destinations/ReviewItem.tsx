"use client";

import { Star, User, Calendar, Edit2, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

export default function ReviewItem({ review, destinationId, onUpdated }: Props) {
  const { user } = useAuth();
  const [openEdit, setOpenEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md border-2 border-white dark:border-gray-800">
              {review.user?.avatar_url ? (
                <img
                  src={review.user.avatar_url}
                  alt={review.user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {review.user?.full_name || "Anonymous"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <= review.rating_star
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-300 dark:fill-gray-600 dark:text-gray-500"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {review.rating_star}.0
                    </span>
                  </div>
                </div>

                {review.created_at && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                    <span>{formatTimeAgo(review.created_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comment */}
          {review.comment ? (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-16">
              {review.comment}
            </p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic pl-16">
              Không có bình luận
            </p>
          )}

          {/* Delete / Edit */}
          {isOwner && (
            <div className="flex gap-4 mt-5 pl-16">
              <button
                onClick={() => setOpenEdit(true)}
                disabled={deleting}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Sửa
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 dark:text-red-400 font-medium transition-colors"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
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