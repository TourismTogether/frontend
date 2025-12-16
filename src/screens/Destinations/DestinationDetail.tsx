"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  Image as ImageIcon,
  Share2,
  Globe,
  Sun,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

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
  const { user } = useAuth();
  const [destination, setDestination] = useState<IDestinationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch Destination Detail
  useEffect(() => {
    if (destinationId) {
      fetchDestinationDetail();
    }
  }, [destinationId]);

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

      // Giả định API trả về: { status: 200, message: 'Success', data: { ...destination fields... } }
      const apiResponse: { data: IDestinationDetail } = await response.json();

      // *** SỬA LỖI Ở ĐÂY: Lấy dữ liệu điểm đến từ khóa 'data' ***
      const destinationData = apiResponse.data;

      const finalDestination: IDestinationDetail = {
        ...destinationData,
        id_destination: destinationData.id_destination || destinationData.id,
      };

      setDestination(finalDestination);

      console.log("Final Destination:", finalDestination);
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
    destination.average_rating ||
    destination.rating ||
    0
  ).toFixed(1);

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
              <div className="flex items-center bg-trip/10 rounded-xl p-4 border border-trip/30">
                <Star className="w-8 h-8 text-trip fill-trip mr-4" />
                <div>
                  <div className="text-3xl font-bold text-trip leading-none">
                    {currentRating}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Average Rating ({destination.total_reviews || 0} reviews)
                  </div>
                </div>
              </div>
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
    <Icon className={`w-5 h-5 flex-shrink-0 mt-1 ${color}`} />
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
