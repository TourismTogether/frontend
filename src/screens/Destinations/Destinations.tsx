"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Star, MapPin, Globe, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { API_ENDPOINTS, getDestinationImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Hero from "../../components/Hero/Hero";
import { ANIMATIONS } from "../../constants/animations";
import ShimmerCard from "../../components/Animations/ShimmerCard";
import { useDebounce } from "../../lib/useDebounce";
import { supabase } from "@/lib/supabase";
import {
  searchDestinationsSemantic,
  recommendDestinationsForUser,
  type SemanticDestinationHit,
} from "../../services/aiSemanticService";

/**
 * Supabase PostgREST table for destinations. Local migration uses `destination`;
 * many deployments only sync the backend DB (`destinations`) or have no table on Supabase at all.
 * Set NEXT_PUBLIC_SUPABASE_DESTINATIONS_TABLE if your project exposes a different name.
 * Set NEXT_PUBLIC_DESTINATIONS_USE_API=true to skip Supabase and use the backend API only.
 */
const SUPABASE_DESTINATIONS_TABLE =
  process.env.NEXT_PUBLIC_SUPABASE_DESTINATIONS_TABLE?.trim() || "destination";
const DESTINATIONS_USE_API_ONLY =
  process.env.NEXT_PUBLIC_DESTINATIONS_USE_API === "true";

function isSupabaseTableMissingError(message: string): boolean {
  return (
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("PGRST205")
  );
}

/** Client-side page slice (used when Supabase is unavailable and data comes from GET /destinations). */
function filterSortSliceDestinations(
  all: IDestination[],
  opts: {
    filterCategory: string;
    recommendExcludeIds: string[];
    currentPage: number;
    pageSize: number;
  }
): { pageRows: IDestination[]; total: number } {
  let list = all;
  if (opts.filterCategory !== "all") {
    list = list.filter((d) => d.category === opts.filterCategory);
  }
  if (opts.recommendExcludeIds.length > 0) {
    const ex = new Set(opts.recommendExcludeIds.map(String));
    list = list.filter(
      (d) => !ex.has(String(d.id ?? "")) && !ex.has(String(d.id_destination ?? ""))
    );
  }
  list = [...list].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
  );
  const total = list.length;
  const from = (opts.currentPage - 1) * opts.pageSize;
  const pageRows = list.slice(from, from + opts.pageSize);
  return { pageRows, total };
}

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

interface ApiListResponse {
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

/** Columns available on public.destination (see frontend/supabase/migrations/schema.sql). */
const DESTINATION_SELECT =
  "uuid, id_destination, id_region, name, country, region_name, latitude, longitude, category, best_season, average_rating, total_reviews, images, created_at, updated_at";

type DestinationRow = {
  uuid: string;
  id_destination: string;
  id_region: string | null;
  name: string;
  country: string | null;
  region_name: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  category: string | null;
  best_season: string | null;
  average_rating: string | number | null;
  total_reviews: number | null;
  images: IDestination["images"];
  created_at: string;
  updated_at: string;
};

function rowToDestination(row: DestinationRow): IDestination {
  return {
    id: row.uuid,
    id_destination: row.id_destination,
    region_id: row.id_region ?? "",
    name: row.name,
    country: row.country ?? "",
    description: "",
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    category: row.category ?? "",
    best_season: row.best_season ?? "",
    rating: Number(row.average_rating ?? 0),
    images: row.images ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    average_rating: Number(row.average_rating ?? 0),
    total_reviews: Number(row.total_reviews ?? 0),
    region_name: row.region_name ?? undefined,
  };
}

function buildDestinationLookup(rows: IDestination[]): Map<string, IDestination> {
  const m = new Map<string, IDestination>();
  for (const d of rows) {
    const a = String(d.id_destination || "");
    const b = String(d.id || "");
    if (a) m.set(a, d);
    if (b) m.set(b, d);
  }
  return m;
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

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/** Build PostgREST `in.(...)` / `not.in.(...)` list for uuid columns. */
function uuidInList(uuids: string[]): string {
  return `(${uuids.join(",")})`;
}

function visiblePageIndices(totalPages: number, current: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push(-1);
    out.push(sorted[i]);
  }
  return out;
}

function DestinationGridSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard
          key={`sk-${i}`}
          className="h-full overflow-hidden"
          shimmer
        >
          <div className="h-48 bg-slate-200/40 dark:bg-slate-700/40 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-slate-200/50 dark:bg-slate-700/50 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-slate-200/40 dark:bg-slate-700/40 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-slate-200/40 dark:bg-slate-700/40 rounded animate-pulse w-full" />
          </div>
        </ShimmerCard>
      ))}
    </>
  );
}

export const Destinations: React.FC = () => {
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<IDestination[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [pageLoading, setPageLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filterCategory, setFilterCategory] = useState("all");
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);
  const [semanticHits, setSemanticHits] = useState<SemanticDestinationHit[]>([]);
  const [semanticDetailRows, setSemanticDetailRows] = useState<IDestination[]>([]);
  const [recommendHits, setRecommendHits] = useState<SemanticDestinationHit[]>([]);
  const [recommendRowsFull, setRecommendRowsFull] = useState<IDestination[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);

  const apiDestinationsCacheRef = useRef<IDestination[] | null>(null);
  const apiFetchPromiseRef = useRef<Promise<IDestination[]> | null>(null);

  const fetchAllDestinationsFromApi = useCallback(async (): Promise<IDestination[]> => {
    if (apiDestinationsCacheRef.current) {
      return apiDestinationsCacheRef.current;
    }
    if (apiFetchPromiseRef.current) {
      return apiFetchPromiseRef.current;
    }
    const p = (async () => {
      try {
        const response = await fetch(API_ENDPOINTS.DESTINATIONS.BASE, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            (errBody as { message?: string }).message ||
              response.statusText ||
              "Failed to fetch destinations"
          );
        }
        const result: ApiListResponse = await response.json();
        const list = result.data || [];
        apiDestinationsCacheRef.current = list;
        return list;
      } finally {
        apiFetchPromiseRef.current = null;
      }
    })();
    apiFetchPromiseRef.current = p;
    return p;
  }, []);

  const recommendExcludeIds = useMemo(
    () =>
      user?.id
        ? [...new Set(recommendHits.map((h) => h.id).filter(Boolean))]
        : [],
    [user?.id, recommendHits]
  );

  const totalPages = useMemo(() => {
    if (totalCount === null) return 1;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const applyCategories = (rows: { category?: string | null }[]) => {
        const cats = [
          ...new Set(
            rows.map((r) => r.category).filter(Boolean)
          ),
        ] as string[];
        setCategories(cats.sort((a, b) => a.localeCompare(b)));
      };

      if (DESTINATIONS_USE_API_ONLY) {
        try {
          const all = await fetchAllDestinationsFromApi();
          if (!cancelled) applyCategories(all);
        } catch {
          if (!cancelled) setCategories([]);
        }
        return;
      }

      const { data, error } = await supabase
        .from(SUPABASE_DESTINATIONS_TABLE)
        .select("category");
      if (!cancelled && !error && data?.length) {
        applyCategories(data as { category: string | null }[]);
        return;
      }

      try {
        const all = await fetchAllDestinationsFromApi();
        if (!cancelled) applyCategories(all);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAllDestinationsFromApi]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, pageSize]);

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
    if (!debouncedSearchTerm.trim() || !semanticHits.length) {
      setSemanticDetailRows([]);
      return;
    }
    const ids = [...new Set(semanticHits.map((h) => h.id).filter(Boolean))];
    let cancelled = false;
    (async () => {
      if (!DESTINATIONS_USE_API_ONLY) {
        const { data, error } = await supabase
          .from(SUPABASE_DESTINATIONS_TABLE)
          .select(DESTINATION_SELECT)
          .in("uuid", ids);
        if (!cancelled && !error && data?.length) {
          setSemanticDetailRows((data || []).map((r) => rowToDestination(r as DestinationRow)));
          return;
        }
      }
      try {
        const all = await fetchAllDestinationsFromApi();
        if (cancelled) return;
        const idSet = new Set(ids.map(String));
        const matched = all.filter(
          (d) =>
            idSet.has(String(d.id ?? "")) || idSet.has(String(d.id_destination ?? ""))
        );
        setSemanticDetailRows(matched);
      } catch {
        if (!cancelled) setSemanticDetailRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm, semanticHits, fetchAllDestinationsFromApi]);

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
        const { results } = await recommendDestinationsForUser(user.id, 8);
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

  useEffect(() => {
    if (!user?.id || !recommendHits.length) {
      setRecommendRowsFull([]);
      return;
    }
    const ids = [...new Set(recommendHits.map((h) => h.id).filter(Boolean))];
    let cancelled = false;
    (async () => {
      if (!DESTINATIONS_USE_API_ONLY) {
        const { data, error } = await supabase
          .from(SUPABASE_DESTINATIONS_TABLE)
          .select(DESTINATION_SELECT)
          .in("uuid", ids);
        if (!cancelled && !error && data?.length) {
          setRecommendRowsFull((data || []).map((r) => rowToDestination(r as DestinationRow)));
          return;
        }
      }
      try {
        const all = await fetchAllDestinationsFromApi();
        if (cancelled) return;
        const idSet = new Set(ids.map(String));
        const matched = all.filter(
          (d) =>
            idSet.has(String(d.id ?? "")) || idSet.has(String(d.id_destination ?? ""))
        );
        setRecommendRowsFull(matched);
      } catch {
        if (!cancelled) setRecommendRowsFull([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, recommendHits, fetchAllDestinationsFromApi]);

  const enrichDestinationsWithReviews = useCallback(
    async (rows: IDestination[]): Promise<IDestination[]> => {
      const tripDestinationIds = new Set<string>();
      if (user?.id) {
        try {
          const tripsRes = await fetch(
            `${API_ENDPOINTS.USERS.BY_ID(String(user.id))}/trips`,
            { credentials: "include" }
          );
          if (tripsRes.ok) {
            const tripsJson = await tripsRes.json();
            const tripsArr: Array<{ destination_id?: string }> = Array.isArray(tripsJson)
              ? tripsJson
              : Array.isArray(tripsJson?.data)
                ? tripsJson.data
                : tripsJson?.data
                  ? [tripsJson.data]
                  : [];
            tripsArr.forEach((t) => {
              if (t?.destination_id) tripDestinationIds.add(String(t.destination_id));
            });
          }
        } catch {
          /* ignore */
        }
      }

      const uid = user?.id ? String(user.id) : null;
      return Promise.all(
        rows.map(async (dest) => {
          const destinationId = dest.id_destination || dest.id;
          if (!destinationId) return dest;
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
                uid && assessments.some((a) => String(a.traveller_id || "") === uid)
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
    },
    [user?.id]
  );

  const fetchDestinationsPage = useCallback(async () => {
    if (debouncedSearchTerm.trim()) {
      setDestinations([]);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    try {
      let baseRows: IDestination[] = [];
      let countOut = 0;

      if (DESTINATIONS_USE_API_ONLY) {
        const all = await fetchAllDestinationsFromApi();
        const { pageRows, total } = filterSortSliceDestinations(all, {
          filterCategory,
          recommendExcludeIds,
          currentPage,
          pageSize,
        });
        baseRows = pageRows;
        countOut = total;
      } else {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let q = supabase
          .from(SUPABASE_DESTINATIONS_TABLE)
          .select(DESTINATION_SELECT, { count: "exact" })
          .order("name", { ascending: true });

        if (filterCategory !== "all") {
          q = q.eq("category", filterCategory);
        }
        if (recommendExcludeIds.length > 0) {
          q = q.not("uuid", "in", uuidInList(recommendExcludeIds));
        }

        const { data, error, count } = await q.range(from, to);

        if (!error && data) {
          baseRows = (data || []).map((r) => rowToDestination(r as DestinationRow));
          countOut = count ?? baseRows.length;
        } else {
          if (error) {
            const msg = error.message || "";
            if (isSupabaseTableMissingError(msg)) {
              if (process.env.NODE_ENV === "development") {
                console.info(
                  `[Destinations] Supabase has no table "${SUPABASE_DESTINATIONS_TABLE}"; using GET /destinations. ` +
                    "Set NEXT_PUBLIC_DESTINATIONS_USE_API=true to skip this attempt."
                );
              }
            } else {
              console.warn("[Destinations] Supabase query failed:", msg);
            }
          }
          const all = await fetchAllDestinationsFromApi();
          const { pageRows, total } = filterSortSliceDestinations(all, {
            filterCategory,
            recommendExcludeIds,
            currentPage,
            pageSize,
          });
          baseRows = pageRows;
          countOut = total;
        }
      }

      const enriched = await enrichDestinationsWithReviews(baseRows);
      setDestinations(enriched);
      setTotalCount(countOut);
    } catch (e) {
      console.error("Error fetching destinations page:", e);
      setDestinations([]);
      setTotalCount(0);
    } finally {
      setPageLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    filterCategory,
    debouncedSearchTerm,
    recommendExcludeIds,
    enrichDestinationsWithReviews,
    fetchAllDestinationsFromApi,
  ]);

  useEffect(() => {
    void fetchDestinationsPage();
  }, [fetchDestinationsPage]);

  const destinationById = useMemo(() => {
    const merged = [...destinations, ...semanticDetailRows, ...recommendRowsFull];
    return buildDestinationLookup(merged);
  }, [destinations, semanticDetailRows, recommendRowsFull]);

  const sortedPageDestinations = useMemo(() => {
    return [...destinations].sort((a, b) => {
      const diff = destinationInteractionScore(b) - destinationInteractionScore(a);
      if (diff !== 0) return diff;
      return (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      });
    });
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

    const base = sortedPageDestinations.map((d) => ({ ...d }));

    if (user?.id && recommendHits.length > 0) {
      const rf = recommendHits.filter(
        (h) => filterCategory === "all" || (h.category || "") === filterCategory
      );
      const recRows = rf.map((h) => {
        const partial = hitToDestination(h);
        const { _similarity: _sim, ...rest } = partial;
        return mergeLoaded({ ...rest, _fromRecommend: true });
      });
      const seen = new Set(recRows.map((d) => String(d.id_destination || d.id)));
      const rest = base.filter((d) => !seen.has(String(d.id_destination || d.id)));
      return [...recRows, ...rest];
    }

    return base;
  }, [
    debouncedSearchTerm,
    semanticFiltered,
    sortedPageDestinations,
    destinationById,
    filterCategory,
    user?.id,
    recommendHits,
  ]);

  const browseMode = !debouncedSearchTerm.trim();
  const pageIndices = useMemo(
    () => visiblePageIndices(totalPages, currentPage),
    [totalPages, currentPage]
  );

  const skeletonCount = Math.min(pageSize, 12);

  return (
    <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
      <Hero
        title="Find Your Next Dream Destination"
        description={`AI-assisted discovery for unforgettable journeys`}
        subtitle={
          totalCount !== null
            ? `${totalCount} curated destinations`
            : "Loading destination count…"
        }
        proverb="Travel far, feel alive"
        imageKeyword="travel destinations"
        height="large"
        features={[
          {
            icon: <Globe className="w-6 h-6" />,
            title: "Global Exploration",
            description:
              "Browse destinations from around the world. Find your perfect travel spot with detailed information.",
          },
          {
            icon: <Star className="w-6 h-6" />,
            title: "Ratings & Reviews",
            description:
              "See what other travelers think. Read authentic reviews and ratings to make informed decisions.",
          },
          {
            icon: <Calendar className="w-6 h-6" />,
            title: "Best Seasons",
            description:
              "Know the best time to visit. Get seasonal information to plan your trip at the perfect time.",
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-10 relative z-20">
        <div
          className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-3xl shadow-xl p-6 md:p-7 mb-8 ${GRADIENTS.CARD}`}
        >
          <div className="mb-4">
            <h2 className={`text-xl md:text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
              Explore by vibe, season, and place
            </h2>
            <p className={`text-sm mt-1 ${COLORS.TEXT.MUTED}`}>
              Search naturally, filter quickly, and jump into details instantly.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${COLORS.TEXT.MUTED} w-5 h-5`}
                aria-hidden
              />
              <input
                type="search"
                aria-label="Semantic search destinations"
                placeholder="Describe places you want…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3.5 border ${COLORS.BORDER.DEFAULT} rounded-xl focus:outline-none focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className={`${COLORS.TEXT.MUTED} w-5 h-5`} aria-hidden />
              <select
                aria-label="Filter by category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`px-4 py-3.5 border ${COLORS.BORDER.DEFAULT} rounded-xl focus:outline-none focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
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
            className={`mb-6 p-4 rounded-xl border ${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.CARD} ${COLORS.TEXT.DEFAULT} text-sm`}
            role="alert"
          >
            {semanticError}
          </div>
        )}

        {debouncedSearchTerm.trim() && semanticLoading && (
          <div
            className={`mb-5 rounded-2xl border ${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.CARD} px-4 py-3 shadow-sm`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${GRADIENTS.PRIMARY_DARK} text-white shadow`}>
                <Search className="h-4 w-4 animate-pulse" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${COLORS.TEXT.DEFAULT}`}>
                  Searching with AI...
                </p>
                <p className={`text-xs ${COLORS.TEXT.MUTED}`}>
                  Matching your intent with semantic destination suggestions.
                </p>
              </div>
            </div>
          </div>
        )}

        {!debouncedSearchTerm.trim() &&
          user?.id &&
          (recommendLoading || recommendHits.length > 0) && (
            <div
              className={`mb-6 rounded-2xl border ${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.CARD} p-4 md:p-5 shadow-sm`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className={`mt-0.5 flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl ${GRADIENTS.PRIMARY} text-white shadow`}>
                  <Star className="h-4 w-4 fill-current" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className={`text-base md:text-lg font-semibold tracking-tight ${COLORS.TEXT.DEFAULT}`}>
                    Recommended for you
                  </h2>
                  {recommendLoading ? (
                    <p className={`mt-1 text-sm leading-relaxed ${COLORS.TEXT.MUTED}`}>
                      Building personalized picks based on your recent travel activity...
                    </p>
                  ) : (
                    <p className={`mt-1 text-sm leading-relaxed ${COLORS.TEXT.MUTED}`}>
                      Personalized from your reviews and trips. Clear search keeps these
                      recommendations on top.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
          {browseMode && pageLoading ? (
            <DestinationGridSkeleton count={skeletonCount} />
          ) : (
            displayList.map((dest, index) => {
              const images = dest.images || [];
              const firstImageObj =
                Array.isArray(images) && images.length > 0 ? images[0] : null;

              const firstImage =
                (typeof firstImageObj === "string"
                  ? firstImageObj
                  : (firstImageObj as { url: string; caption?: string })?.url) || null;

              const destinationId = dest.id_destination || dest.id;

              if (!destinationId) return null;

              const imageUrl =
                firstImage || getDestinationImageUrl(dest.name, 400, 300);

              return (
                <Link
                  key={String(destinationId)}
                  href={`/destinations/${destinationId}`}
                  className={ANIMATIONS.FADE.IN_UP}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ShimmerCard
                    className={`h-full rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group border ${COLORS.BORDER.LIGHT}`}
                    shimmer={false}
                  >
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
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

                      {dest.category && (
                        <div
                          className={`absolute top-3 right-3 bg-linear-to-r from-blue-600 to-cyan-500 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg backdrop-blur-sm ${ANIMATIONS.BOUNCE.SOFT}`}
                        >
                          {dest.category}
                        </div>
                      )}

                      {(dest._userReviewed || dest._userTripDestination) && (
                        <div className="absolute bottom-3 right-3 bg-emerald-600/90 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md shadow">
                          {dest._userReviewed && dest._userTripDestination
                            ? "Reviewed · Trip"
                            : dest._userReviewed
                              ? "Your review"
                              : "Your trip"}
                        </div>
                      )}

                      {!debouncedSearchTerm.trim() && dest._fromRecommend && (
                        <div className="absolute bottom-3 left-3 bg-amber-500/95 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide text-slate-900 shadow">
                          For you
                        </div>
                      )}

                      {(dest.average_rating || dest.rating) > 0 && (
                        <div className={`absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1 ${ANIMATIONS.PULSE.GENTLE}`}>
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-white text-xs font-bold">
                            {Number(dest.average_rating || dest.rating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={`p-4 ${COLORS.BACKGROUND.CARD}`}>
                      <h3
                        className={`text-lg font-bold ${COLORS.TEXT.DEFAULT} mb-2 line-clamp-1 group-hover:${COLORS.TEXT.PRIMARY} transition-colors`}
                      >
                        {dest.name}
                      </h3>

                      <div
                        className={`flex items-center text-sm ${COLORS.TEXT.MUTED} mb-3`}
                      >
                        <MapPin className="w-4 h-4 mr-1 shrink-0" />
                        <span className="truncate">
                          {dest.region_name ? `${dest.region_name}, ` : ""}
                          {dest.country || "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-current shrink-0" />
                          <span
                            className={`ml-1 text-sm font-medium ${COLORS.TEXT.DEFAULT}`}
                          >
                            {Number(dest.average_rating || dest.rating || 0).toFixed(1)}
                          </span>
                          <span className={`ml-1 text-xs ${COLORS.TEXT.MUTED}`}>
                            ({dest.total_reviews || 0} reviews)
                          </span>
                        </div>
                        {dest.best_season && (
                          <div className={`flex items-center text-xs ${COLORS.TEXT.MUTED} ${COLORS.BACKGROUND.MUTED} px-2 py-1 rounded-md`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {dest.best_season}
                          </div>
                        )}
                      </div>
                    </div>
                  </ShimmerCard>
                </Link>
              );
            })
          )}
        </div>

        {browseMode && !pageLoading && displayList.length === 0 && (
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
            <MapPin
              className={`w-20 h-20 ${COLORS.TEXT.MUTED} mx-auto mb-4`}
              aria-hidden
            />
            <h3 className={`text-xl font-medium ${COLORS.TEXT.DEFAULT} mb-2`}>
              No destinations found
            </h3>
            <p className={`${COLORS.TEXT.MUTED} mb-6`}>
              {filterCategory !== "all"
                ? "Try adjusting your filters to see more results."
                : "There are no destinations available at the moment."}
            </p>
            {filterCategory !== "all" && (
              <button
                type="button"
                onClick={() => setFilterCategory("all")}
                className={`inline-flex items-center gap-2 ${COLORS.BORDER.DEFAULT} border px-4 py-2 rounded-lg font-medium ${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED} transition-colors`}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {debouncedSearchTerm.trim() && displayList.length === 0 && !semanticLoading && (
          <div className="text-center py-16">
            <MapPin
              className={`w-20 h-20 ${COLORS.TEXT.MUTED} mx-auto mb-4`}
              aria-hidden
            />
            <h3 className={`text-xl font-medium ${COLORS.TEXT.DEFAULT} mb-2`}>
              No destinations found
            </h3>
            <p className={`${COLORS.TEXT.MUTED} mb-6`}>
              Try adjusting your search or filters to see more results.
            </p>
            {(debouncedSearchTerm || filterCategory !== "all") && (
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

        {browseMode && totalCount !== null && totalCount > 0 && (
          <nav
            className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 border-t ${COLORS.BORDER.DEFAULT} pt-8`}
            aria-label="Destination pagination"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className={`text-sm ${COLORS.TEXT.MUTED}`}>
                Per page
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={`text-sm rounded-xl border ${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.CARD} px-3 py-2 ${COLORS.TEXT.DEFAULT}`}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || pageLoading}
                className={`inline-flex items-center gap-1 rounded-xl border ${COLORS.BORDER.DEFAULT} px-3 py-2 text-sm font-medium ${COLORS.TEXT.DEFAULT} disabled:opacity-40 disabled:cursor-not-allowed hover:${COLORS.BACKGROUND.MUTED} transition-colors`}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {pageIndices.map((p, i) =>
                  p === -1 ? (
                    <span
                      key={`e-${i}`}
                      className={`px-2 text-sm ${COLORS.TEXT.MUTED}`}
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      disabled={pageLoading}
                      className={`min-w-9 rounded-xl px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                        p === currentPage
                          ? `bg-linear-to-r from-blue-600 to-violet-600 text-white shadow`
                          : `border ${COLORS.BORDER.DEFAULT} ${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED}`
                      }`}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || pageLoading}
                className={`inline-flex items-center gap-1 rounded-xl border ${COLORS.BORDER.DEFAULT} px-3 py-2 text-sm font-medium ${COLORS.TEXT.DEFAULT} disabled:opacity-40 disabled:cursor-not-allowed hover:${COLORS.BACKGROUND.MUTED} transition-colors`}
              >
                Next
                <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <p className={`text-sm ${COLORS.TEXT.MUTED}`}>
              Page <span className={`font-semibold ${COLORS.TEXT.DEFAULT}`}>{currentPage}</span> of{" "}
              <span className={`font-semibold ${COLORS.TEXT.DEFAULT}`}>{totalPages}</span>
            </p>
          </nav>
        )}
      </div>
    </div>
  );
};
