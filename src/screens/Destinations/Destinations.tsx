"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Star, MapPin, Globe, Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS, getDestinationImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Loading from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";

// Interface definitions
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
  rating: number;
  images: Array<string | { url: string; caption?: string }> | null;
  created_at: Date | string;
  updated_at: Date | string;
  average_rating?: number;
  total_reviews?: number;
  region_name?: string;
  id_destination?: string;
}

interface ApiResponse {
  data: IDestination[];
  status?: number;
  message?: string;
}

interface AssessmentResponse {
  data: Array<{
    rating_star: number;
    comment?: string;
  }>;
  status?: number;
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
      const response = await fetch(API_ENDPOINTS.DESTINATIONS.BASE, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "API fetch error:",
          errorData.message || response.statusText
        );
        throw new Error(errorData.message || "Failed to fetch destinations");
      }

      const result: ApiResponse = await response.json();
      const fetchedDestinations = result.data || [];

      // Fetch assessment stats for each destination
      const destinationsWithStats = await Promise.all(
        fetchedDestinations.map(async (dest) => {
          const destinationId = dest.id_destination || dest.id;
          if (!destinationId) return dest;

          try {
            const assessmentResponse = await fetch(
              `${API_ENDPOINTS.REVIEWS.BASE}/destination/${destinationId}`,
              { credentials: "include" }
            );

            if (assessmentResponse.ok) {
              const assessmentResult: AssessmentResponse = await assessmentResponse.json();
              const assessments = assessmentResult.data || [];

              if (assessments.length > 0) {
                const totalRating = assessments.reduce(
                  (sum: number, a) => sum + (a.rating_star || 0),
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

  const filteredDestinations = destinations.filter((dest) => {
    const matchesSearch =
      dest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.region_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || dest.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    ...new Set(destinations.map((d) => d.category).filter(Boolean)),
  ];

  if (loading) {
    return <Loading type="destinations" />;
  }

  return (
    <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
      {/* Hero Section */}
      <Hero
        title="Explore Destinations 🌍"
        description={`Discover amazing places around the world`}
        subtitle={`${destinations.length} destinations available`}
        imageKeyword="travel destinations"
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-20">
        {/* Search & Filter */}
        <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-6 mb-8`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${COLORS.TEXT.MUTED} w-5 h-5`} />
              <input
                type="text"
                placeholder="Search destinations by name, country, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border ${COLORS.BORDER.DEFAULT} rounded-lg focus:outline-none focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className={`${COLORS.TEXT.MUTED} w-5 h-5`} />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`px-4 py-3 border ${COLORS.BORDER.DEFAULT} rounded-lg focus:outline-none focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
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

            const imageUrl = firstImage || getDestinationImageUrl(dest.name, 400, 300);

            return (
              <Link
                key={destinationId}
                href={`/destinations/${destinationId}`}
                className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
              >
                {/* Image */}
                <div className="h-48 relative overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={dest.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Category Badge */}
                  {dest.category && (
                    <div className={`absolute top-3 right-3 ${COLORS.PRIMARY.DEFAULT} px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-sm`}>
                      {dest.category}
                    </div>
                  )}

                  {/* Rating Badge */}
                  {(dest.average_rating || dest.rating) > 0 && (
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-white text-xs font-bold">
                        {Number(dest.average_rating || dest.rating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className={`text-lg font-bold ${COLORS.TEXT.DEFAULT} mb-2 line-clamp-1 group-hover:${COLORS.TEXT.PRIMARY} transition-colors`}>
                    {dest.name}
                  </h3>

                  <div className={`flex items-center text-sm ${COLORS.TEXT.MUTED} mb-3`}>
                    <MapPin className="w-4 h-4 mr-1 shrink-0" />
                    <span className="truncate">
                      {dest.region_name ? `${dest.region_name}, ` : ""}
                      {dest.country || "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current shrink-0" />
                      <span className={`ml-1 text-sm font-medium ${COLORS.TEXT.DEFAULT}`}>
                        {Number(
                          dest.average_rating || dest.rating || 0
                        ).toFixed(1)}
                      </span>
                      <span className={`ml-1 text-xs ${COLORS.TEXT.MUTED}`}>
                        ({dest.total_reviews || 0} reviews)
                      </span>
                    </div>
                    {dest.best_season && (
                      <div className={`flex items-center text-xs ${COLORS.TEXT.MUTED} ${COLORS.BACKGROUND.MUTED} px-2 py-1 rounded`}>
                        <Calendar className="w-3 h-3 mr-1" />
                        {dest.best_season}
                      </div>
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
            <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
              <Image
                src={getDestinationImageUrl("no destinations", 200, 200)}
                alt="No destinations"
                fill
                className="object-cover opacity-50"
                unoptimized
              />
            </div>
            <MapPin className={`w-20 h-20 ${COLORS.TEXT.MUTED} mx-auto mb-4`} />
            <h3 className={`text-xl font-medium ${COLORS.TEXT.DEFAULT} mb-2`}>
              No destinations found
            </h3>
            <p className={`${COLORS.TEXT.MUTED} mb-6`}>
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
