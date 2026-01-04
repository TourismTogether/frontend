"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Edit2,
  Route,
  Map,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const Profile: React.FC = () => {
  const { user, profile, account } = useAuth();
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalTrips: 0,
    totalPosts: 0,
    totalDiaries: 0,
    tripsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (user && API_URL) {
      fetchProfileData();
    } else if (!user) {
      setLoading(false);
    }
  }, [user, API_URL]);

  const fetchProfileData = async () => {
    if (!API_URL || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user's trips
      let tripsData: any[] = [];
      let routesCount = 0;
      let completedTripsCount = 0;

      try {
        const tripsResponse = await fetch(`${API_URL}/users/${user.id}/trips`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

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

          // Count completed trips
          completedTripsCount = tripsData.filter(
            (trip: any) =>
              trip.status === "completed" || trip.status === "Completed"
          ).length;

          // Fetch routes for all trips to count total routes
          const routesPromises = tripsData.map(async (trip: any) => {
            if (!trip.id) return [];
            try {
              const routesResponse = await fetch(
                `${API_URL}/trips/${trip.id}/routes`
              );
              if (routesResponse.ok) {
                const routesResult = await routesResponse.json();
                const routes = Array.isArray(routesResult)
                  ? routesResult
                  : routesResult.data || [];
                return routes;
              } else if (routesResponse.status === 404) {
                // Trip has no routes yet - this is fine
                return [];
              }
              return [];
            } catch (err) {
              console.error(`Error fetching routes for trip ${trip.id}:`, err);
              return [];
            }
          });

          const allRoutesArrays = await Promise.all(routesPromises);
          routesCount = allRoutesArrays.flat().length;
        } else if (tripsResponse.status === 404) {
          // User has no trips yet - this is fine
          tripsData = [];
        } else {
          console.warn(`Failed to fetch trips: ${tripsResponse.status}`);
        }
      } catch (err) {
        console.error("Error fetching trips:", err);
      }

      // Fetch posts count
      let postsCount = 0;
      try {
        const postsResponse = await fetch(`${API_URL}/posts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (postsResponse.ok) {
          const postsResult = await postsResponse.json();
          const posts = Array.isArray(postsResult.data)
            ? postsResult.data
            : Array.isArray(postsResult)
            ? postsResult
            : [];

          // Filter posts by current user
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
        const diariesResponse = await fetch(`${API_URL}/diaries`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

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
        totalRoutes: routesCount,
        totalTrips: tripsData.length,
        totalPosts: postsCount,
        totalDiaries: diariesCount,
        tripsCompleted: completedTripsCount,
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setStats({
        totalRoutes: 0,
        totalTrips: 0,
        totalPosts: 0,
        totalDiaries: 0,
        tripsCompleted: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="h-32 bg-linear-to-r from-blue-600 to-indigo-600"></div>
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-16 gap-4">
              <div className="flex items-end space-x-4">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                  <span className="text-5xl font-bold text-blue-600">
                    {profile?.username?.charAt(0).toUpperCase() ||
                      user?.full_name?.charAt(0).toUpperCase() ||
                      "U"}
                  </span>
                </div>
                <div className="pb-4">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                    {user?.full_name ||
                      profile?.username ||
                      profile?.full_name ||
                      account?.username ||
                      "User"}
                  </h1>
                  {user?.full_name &&
                    profile?.username &&
                    user.full_name !== profile.username && (
                      <p className="text-gray-600 text-lg mt-1">
                        @{profile.username}
                      </p>
                    )}
                  {!user?.full_name && profile?.username && (
                    <p className="text-gray-600 text-lg mt-1">
                      @{profile.username}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    {user?.created_at && (
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        Joined{" "}
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {user?.phone && (
                      <span className="text-gray-600">{user.phone}</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold">
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>

            {profile?.bio && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 mb-1">
              {stats.totalRoutes}
            </p>
            <p className="text-gray-600 font-medium">Routes Created</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Map className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 mb-1">
              {stats.totalTrips}
            </p>
            <p className="text-gray-600 font-medium">Total Trips</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 mb-1">
              {stats.totalPosts}
            </p>
            <p className="text-gray-600 font-medium">Posts Written</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-4xl font-extrabold text-gray-900 mb-1">
              {stats.totalDiaries}
            </p>
            <p className="text-gray-600 font-medium">Diaries Written</p>
          </div>
        </div>

        {/* Additional Stats Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Trip Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Completed Trips</p>
              <p className="text-3xl font-bold text-green-700">
                {stats.tripsCompleted}
              </p>
            </div>
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-blue-700">
                {stats.totalTrips > 0
                  ? Math.round((stats.tripsCompleted / stats.totalTrips) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
