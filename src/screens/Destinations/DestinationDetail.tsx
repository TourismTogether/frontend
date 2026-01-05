"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  Image as ImageIcon,
  Share2,
  Globe,
  Sun,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import CreateReviewModal from "./CreateReviewModal";

// Giao diện IDestinationDetail (Giữ nguyên)
interface IDestinationDetail {
  id?: string;
  id_destination: string;
  region_id: string;
  name: string;
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  best_season: string;
  rating: number;
  images: Array<any> | null;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  total_reviews?: number;
  region_name?: string;
}

interface DestinationDetailProps {
  destinationId: string;
}

export const DestinationDetail: React.FC<DestinationDetailProps> = ({
  destinationId,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [destination, setDestination] = useState<IDestinationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [assessmentStats, setAssessmentStats] = useState<{
    averageRating: number;
    totalReviews: number;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Define fetchAssessmentStats before using it in useEffect
  const fetchAssessmentStats = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl || !destinationId) return;

      const response = await fetch(
        `${apiUrl}/api/assess-destination/destination/${destinationId}`
      );

      if (response.ok) {
        const result = await response.json();
        const assessments = result.data || [];

        if (assessments.length > 0) {
          const totalRating = assessments.reduce(
            (sum: number, a: any) => sum + (a.rating_star || 0),
            0
          );
          const averageRating = totalRating / assessments.length;
          setAssessmentStats({
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: assessments.length,
          });
        } else {
          setAssessmentStats({
            averageRating: 0,
            totalReviews: 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching assessment stats:", error);
    }
  }, [destinationId]);

  // Fetch Destination Detail and Assessment Stats
  useEffect(() => {
    if (destinationId) {
      fetchDestinationDetail();
      fetchAssessmentStats();
    }
  }, [destinationId, fetchAssessmentStats]);

  // Refresh assessment stats when pathname changes (e.g., when returning from reviews page)
  useEffect(() => {
    if (
      pathname &&
      pathname.includes(`/destinations/${destinationId}`) &&
      !pathname.includes("/reviews")
    ) {
      // Only refresh if we're on the detail page (not reviews page)
      fetchAssessmentStats();
    }
  }, [pathname, destinationId, fetchAssessmentStats]);

  // Refresh assessment stats when page becomes visible (e.g., when returning from reviews page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && destinationId) {
        fetchAssessmentStats();
      }
    };

    const handleFocus = () => {
      if (destinationId) {
        fetchAssessmentStats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [destinationId, fetchAssessmentStats]);

  const fetchDestinationDetail = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error("NEXT_PUBLIC_API_URL is not defined.");
        setLoading(false);
        return;
      }

      setLoading(true);

      const response = await fetch(`${apiUrl}/destinations/${destinationId}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch destination (Status: ${response.status})`
        );
      }

      const apiResponse: { data: IDestinationDetail } = await response.json();

      const destinationData = apiResponse.data;

      const finalDestination: IDestinationDetail = {
        ...destinationData,
        id_destination:
          destinationData.id_destination || destinationData.id || "",
      };

      setDestination(finalDestination);
    } catch (error) {
      console.error("Error fetching destination detail:", error);
      setDestination(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading destination...</p>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Destination not found
          </h2>
          <p className="text-gray-600 mb-6">
            The destination you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/destinations")}
            className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Go back to destinations
          </button>
        </div>
      </div>
    );
  }

  // Parse images
  const rawImages = Array.isArray(destination.images) ? destination.images : [];
  const images = rawImages.map((img: any) => ({
    url: img?.url || (typeof img === "string" ? img : ""),
    caption: img?.caption || destination.name,
  }));
  const hasImages = images.length > 0 && images[0].url;

  const currentRating = (
    assessmentStats?.averageRating ||
    destination.average_rating ||
    destination.rating ||
    0
  ).toFixed(1);

  const totalReviews =
    assessmentStats?.totalReviews || destination.total_reviews || 0;

  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;

      // Try native share API first (mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: destination.name,
            text: destination.description || destination.name,
            url: currentUrl,
          });
          return;
        } catch (error) {
          // User cancelled or share failed, fall through to copy
        }
      }

      // Fallback to copy to clipboard
      await navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      alert("Không thể copy URL. Vui lòng thử lại.");
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Beach: "#3b82f6",
      Mountain: "#10b981",
      City: "#8b5cf6",
      Nature: "#22c55e",
      Cultural: "#f59e0b",
    };
    return colors[category] || "#6366f1";
  };

  const categoryColor = getCategoryColor(destination.category || "");

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-semibold group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Destinations</span>
          </button>
        </div>

        {/* Unified Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 relative group">
              <div className="h-[450px] md:h-[600px] relative bg-linear-to-br from-gray-200 to-gray-300">
                {hasImages ? (
                  <>
                    <img
                      src={images[currentImageIndex].url}
                      alt={
                        images[currentImageIndex].caption || destination.name
                      }
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev > 0 ? prev - 1 : images.length - 1
                            )
                          }
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-2xl shadow-xl transition-all hover:scale-110 hidden md:flex"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev < images.length - 1 ? prev + 1 : 0
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-2xl shadow-xl transition-all hover:scale-110 hidden md:flex"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute top-5 right-5 bg-black/55 backdrop-blur-sm text-white px-4 py-2 rounded-2xl text-sm font-semibold">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 p-2 bg-black/30 backdrop-blur-md rounded-2xl border border-white/20">
                          {images.map((_: any, index: number) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`rounded-full transition-all duration-300 ${
                                index === currentImageIndex
                                  ? "bg-white w-8 h-2.5"
                                  : "bg-white/50 w-2.5 h-2.5 hover:bg-white/70"
                              }`}
                              aria-label={`View image ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-linear-to-br from-gray-100 to-gray-200">
                    <ImageIcon className="w-24 h-24 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No images available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-10 bg-linear-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                  About {destination.name}
                </h2>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg font-medium">
                  {destination.description ||
                    "No description available. Please check back later or contribute to expand this section."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
            {/* Title & Rating */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <div className="flex flex-wrap gap-2 mb-6">
                {destination.category && (
                  <span
                    className="text-xs px-4 py-2 rounded-xl font-black uppercase tracking-wider border-2"
                    style={{
                      backgroundColor: `${categoryColor}10`,
                      borderColor: categoryColor,
                      color: categoryColor,
                    }}
                  >
                    {destination.category}
                  </span>
                )}
                {destination.best_season && (
                  <span className="text-xs px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold border-2 border-amber-100 flex items-center gap-1.5">
                    <Sun className="w-4 h-4" />
                    {destination.best_season}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-[1.1] tracking-tight">
                {destination.name}
              </h1>

              <div className="flex items-center gap-2 text-gray-500 mb-8 font-semibold bg-gray-50 px-4 py-3 rounded-xl">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>
                  {destination.country ||
                    destination.region_name ||
                    "Unknown Location"}
                </span>
              </div>

              <div className="bg-linear-to-br from-amber-50 via-amber-100 to-orange-50 rounded-2xl p-6 border border-amber-100 shadow-inner">
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg ring-4 ring-amber-100">
                    <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-gray-900 leading-none mb-1">
                      {currentRating}
                    </div>
                    <div className="text-xs text-gray-600 font-bold uppercase tracking-tight opacity-70">
                      {totalReviews > 0
                        ? `${totalReviews} Reviews`
                        : "No Reviews"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3">
              {user && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl py-4 font-black transition-all shadow-lg hover:shadow-blue-200 hover:scale-[1.02]"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Write a Review</span>
                </button>
              )}
              <button
                onClick={() =>
                  router.push(`/destinations/${destinationId}/reviews`)
                }
                className="w-full bg-white border-2 border-gray-100 text-gray-700 hover:bg-gray-50 transition-all rounded-2xl py-4 font-black shadow-sm"
              >
                View All Reviews ({totalReviews})
              </button>
            </div>

            {/* Quick Facts */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                Quick Facts
              </h3>
              <dl className="space-y-6">
                <FactItem
                  icon={Globe}
                  title="Category"
                  value={destination.category}
                  color="text-blue-600"
                />
                <FactItem
                  icon={Sun}
                  title="Best Season"
                  value={destination.best_season}
                  color="text-amber-500"
                />
                <FactItem
                  icon={MapPin}
                  title="Region"
                  value={destination.region_name || destination.country}
                  color="text-indigo-500"
                />
                <FactItem
                  icon={Calendar}
                  title="Added On"
                  value={
                    destination.created_at
                      ? new Date(destination.created_at).toLocaleDateString()
                      : "N/A"
                  }
                  color="text-emerald-500"
                />
              </dl>
            </div>

            {/* Share */}
            <div className="bg-linear-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl text-white">
              <div className="flex items-center gap-3 mb-6">
                <Share2 className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-black tracking-tight">
                  Share This Place
                </h3>
              </div>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 font-black shadow-lg backdrop-blur-md"
              >
                <Share2 className="w-5 h-5" />
                <span>{isCopied ? "LINK COPIED!" : "COPY LINK"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <CreateReviewModal
          destinationId={destinationId}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            fetchAssessmentStats();
            fetchDestinationDetail();
          }}
        />
      )}
    </div>
  );
};

// Component nhỏ cho các dòng Quick Fact
interface FactItemProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
}

const FactItem: React.FC<FactItemProps> = ({
  icon: Icon,
  title,
  value,
  color,
}) => {
  const getBgColor = (textColor: string) => {
    if (textColor.includes("blue")) return "bg-blue-50";
    if (textColor.includes("amber")) return "bg-amber-50";
    if (textColor.includes("indigo")) return "bg-indigo-50";
    if (textColor.includes("emerald")) return "bg-emerald-50";
    return "bg-slate-50";
  };

  return (
    <div className="flex items-center gap-4 group">
      <div
        className={`p-3.5 rounded-2xl transition-all group-hover:scale-110 ${getBgColor(
          color
        )}`}
      >
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <dt className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-0.5">
          {title}
        </dt>
        <dd className="text-base font-black text-gray-900 leading-tight">
          {value || "Unknown"}
        </dd>
      </div>
    </div>
  );
};
