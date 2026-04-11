"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Star, MapPin, Globe, Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS, getDestinationImageUrl } from "../../constants/api";
import { COLORS } from "../../constants/colors";
import Loading from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";
import { ANIMATIONS } from "../../constants/animations";
import ShimmerCard from "../../components/Animations/ShimmerCard";
import { useDebounce } from "../../lib/useDebounce";
import {
  searchDestinationsSemantic,
  recommendDestinationsForUser,
  type SemanticDestinationHit,
} from "../../services/aiSemanticService";

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
  /** You left a review on this destination */
  _userReviewed?: boolean;
  /** You have a trip linked to this destination */
  _userTripDestination?: boolean;
  /** Shown when this row comes from AI recommendations (no active search) */
  _fromRecommend?: boolean;
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
    traveller_id?: string;
  }>;
  status?: number;
}

function destinationInteractionScore(d: IDestination): number {
  return (d._userReviewed ? 2 : 0) + (d._userTripDestination ? 1 : 0);
}

/** Fold Vietnamese diacritics for substring match (e.g. "Đà Lạt" vs "Da Lat"). */
function foldVi(s: string): string {
  try {
    return s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .trim();
  } catch {
    return s.toLowerCase().trim();
  }
}

/** Blend vector similarity with lexical overlap so place names in description rank higher. */
function semanticRankScore(
  dest: IDestination & { _similarity?: number },
  query: string
): number {
  const base = dest._similarity ?? 0;
  const q = foldVi(query);
  if (!q) return base;
  const blob = foldVi(
    `${dest.name} ${dest.description || ""} ${dest.country || ""} ${dest.region_name || ""}`
  );
  if (!blob) return base;
  let bonus = 0;
  if (blob.includes(q)) bonus += 0.22;
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length > 0) {
    const hit = tokens.filter((t) => blob.includes(t)).length;
    bonus += (hit / tokens.length) * 0.1;
  }
  return base + bonus;
}

function hitToDestination(
  h: SemanticDestinationHit
): IDestination & { _similarity?: number } {
  return {
    id: h.id,
    region_id: h.region_id || "",
    name: h.name || "",
    country: h.country || "",
    description: h.description || "",
    latitude: 0,
    longitude: 0,
    category: h.category || "",
    best_season: "",
    rating: 0,
    images: null,
    created_at: "",
    updated_at: "",
    average_rating: 0,
    total_reviews: 0,
    _similarity: h.similarity,
  };
}

export const Destinations: React.FC = () => {
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<IDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filterCategory, setFilterCategory] = useState("all");
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);
  const [semanticHits, setSemanticHits] = useState<SemanticDestinationHit[]>(
    []
  );
  const [recommendHits, setRecommendHits] = useState<SemanticDestinationHit[]>(
    []
  );
  const [recommendLoading, setRecommendLoading] = useState(false);

  useEffect(() => {
    fetchDestinations();
  }, [user?.id]);

  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setSemanticHits([]);
      setSemanticError(null);
      setSemanticLoading(false);
      return;
    }

    let cancelled = false;
    setSemanticLoading(true);
    setSemanticError(null);

    (async () => {
      try {
        const { results } = await searchDestinationsSemantic(
          debouncedSearchTerm.trim(),
          48
        );
        if (!cancelled) setSemanticHits(results);
      } catch (e) {
        if (!cancelled) {
          setSemanticHits([]);
          setSemanticError(
            e instanceof Error ? e.message : "Không gọi được dịch vụ AI."
          );
        }
      } finally {
        if (!cancelled) setSemanticLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      return;
    }
    if (!user?.id) {
      setRecommendHits([]);
      setRecommendLoading(false);
      return;
    }

    let cancelled = false;
    setRecommendLoading(true);
    (async () => {
      try {
        const { results } = await recommendDestinationsForUser(user.id, 16);
        if (!cancelled) setRecommendHits(results || []);
      } catch {
        if (!cancelled) setRecommendHits([]);
      } finally {
        if (!cancelled) setRecommendLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, debouncedSearchTerm]);

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

      const tripDestinationIds = new Set<string>();
      if (user?.id) {
        try {
          const tripsRes = await fetch(
            `${API_ENDPOINTS.USERS.BY_ID(String(user.id))}/trips`,
            { credentials: "include" }
          );
          if (tripsRes.ok) {
            const tripsJson = await tripsRes.json();
            const tripsArr: Array<{ destination_id?: string }> =
              Array.isArray(tripsJson)
                ? tripsJson
                : Array.isArray(tripsJson?.data)
                  ? tripsJson.data
                  : tripsJson?.data
                    ? [tripsJson.data]
                    : [];
            tripsArr.forEach((t) => {
              if (t?.destination_id)
                tripDestinationIds.add(String(t.destination_id));
            });
          }
        } catch {
          /* ignore */
        }
      }

      // Fetch assessment stats for each destination
      const destinationsWithStats = await Promise.all(
        fetchedDestinations.map(async (dest) => {
          const destinationId = dest.id_destination || dest.id;
          if (!destinationId) return dest;

          const uid = user?.id ? String(user.id) : null;
          const fromTrip = tripDestinationIds.has(String(destinationId));

          try {
            const assessmentResponse = await fetch(
              `${API_ENDPOINTS.REVIEWS.BASE}/destination/${destinationId}`,
              { credentials: "include" }
            );

            if (assessmentResponse.ok) {
              const assessmentResult: AssessmentResponse = await assessmentResponse.json();
              const assessments = assessmentResult.data || [];

              const userReviewed = Boolean(
                uid &&
                  assessments.some(
                    (a) => String(a.traveller_id || "") === uid
                  )
              );

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
                  _userReviewed: userReviewed,
                  _userTripDestination: fromTrip,
                };
              }
              return {
                ...dest,
                average_rating: 0,
                total_reviews: 0,
                _userReviewed: userReviewed,
                _userTripDestination: fromTrip,
              };
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
            _userReviewed: false,
            _userTripDestination: fromTrip,
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
      dest.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      dest.country?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      dest.region_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || dest.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedFilteredDestinations = [...filteredDestinations].sort((a, b) => {
    const diff = destinationInteractionScore(b) - destinationInteractionScore(a);
    if (diff !== 0) return diff;
    return (a.name || "").localeCompare(b.name || "", undefined, {
      sensitivity: "base",
    });
  });

  const destinationById = useMemo(() => {
    const m = new Map<string, IDestination>();
    for (const d of destinations) {
      const id = String(d.id_destination || d.id || "");
      if (id) m.set(id, d);
    }
    return m;
  }, [destinations]);

  const semanticFiltered = semanticHits.filter((h) => {
    if (filterCategory === "all") return true;
    return (h.category || "") === filterCategory;
  });

  const displayList: (IDestination & {
    _similarity?: number;
    _fromRecommend?: boolean;
  })[] = useMemo(() => {
    const mergeLoaded = (
      hit: IDestination & { _similarity?: number; _fromRecommend?: boolean }
    ): IDestination & { _similarity?: number; _fromRecommend?: boolean } => {
      const id = String(hit.id_destination || hit.id || "");
      const full = id ? destinationById.get(id) : undefined;
      if (!full) return hit;
      return {
        ...full,
        _similarity: hit._similarity,
        _fromRecommend: hit._fromRecommend,
      };
    };

    const q = debouncedSearchTerm.trim();

    if (q) {
      return [...semanticFiltered.map(hitToDestination)]
        .map(mergeLoaded)
        .sort((a, b) => {
          const sb = semanticRankScore(b, q);
          const sa = semanticRankScore(a, q);
          if (Math.abs(sb - sa) > 1e-6) return sb - sa;
          return (b._similarity || 0) - (a._similarity || 0);
        });
    }

    const base = sortedFilteredDestinations.map((d) => ({ ...d }));

    if (user?.id && recommendHits.length > 0) {
      const rf = recommendHits.filter(
        (h) =>
          filterCategory === "all" || (h.category || "") === filterCategory
      );
      const recRows = rf.map((h) => {
        const partial = hitToDestination(h);
        const { _similarity: _sim, ...rest } = partial;
        return mergeLoaded({ ...rest, _fromRecommend: true });
      });
      const seen = new Set(
        recRows.map((d) => String(d.id_destination || d.id))
      );
      const rest = base.filter(
        (d) => !seen.has(String(d.id_destination || d.id))
      );
      return [...recRows, ...rest];
    }

    return base;
  }, [
    debouncedSearchTerm,
    semanticFiltered,
    sortedFilteredDestinations,
    destinationById,
    filterCategory,
    user?.id,
    recommendHits,
  ]);

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
        proverb="Seeing is believing"
        imageKeyword="travel destinations"
        height="large"
        features={[
          {
            icon: <Globe className="w-6 h-6" />,
            title: "Global Exploration",
            description: "Browse destinations from around the world. Find your perfect travel spot with detailed information.",
          },
          {
            icon: <Star className="w-6 h-6" />,
            title: "Ratings & Reviews",
            description: "See what other travelers think. Read authentic reviews and ratings to make informed decisions.",
          },
          {
            icon: <Calendar className="w-6 h-6" />,
            title: "Best Seasons",
            description: "Know the best time to visit. Get seasonal information to plan your trip at the perfect time.",
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-20">

        {/* Search & Filter */}
        <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-6 mb-8`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${COLORS.TEXT.MUTED} w-5 h-5`} aria-hidden />
              <input
                type="search"
                aria-label="Semantic search destinations"
                placeholder="Describe places you want…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border ${COLORS.BORDER.DEFAULT} rounded-lg focus:outline-none focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className={`${COLORS.TEXT.MUTED} w-5 h-5`} aria-hidden />
              <select
                aria-label="Filter by category"
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

        {semanticError && debouncedSearchTerm.trim() && (
          <div
            className={`mb-6 p-4 rounded-lg border border-amber-500/40 bg-amber-500/10 ${COLORS.TEXT.DEFAULT} text-sm`}
            role="alert"
          >
            {semanticError}
          </div>
        )}

        {debouncedSearchTerm.trim() && semanticLoading && (
          <p className={`mb-4 text-sm ${COLORS.TEXT.MUTED}`}>
            Searching with AI…
          </p>
        )}

        {!debouncedSearchTerm.trim() &&
          user?.id &&
          (recommendLoading || recommendHits.length > 0) && (
            <div className="mb-6">
              <h2
                className={`text-lg font-semibold ${COLORS.TEXT.DEFAULT} mb-1`}
              >
                Recommended for you
              </h2>
              {recommendLoading ? (
                <p className={`text-sm ${COLORS.TEXT.MUTED}`}>
                  Loading personalized picks…
                </p>
              ) : (
                <p className={`text-sm ${COLORS.TEXT.MUTED}`}>
                  Based on your reviews and trips. Clear search always shows
                  these first.
                </p>
              )}
            </div>
          )}

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayList.map((dest, index) => {
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
                className={ANIMATIONS.FADE.IN_UP}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ShimmerCard
                  className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                  shimmer={false}
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
                    <div className={`absolute top-3 right-3 ${COLORS.PRIMARY.DEFAULT} px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-sm ${ANIMATIONS.BOUNCE.SOFT}`}>
                      {dest.category}
                    </div>
                  )}

                  {(dest._userReviewed || dest._userTripDestination) && (
                    <div className="absolute bottom-3 right-3 bg-emerald-600/90 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded shadow">
                      {dest._userReviewed && dest._userTripDestination
                        ? "Reviewed · Trip"
                        : dest._userReviewed
                          ? "Your review"
                          : "Your trip"}
                    </div>
                  )}

                  {!debouncedSearchTerm.trim() && dest._fromRecommend && (
                    <div className="absolute bottom-3 left-3 bg-violet-600/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                      For you
                    </div>
                  )}

                  {/* Rating Badge */}
                  {(dest.average_rating || dest.rating) > 0 && (
                    <div className={`absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1 ${ANIMATIONS.PULSE.GENTLE}`}>
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
                </ShimmerCard>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {displayList.length === 0 && (
          <div className="text-center py-16">
            <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
              <Image
                src={getDestinationImageUrl("no destinations", 200, 200)}
                alt=""
                role="presentation"
                fill
                className="object-cover opacity-50"
                unoptimized
              />
            </div>
            <MapPin className={`w-20 h-20 ${COLORS.TEXT.MUTED} mx-auto mb-4`} aria-hidden />
            <h3 className={`text-xl font-medium ${COLORS.TEXT.DEFAULT} mb-2`}>
              No destinations found
            </h3>
            <p className={`${COLORS.TEXT.MUTED} mb-6`}>
              {debouncedSearchTerm.trim() && semanticLoading
                ? "Loading AI results…"
                : debouncedSearchTerm || filterCategory !== "all"
                ? "Try adjusting your search or filters to see more results."
                : "There are no destinations available at the moment."}
            </p>
            {(debouncedSearchTerm || filterCategory !== "all") && !semanticLoading && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                }}
                className={`inline-flex items-center gap-2 ${COLORS.BORDER.DEFAULT} border px-4 py-2 rounded-lg font-medium ${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED} transition-colors`}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
