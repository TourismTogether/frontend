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
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destination"></div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8 bg-card rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Destination not found
          </h2>
          <button
            onClick={() => router.push("/destinations")}
            className="text-destination hover:text-destination/80 font-medium"
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Back button (Design nhỏ gọn hơn) */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-500 hover:text-destination mb-8 transition-all duration-300 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Destinations</span>
        </button>

        {/* --- GRID CONTAINER: Ảnh và Thông tin cơ bản --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Cột 1 & 2: Image Gallery (Tăng kích thước ảnh) */}
          <div className="lg:col-span-2 bg-card rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="h-[400px] md:h-[550px] relative bg-gray-200 dark:bg-gray-800">
              {hasImages ? (
                <>
                  <img
                    src={images[currentImageIndex].url}
                    alt={images[currentImageIndex].caption || destination.name}
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />

                  {/* Indicators and Navigation (Phong cách tối giản) */}
                  {images.length > 1 && (
                    <>
                      {/* Navigation buttons */}
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev > 0 ? prev - 1 : images.length - 1
                          )
                        }
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-3 rounded-full hover:bg-black/60 transition-all duration-200 focus:outline-none hidden md:block"
                        aria-label="Previous image"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            prev < images.length - 1 ? prev + 1 : 0
                          )
                        }
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-3 rounded-full hover:bg-black/60 transition-all duration-200 focus:outline-none hidden md:block"
                        aria-label="Next image"
                      >
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </button>
                      {/* Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 p-2 bg-black/10 backdrop-blur-sm rounded-full">
                        {images.map(
                          (
                            _: { url: string; caption: string },
                            index: number
                          ) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentImageIndex
                                  ? "bg-white w-6" // Màu trắng nổi bật
                                  : "bg-gray-400/70"
                              }`}
                              aria-label={`View image ${index + 1}`}
                            />
                          )
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60">
                  <ImageIcon className="w-20 h-20 mb-3" />
                  <p>No featured images available</p>
                </div>
              )}
            </div>
          </div>

          {/* Cột 3: Header và Rating (Sidebar) */}
          <div className="lg:col-span-1 flex flex-col space-y-6">
            {/* Tiêu đề & Rating */}
            <div className="bg-card p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center space-x-3 mb-3">
                {destination.category && (
                  <span className="px-3 py-1 bg-destination/10 text-destination rounded-full text-sm font-semibold border border-destination/30">
                    {destination.category}
                  </span>
                )}
                {destination.best_season && (
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                    <Sun className="w-4 h-4 inline mr-1 text-yellow-500" />
                    {destination.best_season}
                  </span>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-4 leading-tight">
                {destination.name}
              </h1>

              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-6">
                <MapPin className="w-5 h-5 text-destination" />
                <span className="text-lg">
                  {destination.country ||
                    destination.region_name ||
                    "Unknown Location"}
                </span>
              </div>

              {/* Rating Box */}
              <div className="flex items-center bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-5 border-2 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-center w-16 h-16 bg-yellow-400 dark:bg-yellow-500 rounded-full mr-4">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white leading-none mb-1">
                    {currentRating}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {totalReviews > 0
                      ? `${totalReviews} ${
                          totalReviews === 1 ? "đánh giá" : "đánh giá"
                        }`
                      : "Chưa có đánh giá"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {user && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Đánh giá địa điểm</span>
                </button>
              )}
              <button
                onClick={() =>
                  router.push(`/destinations/${destinationId}/reviews`)
                }
                className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-xl py-3 font-semibold"
              >
                Xem tất cả đánh giá ({totalReviews})
              </button>
            </div>

            {/* Actions */}
            <div className="bg-card p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                Share This Place
              </h3>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: destination.name,
                      text: destination.description || destination.name,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-destination hover:bg-destination/90 text-white rounded-xl transition-all duration-300 font-semibold shadow-md shadow-destination/30"
              >
                <Share2 className="w-5 h-5" />
                <span>Share Destination Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- MAIN DETAIL CONTENT: Description & Facts --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột 1 & 2: Description (Tăng độ rộng) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-card p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50">
              <h2 className="text-3xl font-bold text-foreground mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
                About {destination.name}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
                {destination.description ||
                  "No description available. Please check back later or contribute to expand this section."}
              </p>
            </div>

            {/* Optional: Map or other rich media section can go here */}
          </div>

          {/* Cột 3: Fact Box (Thông tin chi tiết) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Quick Facts
              </h3>

              <dl className="space-y-4">
                <FactItem
                  icon={Globe}
                  title="Category"
                  value={destination.category}
                  color="text-destination"
                />
                <FactItem
                  icon={Sun}
                  title="Best Season"
                  value={destination.best_season}
                  color="text-yellow-500"
                />
                <FactItem
                  icon={MapPin}
                  title="Region"
                  value={destination.region_name || destination.country}
                  color="text-indigo-500"
                />
                <FactItem
                  icon={Calendar}
                  title="Date Added"
                  value={
                    destination.created_at
                      ? new Date(destination.created_at).toLocaleDateString()
                      : "N/A"
                  }
                  color="text-green-500"
                />
                <FactItem
                  icon={MapPin}
                  title="Coordinates"
                  value={
                    destination.latitude && destination.longitude
                      ? `${destination.latitude.toFixed(
                          4
                        )}, ${destination.longitude.toFixed(4)}`
                      : "N/A"
                  }
                  color="text-red-500"
                  isCode={true}
                />
              </dl>
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
  isCode?: boolean;
}

const FactItem: React.FC<FactItemProps> = ({
  icon: Icon,
  title,
  value,
  color,
  isCode = false,
}) => (
  <div className="flex items-start space-x-3 border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0">
    <Icon className={`w-5 h-5 shrink-0 mt-1 ${color}`} />
    <div className="flex-1">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </dt>
      <dd
        className={`text-base font-semibold text-foreground ${
          isCode ? "font-mono text-sm" : ""
        } capitalize`}
      >
        {value || "Unknown"}
      </dd>
    </div>
  </div>
);
