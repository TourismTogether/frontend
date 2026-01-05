"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Edit2,
  Route,
  Map,
  MessageSquare,
  BookOpen,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { EditProfileModal } from "./EditProfileModal";

export const Profile: React.FC = () => {
  const { user, profile, account } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalTrips: 0,
    totalPosts: 0,
    totalDiaries: 0,
    tripsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Update local profile when context profile changes
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (user && API_URL) {
      fetchProfileData();
    } else if (!user) {
      setLoading(false);
    }
  }, [user, API_URL, profile]);

  const handleProfileUpdated = async () => {
    // Refetch updated user and traveller data
    if (API_URL && user?.id) {
      try {
        // Fetch updated user data
        const userResponse = await fetch(`${API_URL}/users/${user.id}`, {
          credentials: "include",
        });
        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const updatedUser = userResult.data || userResult;

          // Fetch updated traveller data
          const travellerResponse = await fetch(
            `${API_URL}/travellers/${user.id}`,
            {
              credentials: "include",
            }
          );

          if (travellerResponse.ok) {
            const travellerResult = await travellerResponse.json();
            const travellerData = travellerResult.data || {};

            // Update local profile state with fresh data
            setLocalProfile({
              ...updatedUser,
              ...travellerData,
              email: account?.email || profile?.email,
            });
          } else {
            // If traveller fetch fails, just update with user data
            setLocalProfile({
              ...updatedUser,
              email: account?.email || profile?.email,
            });
          }
        }
      } catch (err) {
        console.error("Error refetching profile data:", err);
      }
    }

    // Refetch profile stats after update
    await fetchProfileData();
  };

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

  const completionRate =
    stats.totalTrips > 0
      ? Math.round((stats.tripsCompleted / stats.totalTrips) * 100)
      : 0;

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Profile Header Card - Redesigned */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8 relative">
            {/* Gradient Header Background */}
            <div className="h-40 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"></div>
            </div>

            <div className="px-6 sm:px-8 pb-8 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-20 gap-6">
                {/* Avatar and Info Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 flex-1">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-36 h-36 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                      {localProfile?.avatar_url || profile?.avatar_url ? (
                        <img
                          src={localProfile?.avatar_url || profile?.avatar_url}
                          alt="Profile"
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-6xl font-bold text-white">
                          {localProfile?.username?.charAt(0).toUpperCase() ||
                            profile?.username?.charAt(0).toUpperCase() ||
                            localProfile?.full_name?.charAt(0).toUpperCase() ||
                            user?.full_name?.charAt(0).toUpperCase() ||
                            account?.username?.charAt(0).toUpperCase() ||
                            "U"}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="pb-2">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">
                      {localProfile?.full_name ||
                        user?.full_name ||
                        profile?.full_name ||
                        localProfile?.username ||
                        profile?.username ||
                        account?.username ||
                        "User"}
                    </h1>
                    {(localProfile?.username ||
                      profile?.username ||
                      account?.username) && (
                      <p className="text-gray-500 text-lg font-medium mb-3">
                        @
                        {localProfile?.username ||
                          profile?.username ||
                          account?.username}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {user?.created_at && (
                        <span className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                          <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                          Joined{" "}
                          {new Date(user.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      )}
                      {user?.phone && (
                        <span className="text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold group"
                >
                  <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Bio Section */}
              {(localProfile?.bio || profile?.bio) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {localProfile?.bio || profile?.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Grid - Redesigned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-blue-700 mb-0">
                    {stats.totalRoutes}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 font-semibold">Routes Created</p>
              <p className="text-xs text-gray-500 mt-1">Total routes planned</p>
            </div>

            <div className="bg-linear-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-green-700 mb-0">
                    {stats.totalTrips}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 font-semibold">Total Trips</p>
              <p className="text-xs text-gray-500 mt-1">All your adventures</p>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 border border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-purple-700 mb-0">
                    {stats.totalPosts}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 font-semibold">Posts Written</p>
              <p className="text-xs text-gray-500 mt-1">Share your stories</p>
            </div>

            <div className="bg-linear-to-br from-orange-50 to-amber-100 rounded-2xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500 rounded-xl group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-orange-700 mb-0">
                    {stats.totalDiaries}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 font-semibold">Diaries Written</p>
              <p className="text-xs text-gray-500 mt-1">Your travel memories</p>
            </div>
          </div>

          {/* Trip Statistics Card - Redesigned */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Trip Statistics
              </h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full -mr-12 -mt-12 opacity-20"></div>
                <div className="relative">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Completed Trips
                  </p>
                  <p className="text-5xl font-extrabold text-green-700 mb-2">
                    {stats.tripsCompleted}
                  </p>
                  <p className="text-xs text-gray-500">
                    Out of {stats.totalTrips} total trips
                  </p>
                </div>
              </div>
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-20"></div>
                <div className="relative">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Completion Rate
                  </p>
                  <p className="text-5xl font-extrabold text-blue-700 mb-2">
                    {completionRate}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-linear-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  );
};
