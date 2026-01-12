// "use client";

// import { useEffect, useState } from "react";
// import {
//   Star,
//   ArrowLeft,
//   MessageSquare,
//   User,
//   Calendar,
//   Loader2,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";
// import CreateReviewModal from "./CreateReviewModal";
// import ReviewItem from "./ReviewItem";

// interface Props {
//   destinationId: string;
// }

// interface Review {
//   traveller_id: string;
//   destination_id: string;
//   rating_star: number;
//   comment?: string;
//   created_at?: string;
//   user?: {
//     id: string;
//     full_name: string;
//     avatar_url?: string;
//   };
// }

// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// export default function DestinationReviews({ destinationId }: Props) {
//   const router = useRouter();
//   const { user } = useAuth();
//   const [open, setOpen] = useState(false);
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [destinationName, setDestinationName] = useState<string>("");
//   const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

//   const fetchDestinationInfo = async () => {
//     try {
//       const res = await fetch(`${API_URL}/destinations/${destinationId}`);
//       if (res.ok) {
//         const result = await res.json();
//         setDestinationName(result.data?.name || "");
//       }
//     } catch (err) {
//       console.error("Error fetching destination:", err);
//     }
//   };

//   const fetchReviews = async () => {
//     if (!destinationId) return;

//     setLoading(true);
//     try {
//       const res = await fetch(
//         `${API_URL}/api/assess-destination/destination/${destinationId}`
//       );

//       const result = await res.json();

//       if (!res.ok || result.error) {
//         throw new Error(result.message || "Fetch reviews failed");
//       }

//       const reviewsData = result.data || [];

//       // Fetch user info for each review
//       const reviewsWithUsers = await Promise.all(
//         reviewsData.map(async (review: Review) => {
//           try {
//             const userRes = await fetch(
//               `${API_URL}/users/${review.traveller_id}`
//             );
//             if (userRes.ok) {
//               const userData = await userRes.json();
//               const userInfo = userData.data || userData;
//               return {
//                 ...review,
//                 user: {
//                   id: userInfo.id,
//                   full_name: userInfo.full_name || "Anonymous",
//                   avatar_url: userInfo.avatar_url || null,
//                 },
//               };
//             }
//           } catch (err) {
//             console.error(`Error fetching user ${review.traveller_id}:`, err);
//           }
//           return {
//             ...review,
//             user: {
//               id: review.traveller_id,
//               full_name: "Anonymous",
//               avatar_url: null,
//             },
//           };
//         })
//       );

//       setReviews(reviewsWithUsers);

//       // Calculate stats
//       if (reviewsWithUsers.length > 0) {
//         const totalRating = reviewsWithUsers.reduce(
//           (sum, r) => sum + (r.rating_star || 0),
//           0
//         );
//         const averageRating = totalRating / reviewsWithUsers.length;
//         setStats({
//           averageRating: Math.round(averageRating * 10) / 10,
//           totalReviews: reviewsWithUsers.length,
//         });
//       } else {
//         setStats({ averageRating: 0, totalReviews: 0 });
//       }
//     } catch (err) {
//       console.error("fetchReviews error:", err);
//       setReviews([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDestinationInfo();
//     fetchReviews();
//   }, [destinationId]);

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("vi-VN", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   const formatTimeAgo = (dateString: string) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

//     if (diffInSeconds < 60) return "vừa xong";
//     if (diffInSeconds < 3600)
//       return `${Math.floor(diffInSeconds / 60)} phút trước`;
//     if (diffInSeconds < 86400)
//       return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
//     if (diffInSeconds < 2592000)
//       return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
//     return formatDate(dateString);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
//       <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="mb-8">
//           <button
//             onClick={() => router.back()}
//             className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors font-medium group"
//           >
//             <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
//             Quay lại
//           </button>

//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <div>
//               <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
//                 Đánh giá địa điểm
//               </h1>
//               {destinationName && (
//                 <p className="text-lg text-gray-600 dark:text-gray-400">
//                   {destinationName}
//                 </p>
//               )}
//             </div>

//             {user && (
//               <button
//                 onClick={() => setOpen(true)}
//                 className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
//               >
//                 <MessageSquare className="w-5 h-5" />
//                 <span>Viết đánh giá</span>
//               </button>
//             )}
//           </div>

//           {/* Stats Card */}
//           {stats.totalReviews > 0 && (
//             <div className="mt-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
//               <div className="flex items-center gap-6">
//                 <div className="flex items-center justify-center w-16 h-16 bg-yellow-400 dark:bg-yellow-500 rounded-full">
//                   <Star className="w-8 h-8 text-white fill-white" />
//                 </div>
//                 <div>
//                   <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
//                     {stats.averageRating.toFixed(1)}
//                   </div>
//                   <div className="text-sm text-gray-600 dark:text-gray-400">
//                     Dựa trên {stats.totalReviews}{" "}
//                     {stats.totalReviews === 1 ? "đánh giá" : "đánh giá"}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Reviews List */}
//         {loading ? (
//           <div className="flex justify-center items-center py-20">
//             <div className="text-center">
//               <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
//               <p className="text-gray-600 dark:text-gray-400">
//                 Đang tải đánh giá...
//               </p>
//             </div>
//           </div>
//         ) : reviews.length === 0 ? (
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-16 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
//             <MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
//             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
//               Chưa có đánh giá nào
//             </h3>
//             <p className="text-gray-600 dark:text-gray-400 mb-6">
//               Hãy là người đầu tiên đánh giá địa điểm này!
//             </p>
//             {user && (
//               <button
//                 onClick={() => setOpen(true)}
//                 className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
//               >
//                 <MessageSquare className="w-5 h-5" />
//                 <span>Viết đánh giá đầu tiên</span>
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {reviews.map((review, index) => (
//               <div
//                 key={`${review.traveller_id}-${review.destination_id}-${index}`}
//                 className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
//               >
//                 <div className="p-6">
//                   {/* Review Header */}
//                   <div className="flex items-start gap-4 mb-4">
//                     {/* Avatar */}
//                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md border-2 border-white dark:border-gray-800">
//                       {review.user?.avatar_url ? (
//                         <img
//                           src={review.user.avatar_url}
//                           alt={review.user.full_name}
//                           className="w-full h-full rounded-full object-cover"
//                         />
//                       ) : (
//                         <User className="w-6 h-6 text-white" />
//                       )}
//                     </div>

//                     {/* User Info and Rating */}
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-start justify-between gap-4 mb-2">
//                         <div>
//                           <h3 className="font-bold text-gray-900 dark:text-white text-lg">
//                             {review.user?.full_name || "Anonymous"}
//                           </h3>
//                           <div className="flex items-center gap-2 mt-1">
//                             <div className="flex gap-0.5">
//                               {[1, 2, 3, 4, 5].map((i) => (
//                                 <Star
//                                   key={i}
//                                   className={`w-4 h-4 ${
//                                     i <= review.rating_star
//                                       ? "fill-yellow-400 text-yellow-400"
//                                       : "fill-gray-200 text-gray-300 dark:fill-gray-600 dark:text-gray-500"
//                                   }`}
//                                 />
//                               ))}
//                             </div>
//                             <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
//                               {review.rating_star}.0
//                             </span>
//                           </div>
//                         </div>
//                         {review.created_at && (
//                           <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
//                             <Calendar className="w-4 h-4" />
//                             <span>{formatTimeAgo(review.created_at)}</span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Review Content */}
//                   {review.comment ? (
//                     <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-16">
//                       {review.comment}
//                     </p>
//                   ) : (
//                     <p className="text-gray-400 dark:text-gray-500 italic pl-16">
//                       Không có bình luận
//                     </p>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Review Modal */}
//       {open && (
//         <CreateReviewModal
//           destinationId={destinationId}
//           onClose={() => setOpen(false)}
//           onSuccess={() => {
//             setOpen(false);
//             fetchReviews();
//             fetchDestinationInfo();
//           }}
//         />
//       )}
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import {
  Star,
  ArrowLeft,
  MessageSquare,
  User,
  Calendar,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS, GRADIENTS } from "@/constants/colors";
import CreateReviewModal from "./CreateReviewModal";
import ReviewItem from "./ReviewItem";

interface Props {
  destinationId: string;
}

interface Review {
  traveller_id: string;
  destination_id: string;
  no: number;
  rating_star: number;
  comment?: string;
  created_at?: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function DestinationReviews({ destinationId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinationName, setDestinationName] = useState<string>("");
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

  const fetchDestinationInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/destinations/${destinationId}`);
      if (res.ok) {
        const result = await res.json();
        setDestinationName(result.data?.name || "");
      }
    } catch (err) {
      console.error("Error fetching destination:", err);
    }
  };

  const fetchReviews = async () => {
    if (!destinationId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/assess-destination/destination/${destinationId}`
      );

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.message || "Fetch reviews failed");
      }

      const reviewsData = result.data || [];

      const reviewsWithUsers = await Promise.all(
        reviewsData.map(async (review: Review) => {
          try {
            const userRes = await fetch(
              `${API_URL}/users/${review.traveller_id}`
            );
            if (userRes.ok) {
              const userData = await userRes.json();
              const userInfo = userData.data || userData;
              return {
                ...review,
                user: {
                  id: userInfo.id,
                  full_name: userInfo.full_name || "Anonymous",
                  avatar_url: userInfo.avatar_url || null,
                },
              };
            }
          } catch (err) {
            console.error(`Error fetching user ${review.traveller_id}:`, err);
          }
          return {
            ...review,
            user: {
              id: review.traveller_id,
              full_name: "Anonymous",
              avatar_url: null,
            },
          };
        })
      );

      setReviews(reviewsWithUsers);

      // Calculate stats
      if (reviewsWithUsers.length > 0) {
        const totalRating = reviewsWithUsers.reduce(
          (sum, r) => sum + (r.rating_star || 0),
          0
        );
        const averageRating = totalRating / reviewsWithUsers.length;
        setStats({
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviewsWithUsers.length,
        });
      } else {
        setStats({ averageRating: 0, totalReviews: 0 });
      }
    } catch (err) {
      console.error("fetchReviews error:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinationInfo();
    fetchReviews();
  }, [destinationId]);

  return (
    <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT} transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className={`flex items-center ${COLORS.TEXT.MUTED} ${COLORS.TEXT.PRIMARY_HOVER} mb-6 transition-colors font-medium group`}
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold ${COLORS.TEXT.DEFAULT} mb-2 transition-colors duration-200`}>
                Đánh giá địa điểm
              </h1>
              {destinationName && (
                <p className={`text-base sm:text-lg ${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                  {destinationName}
                </p>
              )}
            </div>

            {user && (
              <button
                onClick={() => setOpen(true)}
                className={`flex items-center gap-2 ${GRADIENTS.PRIMARY} text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold`}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Viết đánh giá</span>
              </button>
            )}
          </div>

          {/* Stats Card */}
          {stats.totalReviews > 0 && (
            <div className={`mt-6 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg transition-colors duration-200`}>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${GRADIENTS.PRIMARY} rounded-full shadow-md`}>
                  <Star className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white fill-white" />
                </div>
                <div>
                  <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${COLORS.TEXT.DEFAULT} mb-1 transition-colors duration-200`}>
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className={`text-xs sm:text-sm ${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                    Dựa trên {stats.totalReviews}{" "}
                    {stats.totalReviews === 1 ? "đánh giá" : "đánh giá"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex justify-center items-center py-12 sm:py-16 md:py-20">
            <div className="text-center">
              <Loader2 className={`w-10 h-10 sm:w-12 sm:h-12 animate-spin ${COLORS.PRIMARY.TEXT} mx-auto mb-4`} />
              <p className={`text-sm sm:text-base ${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                Đang tải đánh giá...
              </p>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border-2 border-dashed rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 md:p-16 text-center transition-colors duration-200`}>
            <MessageSquare className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${COLORS.TEXT.MUTED} mx-auto mb-4 transition-colors duration-200`} />
            <h3 className={`text-xl sm:text-2xl font-bold ${COLORS.TEXT.DEFAULT} mb-2 transition-colors duration-200`}>
              Chưa có đánh giá nào
            </h3>
            <p className={`text-sm sm:text-base ${COLORS.TEXT.MUTED} mb-6 transition-colors duration-200`}>
              Hãy là người đầu tiên đánh giá địa điểm này!
            </p>
            {user && (
              <button
                onClick={() => setOpen(true)}
                className={`inline-flex items-center gap-2 ${GRADIENTS.PRIMARY} text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105`}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Viết đánh giá đầu tiên</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <ReviewItem
                key={`${review.traveller_id}-${review.destination_id}-${index}`}
                review={review}
                destinationId={destinationId}
                onUpdated={fetchReviews} // Refresh lại sau khi sửa/xóa
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal tạo đánh giá mới */}
      {open && (
        <CreateReviewModal
          mode="create"
          destinationId={destinationId}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            fetchReviews();
            fetchDestinationInfo();
          }}
        />
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <CreateReviewModal
          mode="edit"
          destinationId={destinationId}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            setEditingReview(null);
            fetchReviews();
            fetchDestinationInfo();
          }}
          initialData={editingReview}
        />
      )}
    </div>
  );
}
