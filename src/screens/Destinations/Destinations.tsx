"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, Star, MapPin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

// Định nghĩa Interface IDestination theo yêu cầu của bạn
export interface IDestination {
  id?: string;
  region_id: string;
  name: string;
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  best_season: string;
  rating: number; // Đổi từ average_rating sang rating (theo interface bạn cung cấp)
  images: Array<string | { url: string; caption?: string }> | null; // Cho phép null
  created_at: Date | string;
  updated_at: Date | string;
  // Thêm các trường có thể có trong data fetch từ API (ví dụ: total_reviews, region_name)
  average_rating?: number;
  total_reviews?: number;
  region_name?: string;
  id_destination?: string;
}

// Định nghĩa interface cho cấu trúc phản hồi API
interface ApiResponse {
  data: IDestination[];
  // Có thể thêm các thuộc tính khác như metadata, pagination...
  [key: string]: any;
}

export const Destinations: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [destinations, setDestinations] = useState<IDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error(
          "NEXT_PUBLIC_API_URL is not defined in environment variables."
        );
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/destinations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "API fetch error:",
          errorData.message || response.statusText
        );
        throw new Error(errorData.message || "Failed to fetch destinations");
      }

      // **ĐIỂM SỬA LỖI QUAN TRỌNG:**
      // Phản hồi API là đối tượng { data: [...] }
      const result: ApiResponse = await response.json();

      // Lấy mảng destinations từ thuộc tính 'data'
      const fetchedDestinations = result.data || [];

      // Fetch assessment stats for each destination
      const destinationsWithStats = await Promise.all(
        fetchedDestinations.map(async (dest) => {
          const destinationId = dest.id_destination || dest.id;
          if (!destinationId) return dest;

          try {
            const assessmentResponse = await fetch(
              `${apiUrl}/api/assess-destination/destination/${destinationId}`
            );

            if (assessmentResponse.ok) {
              const assessmentResult = await assessmentResponse.json();
              const assessments = assessmentResult.data || [];

              if (assessments.length > 0) {
                const totalRating = assessments.reduce(
                  (sum: number, a: any) => sum + (a.rating_star || 0),
                  0
                );
                const averageRating = totalRating / assessments.length;
                return {
                  ...dest,
                  average_rating: Math.round(averageRating * 10) / 10,
                  total_reviews: assessments.length,
                };
              } else {
                return {
                  ...dest,
                  average_rating: 0,
                  total_reviews: 0,
                };
              }
            }
          } catch (err) {
            console.error(
              `Error fetching assessment stats for destination ${destinationId}:`,
              err
            );
          }

          return {
            ...dest,
            average_rating: dest.average_rating || dest.rating || 0,
            total_reviews: dest.total_reviews || 0,
          };
        })
      );

      setDestinations(destinationsWithStats);
    } catch (error) {
      console.error("Error fetching destinations:", error);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  // Đã sửa lỗi: destinations là một mảng, nên .filter() hoạt động bình thường ở đây.
  const filteredDestinations = destinations.filter((dest) => {
    const matchesSearch =
      dest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.region_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || dest.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from destinations
  const categories = [
    ...new Set(destinations.map((d) => d.category).filter(Boolean)),
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destination"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Explore Destinations
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover amazing places around the world ({destinations.length}{" "}
              destinations)
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-card rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search destinations by name, country, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="text-muted-foreground w-5 h-5" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-destination bg-background text-foreground"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDestinations.map((dest) => {
            const images = dest.images || [];
            const firstImageObj =
              Array.isArray(images) && images.length > 0 ? images[0] : null;

            const firstImage =
              (typeof firstImageObj === "string"
                ? firstImageObj
                : (firstImageObj as { url: string; caption?: string })?.url) ||
              null;

            const destinationId = dest.id_destination || dest.id;

            if (!destinationId) return null;

            return (
              <Link
                key={destinationId}
                href={`/destinations/${destinationId}`}
                className="bg-card rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              >
                {/* Image */}
                <div className="h-48 relative overflow-hidden">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={
                        (firstImageObj && typeof firstImageObj !== "string"
                          ? firstImageObj.caption
                          : dest.name) || dest.name
                      }
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.className +=
                          " bg-gradient-to-br from-destination to-destination/60";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-destination to-destination/60 flex items-center justify-center">
                      <MapPin className="w-16 h-16 text-white/50" />
                    </div>
                  )}

                  {/* Category Badge */}
                  {dest.category && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-destination shadow-md">
                      {dest.category}
                    </div>
                  )}

                  {/* Rating Badge - sử dụng average_rating hoặc rating */}
                  {(dest.average_rating || dest.rating) > 0 && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-white text-xs font-bold">
                        {Number(dest.average_rating || dest.rating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-destination transition-colors">
                    {dest.name}
                  </h3>

                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 mr-1 shrink-0" />
                    <span className="truncate">
                      {dest.region_name ? `${dest.region_name}, ` : ""}
                      {dest.country || "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current shrink-0" />
                      {/* Rating */}
                      <span className="ml-1 text-sm font-medium text-foreground">
                        {Number(
                          dest.average_rating || dest.rating || 0
                        ).toFixed(1)}
                      </span>
                      {/* Reviews */}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({dest.total_reviews || 0} reviews)
                      </span>
                    </div>
                    {dest.best_season && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {dest.best_season}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredDestinations.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              No destinations found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterCategory !== "all"
                ? "Try adjusting your search or filters"
                : "There are no destinations available at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
