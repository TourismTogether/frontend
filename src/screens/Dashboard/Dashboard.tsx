"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Map,
  MessageSquare,
  NotebookPen,
  BarChart3,
  MapPin,
  ChevronRight,
  Cloud,
  Shield,
  Plane,
  Camera,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import dynamic from "next/dynamic";
import { IRoute, ITrip } from "../../lib/type/interface";
import {
  API_ENDPOINTS,
  getTravelImageUrl,
  getDestinationImageUrl,
} from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Loading from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";
import { ANIMATIONS } from "../../constants/animations";
import PulseGlow from "../../components/Animations/PulseGlow";

// Dynamically import RouteMap to avoid SSR issues
const RouteMap = dynamic(
  () =>
    import("../../components/Map/RouteMap").then((mod) => ({
      default: mod.RouteMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center"
        style={{ height: "500px" }}
      >
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

// Types
interface DashboardStats {
  totalRoutes: number;
  totalTrips: number;
  totalPosts: number;
  totalDiaries: number;
}

interface RouteResponse {
  id: number;
  index?: number;
  trip_id?: number;
  title?: string;
  description?: string;
  latStart?: number;
  lngStart?: number;
  lat_end?: number;
  lng_end?: number;
  latEnd?: number;
  lngEnd?: number;
  details?: string[];
  created_at?: string;
  updated_at?: string;
}

interface TripResponse {
  id: number;
  title?: string;
  description?: string;
  start_date: string;
  end_date: string;
  difficult?: number;
  distance?: number;
}

interface PostResponse {
  id: number;
  user_id?: number;
  traveller_id?: number;
}

interface DiaryResponse {
  id: number;
  user_id?: number;
}

// Helper functions
const isValidCoordinate = (value: number): boolean => {
  return !isNaN(value) && isFinite(value);
};

const isValidLatitude = (lat: number): boolean => {
  return isValidCoordinate(lat) && lat >= -90 && lat <= 90;
};

const isValidLongitude = (lng: number): boolean => {
  return isValidCoordinate(lng) && lng >= -180 && lng <= 180;
};

const isValidRoute = (route: IRoute): boolean => {
  // A route is valid if it has at least start OR end coordinates
  // (some routes might only have start or only end)
  const hasValidStart =
    isValidLatitude(route.latStart) && isValidLongitude(route.lngStart);
  const hasValidEnd =
    isValidLatitude(route.latEnd) && isValidLongitude(route.lngEnd);
  return hasValidStart || hasValidEnd;
};

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  gradient: string;
  imageUrl?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  gradient,
  imageUrl,
}) => (
  <div
    className={`relative bg-card border border-border rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${ANIMATIONS.FADE.IN_UP}`}
  >
    {imageUrl && (
      <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity">
        <Image
          src={imageUrl}
          alt={label}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    )}
    <div className="relative p-6 flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center justify-between mb-4">
        <PulseGlow
          variant="glow"
          className={`p-3 rounded-lg ${gradient} shadow-md ${ANIMATIONS.ROTATE.SLOW}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </PulseGlow>
        {imageUrl && (
          <div className="w-16 h-16 rounded-lg overflow-hidden opacity-20">
            <Image
              src={imageUrl}
              alt={label}
              width={64}
              height={64}
              className="object-cover"
              unoptimized
            />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {label}
        </p>
        <p className={`text-4xl font-bold ${COLORS.TEXT.PRIMARY}`}>
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

// Quick Access Item Component
interface QuickAccessItemProps {
  icon: React.ElementType;
  label: string;
  link: string;
  gradient: string;
}

const QuickAccessItem: React.FC<QuickAccessItemProps> = ({
  icon: Icon,
  label,
  link,
  gradient,
}) => {
  return (
    <Link
      href={link}
      className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border-l-4 ${COLORS.BORDER.PRIMARY} p-4 rounded-lg flex items-center justify-between transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${gradient} group-hover:scale-110 transition-all duration-200`}
        >
          <Icon className="w-5 h-5 text-white transition-colors duration-200" />
        </div>
        <span
          className={`font-medium ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}
        >
          {label}
        </span>
      </div>
      <ChevronRight
        className={`w-4 h-4 ${COLORS.TEXT.MUTED} group-hover:${COLORS.TEXT.PRIMARY} group-hover:translate-x-1 transition-all duration-200`}
      />
    </Link>
  );
};

export const Dashboard: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRoutes: 0,
    totalTrips: 0,
    totalPosts: 0,
    totalDiaries: 0,
  });
  const [recentTrips, setRecentTrips] = useState<ITrip[]>([]);
  const [allRoutes, setAllRoutes] = useState<IRoute[]>([]);
  const [newestTripRoutes, setNewestTripRoutes] = useState<IRoute[]>([]);
  const [newestTrip, setNewestTrip] = useState<ITrip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Fetch user trips
      let tripsData: ITrip[] = [];
      try {
        if (!user.id || user.id === "NaN" || user.id === "undefined") {
          console.error("Invalid user.id:", user.id);
          tripsData = [];
          setRecentTrips([]);
        } else {
          const tripsResponse = await fetch(
            API_ENDPOINTS.USERS.BY_ID(String(user.id)) + "/trips",
            {
              credentials: "include",
            }
          );

          if (tripsResponse.ok) {
            const tripsResult = await tripsResponse.json();
            if (Array.isArray(tripsResult)) {
              tripsData = tripsResult;
            } else if (tripsResult.data && Array.isArray(tripsResult.data)) {
              tripsData = tripsResult.data;
            } else if (tripsResult.data && !Array.isArray(tripsResult.data)) {
              tripsData = [tripsResult.data];
            }
            setRecentTrips(tripsData.slice(0, 5));
          } else if (tripsResponse.status === 404) {
            tripsData = [];
            setRecentTrips([]);
          } else {
            console.warn(`Failed to fetch trips: ${tripsResponse.status}`);
          }
        }
      } catch (err) {
        console.error("Error fetching trips for dashboard:", err);
        tripsData = [];
        setRecentTrips([]);
      }

      // Fetch routes for all trips
      const routesPromises = tripsData.map(async (trip) => {
        if (!trip.id || trip.id === "NaN" || trip.id === "undefined") return [];
        try {
          const routesResponse = await fetch(
            API_ENDPOINTS.TRIPS.ROUTES(String(trip.id)),
            { credentials: "include" }
          );
          if (routesResponse.ok) {
            const routesResult = await routesResponse.json();
            // Handle different response formats - same as DetailTrip.tsx
            const rawRoutes = routesResult.data || routesResult || [];
            const routes: RouteResponse[] = Array.isArray(rawRoutes)
              ? rawRoutes
              : [];

            console.log(
              `[Dashboard] Fetched ${routes.length} routes for trip ${trip.id}:`,
              routes
            );

            return routes
              .map((r: RouteResponse) => {
                // Parse coordinates - handle both camelCase and snake_case, similar to DetailTrip
                const latStart = Number(r.latStart ?? r.latStart ?? NaN);
                const lngStart = Number(r.lngStart ?? r.lngStart ?? NaN);
                const latEnd = Number(r.latEnd ?? r.lat_end ?? NaN);
                const lngEnd = Number(r.lngEnd ?? r.lng_end ?? NaN);

                console.log(`[Dashboard] Route ${r.id} coordinates:`, {
                  latStart,
                  lngStart,
                  latEnd,
                  lngEnd,
                  raw: r,
                });

                return {
                  id: String(r.id),
                  index: Number(r.index) || 0,
                  trip_id: String(r.trip_id || trip.id),
                  title: r.title || "",
                  description: r.description || "",
                  // Set coordinates - use 0 as fallback (will be validated later)
                  lngStart: isValidLongitude(lngStart) ? lngStart : 0,
                  latStart: isValidLatitude(latStart) ? latStart : 0,
                  lngEnd: isValidLongitude(lngEnd) ? lngEnd : 0,
                  latEnd: isValidLatitude(latEnd) ? latEnd : 0,
                  details: Array.isArray(r.details) ? r.details : [],
                  costs: [],
                  created_at: r.created_at
                    ? new Date(r.created_at)
                    : new Date(),
                  updated_at: r.updated_at
                    ? new Date(r.updated_at)
                    : new Date(),
                } as IRoute;
              })
              .filter((route: IRoute) => {
                // Accept route if it has at least valid start OR end coordinates
                const hasValidStart =
                  isValidLatitude(route.latStart) &&
                  isValidLongitude(route.lngStart);
                const hasValidEnd =
                  isValidLatitude(route.latEnd) &&
                  isValidLongitude(route.lngEnd);
                return hasValidStart || hasValidEnd;
              });
          } else if (routesResponse.status === 404) {
            return [];
          } else {
            console.warn(
              `Failed to fetch routes for trip ${trip.id}: ${routesResponse.status}`
            );
            return [];
          }
        } catch (err) {
          console.error(`Error fetching routes for trip ${trip.id}:`, err);
          return [];
        }
      });

      const allRoutesArrays = await Promise.all(routesPromises);
      const flattenedRoutes = allRoutesArrays.flat();
      console.log(
        `[Dashboard] Total routes before validation: ${flattenedRoutes.length}`
      );
      const validRoutes = flattenedRoutes.filter(isValidRoute);
      console.log(`[Dashboard] Total valid routes: ${validRoutes.length}`);
      setAllRoutes(validRoutes);

      // Find the nearest trip
      if (tripsData.length > 0) {
        const now = new Date().getTime();
        const sortedTrips = [...tripsData].sort((a, b) => {
          const startA = new Date(a.start_date).getTime();
          const startB = new Date(b.start_date).getTime();
          const aIsUpcoming = startA > now;
          const bIsUpcoming = startB > now;

          if (aIsUpcoming && !bIsUpcoming) return -1;
          if (!aIsUpcoming && bIsUpcoming) return 1;
          return startB - startA;
        });

        const nearestTrip = sortedTrips[0];
        setNewestTrip(nearestTrip);

        const tripRoutes = validRoutes
          .filter((route) => route.trip_id === nearestTrip.id)
          .sort((a, b) => (a.index || 0) - (b.index || 0));

        if (tripRoutes.length > 0) {
          setNewestTripRoutes(tripRoutes);
        } else {
          setNewestTripRoutes([]);
        }
      } else {
        setNewestTrip(null);
        setNewestTripRoutes([]);
      }

      // Fetch posts count
      let postsCount = 0;
      try {
        const postsResponse = await fetch(API_ENDPOINTS.FORUM.POSTS.BASE, {
          credentials: "include",
        });
        if (postsResponse.ok) {
          const postsResult = await postsResponse.json();
          const posts: PostResponse[] = Array.isArray(postsResult.data)
            ? postsResult.data
            : Array.isArray(postsResult)
            ? postsResult
            : [];
          postsCount = posts.filter(
            (p: PostResponse) =>
              String(p.user_id) === String(user.id) ||
              String(p.traveller_id) === String(user.id)
          ).length;
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      }

      // Fetch diaries count
      let diariesCount = 0;
      try {
        const diariesResponse = await fetch(API_ENDPOINTS.DIARIES.BASE, {
          credentials: "include",
        });
        if (diariesResponse.ok) {
          const diariesResult = await diariesResponse.json();
          const diaries: DiaryResponse[] = Array.isArray(diariesResult.data)
            ? diariesResult.data
            : Array.isArray(diariesResult)
            ? diariesResult
            : [];
          diariesCount = diaries.filter(
            (d: DiaryResponse) => String(d.user_id) === String(user.id)
          ).length;
        }
      } catch (err) {
        console.error("Error fetching diaries:", err);
      }

      setStats({
        totalRoutes: flattenedRoutes.length,
        totalTrips: tripsData.length,
        totalPosts: postsCount,
        totalDiaries: diariesCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats({
        totalRoutes: 0,
        totalTrips: 0,
        totalPosts: 0,
        totalDiaries: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading type="dashboard" />;
  }

  return (
    <div
      className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT} transition-colors duration-300`}
    >
      {/* Hero Section with Image */}
      <Hero
        title={`Welcome back, ${profile?.username || "Traveller"}! 🌍`}
        description="Ready for your next adventure?"
        imageKeyword="travel adventure"
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-20">
        {/* Stats Cards Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp
              className={`w-6 h-6 ${COLORS.TEXT.PRIMARY} transition-colors duration-200`}
            />
            <h2
              className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}
            >
              Your Progress Summary
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              className={ANIMATIONS.FADE.IN_UP}
              style={{ animationDelay: "0.1s" }}
            >
              <StatCard
                icon={Plane}
                label="Total Trips"
                value={stats.totalTrips}
                gradient={GRADIENTS.PRIMARY}
                imageUrl={getTravelImageUrl("airplane travel", 400, 300)}
              />
            </div>
            <div
              className={ANIMATIONS.FADE.IN_UP}
              style={{ animationDelay: "0.2s" }}
            >
              <StatCard
                icon={MessageSquare}
                label="Total Posts"
                value={stats.totalPosts}
                gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
                imageUrl={getTravelImageUrl("discussion forum", 400, 300)}
              />
            </div>
            <div
              className={ANIMATIONS.FADE.IN_UP}
              style={{ animationDelay: "0.3s" }}
            >
              <StatCard
                icon={NotebookPen}
                label="Total Diaries"
                value={stats.totalDiaries}
                gradient="bg-gradient-to-r from-amber-500 to-orange-500"
                imageUrl={getTravelImageUrl("travel journal", 400, 300)}
              />
            </div>
            <div
              className={ANIMATIONS.FADE.IN_UP}
              style={{ animationDelay: "0.4s" }}
            >
              <StatCard
                icon={MapPin}
                label="Total Routes"
                value={stats.totalRoutes}
                gradient={GRADIENTS.PRIMARY}
                imageUrl={getTravelImageUrl("travel route map", 400, 300)}
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Nearest Trip Section */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {newestTrip && newestTripRoutes.length > 0 ? (
              <>
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={getDestinationImageUrl(
                      newestTrip.title || "travel destination",
                      800,
                      300
                    )}
                    alt={newestTrip.title || "Trip"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div
                    className={`absolute inset-0 ${GRADIENTS.PRIMARY_DARK} opacity-60`}
                  ></div>
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                          Nearest Trip
                        </h2>
                        <p className="text-white/90 drop-shadow-md">
                          {newestTrip.title || "Untitled Trip"}
                        </p>
                        {newestTripRoutes.length > 0 && (
                          <p className="text-sm text-white/80 mt-1">
                            {newestTripRoutes.length} route
                            {newestTripRoutes.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      {newestTrip.id && (
                        <Link
                          href={`/trips/${newestTrip.id}`}
                          className={`px-4 py-2 ${COLORS.PRIMARY.DEFAULT} rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shadow-lg`}
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {newestTripRoutes.slice(0, 3).map((route, idx) => (
                      <Link
                        key={route.id || idx}
                        href={newestTrip.id ? `/trips/${newestTrip.id}` : "#"}
                        className={`block border ${COLORS.BORDER.DEFAULT} rounded-lg p-4 hover:${COLORS.BORDER.PRIMARY} hover:shadow-md transition-all bg-muted/30`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {route.title || `Route ${(route.index ?? 0) + 1}`}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded ${COLORS.PRIMARY.LIGHT}`}
                          >
                            #
                            {route.index !== undefined
                              ? route.index + 1
                              : idx + 1}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {route.description || "No description available"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            Start: {route.latStart?.toFixed(4) || "N/A"}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            End: {route.latEnd?.toFixed(4) || "N/A"}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {newestTripRoutes.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        +{newestTripRoutes.length - 3} more route
                        {newestTripRoutes.length - 3 > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                  <Image
                    src={getTravelImageUrl("adventure planning", 200, 200)}
                    alt="No trips"
                    fill
                    className="object-cover opacity-50"
                    unoptimized
                  />
                </div>
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4 text-lg">
                  No routes found. Create a route to get started!
                </p>
                <Link
                  href="/trips"
                  className={`inline-block px-6 py-3 ${COLORS.PRIMARY.DEFAULT} ${COLORS.PRIMARY.HOVER} rounded-lg transition-colors font-medium shadow-md`}
                >
                  Plan Your First Route
                </Link>
              </div>
            )}
          </div>

          {/* Quick Access Section */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className={`w-5 h-5 ${COLORS.TEXT.PRIMARY}`} />
              <h2 className="text-xl font-bold text-foreground">
                Quick Access
              </h2>
            </div>
            <div className="space-y-3">
              <QuickAccessItem
                icon={Map}
                label="Go to Trips"
                link="/trips"
                gradient={GRADIENTS.PRIMARY}
              />
              <QuickAccessItem
                icon={MessageSquare}
                label="Go to Forum"
                link="/forum"
                gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
              />
              <QuickAccessItem
                icon={NotebookPen}
                label="Go to Diaries"
                link="/diaries"
                gradient="bg-gradient-to-r from-amber-500 to-orange-500"
              />
              <QuickAccessItem
                icon={BarChart3}
                label="View Stats"
                link="/profile"
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
              />
              <QuickAccessItem
                icon={Cloud}
                label="Check Weather"
                link="/weather"
                gradient="bg-gradient-to-r from-cyan-500 to-teal-500"
              />
              {isAdmin && (
                <QuickAccessItem
                  icon={Shield}
                  label="Admin Panel"
                  link="/admin"
                  gradient="bg-gradient-to-r from-red-500 to-rose-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Nearest Trip Map Section */}
        {newestTrip && newestTripRoutes.length > 0 && (
          <div className="mb-8 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${GRADIENTS.PRIMARY}`}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Nearest Trip Map
                    </h2>
                    {newestTrip.title && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {newestTrip.title}
                      </p>
                    )}
                  </div>
                </div>
                {newestTrip.id && (
                  <Link
                    href={`/trips/${newestTrip.id}`}
                    className={`text-sm font-medium ${COLORS.TEXT.PRIMARY} hover:underline`}
                  >
                    View Trip Details →
                  </Link>
                )}
              </div>
            </div>
            <RouteMap
              routes={newestTripRoutes}
              height="500px"
              showAllRoutes={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
