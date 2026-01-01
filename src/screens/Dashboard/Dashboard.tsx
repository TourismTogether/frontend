"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
// Import các icon cần thiết
import {
  Map, // Trip
  MessageSquare, // Discuss/Post
  NotebookPen, // Diary
  BarChart3, // Stats
  MapPin, // Route
  ChevronRight, // Icon cho Quick Assess item
  Cloud, // Weather
  Shield, // Admin
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import dynamic from "next/dynamic";
import { IRoute, ITrip } from "../../lib/type/interface";

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
        className="w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center"
        style={{ height: "500px" }}
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

// Helper function to validate coordinates
const isValidCoordinate = (value: number): boolean => {
  return !isNaN(value) && isFinite(value) && value !== 0;
};

const isValidLatitude = (lat: number): boolean => {
  return isValidCoordinate(lat) && lat >= -90 && lat <= 90;
};

const isValidLongitude = (lng: number): boolean => {
  return isValidCoordinate(lng) && lng >= -180 && lng <= 180;
};

const isValidRoute = (route: IRoute): boolean => {
  return (
    isValidLatitude(route.latStart) &&
    isValidLongitude(route.lngStart) &&
    isValidLatitude(route.latEnd) &&
    isValidLongitude(route.lngEnd)
  );
};

// --- START: Component cho Stat Card (Chỉ hiển thị số liệu, không redirect) ---
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  iconColor: string; // Tailwind class cho màu icon và giá trị
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  iconColor,
}) => (
  <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 flex flex-col justify-between">
    <div className="flex items-center space-x-3 mb-2">
      <div className={`p-2 rounded-lg ${iconColor}/10`}>
        {" "}
        {/* Màu nền nhạt */}
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
    <div className="flex items-end justify-between">
      <p className={`text-4xl font-bold ${iconColor}`}>
        {value.toLocaleString()}
      </p>
    </div>
  </div>
);
// --- END: Component cho Stat Card ---

// --- Component cho Quick Assess Item (Mới, chuyển hướng) ---
interface QuickAssessItemProps {
  icon: React.ElementType;
  label: string;
  color: string; // Màu chủ đạo (e.g., text-green-500)
  bg: string; // Màu nền nhạt (e.g., bg-green-500/10)
  link: string;
  onClick?: () => void;
}

const QuickAssessItem: React.FC<QuickAssessItemProps> = ({
  icon: Icon,
  label,
  color,
  bg,
  link,
  onClick,
}) => {
  return (
    <Link
      href={link}
      onClick={onClick}
      className={`${bg} p-3 rounded-lg flex items-center justify-between transition-all duration-200 hover:shadow-md border-l-4 ${color}`}
      style={{ borderLeftColor: color.replace("text-", "") }} // Sử dụng màu để làm border trái
    >
      <div className="flex items-center space-x-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <ChevronRight className={`w-4 h-4 text-gray-400`} />
    </Link>
  );
};

export const Dashboard: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalTrips: 0,
    totalPosts: 0,
    totalDiaries: 0,
  });
  const [recentRoutes, setRecentRoutes] = useState<any[]>([]);
  const [recentTrips, setRecentTrips] = useState<ITrip[]>([]);
  const [allRoutes, setAllRoutes] = useState<IRoute[]>([]);
  const [currentRoute, setCurrentRoute] = useState<IRoute | null>(null);
  const [newestTripRoutes, setNewestTripRoutes] = useState<IRoute[]>([]);
  const [newestTrip, setNewestTrip] = useState<ITrip | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Modal states (Giữ nguyên)
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (!API_URL || !user?.id) {
        setLoading(false);
        return;
      }

      // Fetch user trips
      let tripsData: ITrip[] = [];
      try {
        const tripsResponse = await fetch(`${API_URL}/users/${user.id}/trips`);

        if (tripsResponse.ok) {
          const tripsResult = await tripsResponse.json();
          // Handle different response formats
          if (Array.isArray(tripsResult)) {
            tripsData = tripsResult;
          } else if (tripsResult.data && Array.isArray(tripsResult.data)) {
            tripsData = tripsResult.data;
          } else if (tripsResult.data && !Array.isArray(tripsResult.data)) {
            tripsData = [tripsResult.data];
          }
          setRecentTrips(tripsData.slice(0, 5)); // Get recent 5 trips
        } else if (tripsResponse.status === 404) {
          // User has no trips yet - this is fine
          tripsData = [];
          setRecentTrips([]);
        } else {
          console.warn(`Failed to fetch trips: ${tripsResponse.status}`);
        }
      } catch (err) {
        console.error("Error fetching trips for dashboard:", err);
        tripsData = [];
        setRecentTrips([]);
      }

      // Fetch routes for all trips (not just first 5)
      const routesPromises = tripsData.map(async (trip) => {
        if (!trip.id) return [];
        try {
          const routesResponse = await fetch(
            `${API_URL}/trips/${trip.id}/routes`
          );
          if (routesResponse.ok) {
            const routesResult = await routesResponse.json();
            // Handle different response formats
            let routes: any[] = [];
            if (Array.isArray(routesResult)) {
              routes = routesResult;
            } else if (routesResult.data && Array.isArray(routesResult.data)) {
              routes = routesResult.data;
            } else if (routesResult.data && !Array.isArray(routesResult.data)) {
              routes = [routesResult.data];
            }

            return routes
              .map((r: any) => {
                // Handle both camelCase (lngStart) and snake_case (lng_start) from backend
                const latStart = Number(r.latStart ?? r.lat_start);
                const lngStart = Number(r.lngStart ?? r.lng_start);
                const latEnd = Number(r.latEnd ?? r.lat_end);
                const lngEnd = Number(r.lngEnd ?? r.lng_end);

                return {
                  id: r.id,
                  index: Number(r.index) || 0,
                  trip_id: r.trip_id || trip.id,
                  title: r.title || "",
                  description: r.description || "",
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
              .filter((route: IRoute) => isValidRoute(route)); // Filter out invalid routes
          } else if (routesResponse.status === 404) {
            // Trip has no routes yet - this is fine
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
      // Filter out routes with invalid coordinates
      const validRoutes = flattenedRoutes.filter(isValidRoute);
      setAllRoutes(validRoutes);

      // Find the newest route - sort by created_at descending
      const sortedRoutes = [...validRoutes].sort((a, b) => {
        const dateA =
          a.created_at instanceof Date
            ? a.created_at.getTime()
            : new Date(a.created_at).getTime();
        const dateB =
          b.created_at instanceof Date
            ? b.created_at.getTime()
            : new Date(b.created_at).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      // Get the newest route
      if (sortedRoutes.length > 0) {
        const newestRoute = sortedRoutes[0];
        setCurrentRoute(newestRoute);

        // Find the trip for this route
        const routeTrip = tripsData.find((t) => t.id === newestRoute.trip_id);
        if (routeTrip) {
          setNewestTrip(routeTrip);
        }

        // Set only the newest route
        setNewestTripRoutes([newestRoute]);
        setRecentRoutes([
          {
            id: newestRoute.id,
            title: newestRoute.title,
            description: newestRoute.description,
            difficulty: routeTrip?.difficult
              ? `${routeTrip.difficult}/5`
              : "N/A",
            duration_days: routeTrip
              ? Math.ceil(
                  (new Date(routeTrip.end_date).getTime() -
                    new Date(routeTrip.start_date).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0,
            distance_km: routeTrip?.distance || 0,
            view_count: 0,
            trip_id: newestRoute.trip_id,
          },
        ]);
      } else {
        setNewestTrip(null);
        setNewestTripRoutes([]);
        setCurrentRoute(null);
        setRecentRoutes([]);
      }

      // Fetch posts count
      let postsCount = 0;
      try {
        const postsResponse = await fetch(`${API_URL}/posts`);
        if (postsResponse.ok) {
          const postsResult = await postsResponse.json();
          const posts = Array.isArray(postsResult.data)
            ? postsResult.data
            : Array.isArray(postsResult)
            ? postsResult
            : [];
          // Filter posts by current user if possible
          postsCount = posts.filter(
            (p: any) => p.user_id === user.id || p.traveller_id === user.id
          ).length;
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      }

      // Fetch diaries count
      let diariesCount = 0;
      try {
        const diariesResponse = await fetch(`${API_URL}/diaries`);
        if (diariesResponse.ok) {
          const diariesResult = await diariesResponse.json();
          const diaries = Array.isArray(diariesResult.data)
            ? diariesResult.data
            : Array.isArray(diariesResult)
            ? diariesResult
            : [];
          // Filter diaries by current user
          diariesCount = diaries.filter(
            (d: any) => d.user_id === user.id
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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-traveller"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header (Chỉ còn thông báo chào mừng) */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {profile?.username || "Traveller"}!
          </h1>
          <p className="text-gray-500 mt-1">Ready for your next adventure?</p>
        </div>

        {/* --- START: Stat Cards Section (Không có Total Points, không redirect) --- */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Your Progress Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={Map}
              label="Total Trips"
              value={stats.totalTrips}
              iconColor="text-green-500"
            />
            <StatCard
              icon={MessageSquare}
              label="Total Posts"
              value={stats.totalPosts}
              iconColor="text-blue-500"
            />
            <StatCard
              icon={NotebookPen}
              label="Total Diaries"
              value={stats.totalDiaries}
              iconColor="text-orange-400"
            />
            {/* Total Points đã được loại bỏ */}
          </div>
        </div>
        {/* --- END: Stat Cards Section --- */}

        {/* Main Content: Routes & Quick Assess (Thay thế Quick Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Newest Route Section (Bên trái) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-700">
                  Newest Route
                </h2>
                {newestTrip && currentRoute && (
                  <p className="text-sm text-gray-500 mt-1">
                    From trip: {newestTrip.title}
                  </p>
                )}
              </div>
              {currentRoute?.trip_id && (
                <Link
                  href={`/trips/${currentRoute.trip_id}`}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  View Trip Details
                </Link>
              )}
            </div>

            {currentRoute ? (
              <div className="grid grid-cols-1 gap-4">
                <Link
                  href={
                    currentRoute.trip_id
                      ? `/trips/${currentRoute.trip_id}`
                      : "#"
                  }
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-gray-50/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">
                      {currentRoute.title ||
                        `Route ${(currentRoute.index ?? 0) + 1}`}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                      Newest
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {currentRoute.description || "No description available"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      Start: {currentRoute.latStart?.toFixed(4) || "N/A"},{" "}
                      {currentRoute.lngStart?.toFixed(4) || "N/A"}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      End: {currentRoute.latEnd?.toFixed(4) || "N/A"},{" "}
                      {currentRoute.lngEnd?.toFixed(4) || "N/A"}
                    </span>
                    <span className="flex items-center">
                      <Map className="w-3 h-3 mr-1" />
                      Route #{(currentRoute.index ?? 0) + 1}
                    </span>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  No routes found. Create a route to get started!
                </p>
                <button
                  onClick={() => setShowCreateRoute(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Plan Your First Route
                </button>
              </div>
            )}
          </div>

          {/* Quick Assess Section (Mới - Thay thế Quick Actions cũ) */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Quick Assess
            </h2>
            <div className="space-y-3">
              <QuickAssessItem
                icon={Map}
                label="Go to Trips"
                color="text-green-500"
                bg="bg-green-500/10"
                link="/trips"
              />
              <QuickAssessItem
                icon={MessageSquare}
                label="Go to Discussions"
                color="text-blue-500"
                bg="bg-blue-500/10"
                link="/posts"
              />
              <QuickAssessItem
                icon={NotebookPen}
                label="Go to Diaries"
                color="text-orange-500"
                bg="bg-orange-500/10"
                link="/diary"
              />
              <QuickAssessItem
                icon={BarChart3}
                label="View Stats"
                color="text-purple-500"
                bg="bg-purple-500/10"
                link="/profile" // Chuyển hướng tới /profile theo yêu cầu
              />
              <QuickAssessItem
                icon={Cloud}
                label="Check Weather"
                color="text-cyan-500"
                bg="bg-cyan-500/10"
                link="/weather"
              />
              {isAdmin && (
                <QuickAssessItem
                  icon={Shield}
                  label="Admin Panel"
                  color="text-red-500"
                  bg="bg-red-500/10"
                  link="/admin"
                />
              )}
            </div>
          </div>
        </div>

        {/* Newest Route Map Section */}
        {currentRoute && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-indigo-500" /> Newest Route
              Map
            </h2>
            {currentRoute.title && (
              <p className="text-sm text-gray-600 mb-4">{currentRoute.title}</p>
            )}
            <RouteMap
              routes={[currentRoute]}
              height="400px"
              showAllRoutes={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
