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
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { WeatherMap } from "../../components/Map/WeatherMap";

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
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalTrips: 0,
    totalPosts: 0,
    totalDiaries: 0,
  });
  const [recentRoutes, setRecentRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      await new Promise((resolve) => setTimeout(resolve, 800));

      setStats({
        totalRoutes: 15,
        totalTrips: 7,
        totalPosts: 23,
        totalDiaries: 11,
      });

      setRecentRoutes([]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
          {/* Current Routes Section (Bên trái) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-700">
                Current Routes
              </h2>
              <Link
                href="/routes"
                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            {recentRoutes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentRoutes.map((route) => (
                  <Link
                    key={route.id}
                    href={`/routes/${route.id}`}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-gray-50/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 line-clamp-1">
                        {route.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          route.difficulty === "Easy"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {route.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {route.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                      <span className="flex items-center">
                        <NotebookPen className="w-3 h-3 mr-1" />{" "}
                        {route.duration_days || "N/A"} days
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />{" "}
                        {route.distance_km || 0} km
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {route.view_count || 0} views
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  No popular routes found. Be the first to share one!
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
            </div>
          </div>
        </div>

        {/* Weather Map Section */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Weather Map</h2>
          <WeatherMap />
        </div>
      </div>
    </div>
  );
};
