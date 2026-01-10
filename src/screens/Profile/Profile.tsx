"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Edit2,
  Route,
  Map,
  MessageSquare,
  BookOpen,
  Trophy,
  TrendingUp,
  User,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { EditProfileModal } from "./EditProfileModal";
import { API_ENDPOINTS, getTravelImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Loading from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";
import { ANIMATIONS } from "../../constants/animations";
import PulseGlow from "../../components/Animations/PulseGlow";

interface ProfileStats {
  totalRoutes: number;
  totalTrips: number;
  totalPosts: number;
  totalDiaries: number;
  tripsCompleted: number;
}

interface Trip {
  id: string | number;
  status: string;
}

interface TripApiResponse {
  data?: Trip | Trip[];
  status?: number;
}

interface Post {
  user_id?: string | number;
  traveller_id?: string | number;
}

interface PostApiResponse {
  data?: Post[];
  status?: number;
}

interface Diary {
  user_id?: string | number;
}

interface DiaryApiResponse {
  data?: Diary[];
  status?: number;
}

interface RouteApiResponse {
  data?: unknown[];
  status?: number;
}

export const Profile: React.FC = () => {
  const { user, profile, account } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [stats, setStats] = useState<ProfileStats>({
    totalRoutes: 0,
    totalTrips: 0,
    totalPosts: 0,
    totalDiaries: 0,
    tripsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const handleProfileUpdated = async () => {
    if (user?.id) {
      try {
        const userResponse = await fetch(API_ENDPOINTS.USERS.BY_ID(Number(user.id)), {
          credentials: "include",
        });
        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const updatedUser = userResult.data || userResult;

          const travellerResponse = await fetch(
            `${API_ENDPOINTS.USERS.BASE}/${user.id}/travellers`,
            {
              credentials: "include",
            }
          );

          if (travellerResponse.ok) {
            const travellerResult = await travellerResponse.json();
            const travellerData = travellerResult.data || {};

            setLocalProfile({
              ...updatedUser,
              ...travellerData,
              email: account?.email || profile?.email,
            });
          } else {
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

    await fetchProfileData();
  };

  const fetchProfileData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let tripsData: Trip[] = [];
      let routesCount = 0;
      let completedTripsCount = 0;

      try {
        if (!user.id || user.id === "NaN" || user.id === "undefined") {
          console.error("Invalid user.id:", user.id);
          tripsData = [];
          routesCount = 0;
          completedTripsCount = 0;
        } else {
          const tripsResponse = await fetch(
            API_ENDPOINTS.USERS.BY_ID(String(user.id)) + "/trips",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (tripsResponse.ok) {
            const tripsResult: TripApiResponse = await tripsResponse.json();

            if (Array.isArray(tripsResult)) {
              tripsData = tripsResult;
            } else if (tripsResult.data && Array.isArray(tripsResult.data)) {
              tripsData = tripsResult.data;
            } else if (tripsResult.data && !Array.isArray(tripsResult.data)) {
              tripsData = [tripsResult.data];
            }

            completedTripsCount = tripsData.filter(
              (trip) =>
                trip.status === "completed" || trip.status === "Completed"
            ).length;

            const routesPromises = tripsData.map(async (trip) => {
              if (!trip.id) return [];
              try {
                const routesResponse = await fetch(
                  API_ENDPOINTS.TRIPS.ROUTES(String(trip.id)),
                  { credentials: "include" }
                );
                if (routesResponse.ok) {
                  const routesResult: RouteApiResponse = await routesResponse.json();
                  const routes = Array.isArray(routesResult)
                    ? routesResult
                    : Array.isArray(routesResult.data)
                    ? routesResult.data
                    : [];
                  return routes;
                } else if (routesResponse.status === 404) {
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
            tripsData = [];
          } else {
            console.warn(`Failed to fetch trips: ${tripsResponse.status}`);
          }
        }
      } catch (err) {
        console.error("Error fetching trips:", err);
      }

      let postsCount = 0;
      try {
        const postsResponse = await fetch(API_ENDPOINTS.FORUM.POSTS.BASE, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (postsResponse.ok) {
          const postsResult: PostApiResponse = await postsResponse.json();
          const posts: Post[] = Array.isArray(postsResult.data)
            ? postsResult.data
            : Array.isArray(postsResult)
            ? postsResult
            : [];

          postsCount = posts.filter(
            (p) => String(p.user_id) === String(user.id) || String(p.traveller_id) === String(user.id)
          ).length;
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      }

      let diariesCount = 0;
      try {
        const diariesResponse = await fetch(API_ENDPOINTS.DIARIES.BASE, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (diariesResponse.ok) {
          const diariesResult: DiaryApiResponse = await diariesResponse.json();
          const diaries: Diary[] = Array.isArray(diariesResult.data)
            ? diariesResult.data
            : Array.isArray(diariesResult)
            ? diariesResult
            : [];

          diariesCount = diaries.filter(
            (d) => String(d.user_id) === String(user.id)
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
    return <Loading type="profile" />;
  }

  const completionRate =
    stats.totalTrips > 0
      ? Math.round((stats.tripsCompleted / stats.totalTrips) * 100)
      : 0;

  const displayName =
    localProfile?.full_name ||
    user?.full_name ||
    profile?.full_name ||
    localProfile?.username ||
    profile?.username ||
    account?.username ||
    "User";

  const displayUsername =
    localProfile?.username || profile?.username || account?.username;

  const avatarUrl = localProfile?.avatar_url || profile?.avatar_url;
  const bio = localProfile?.bio || profile?.bio;

  return (
    <>
      <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
        {/* Hero Section */}
        <Hero
          title={`${displayName}'s Profile`}
          description={user?.email || ""}
          imageKeyword={displayName}
        />

        <div className="max-w-7xl mx-auto px-4 py-8 relative z-20">
          {/* Profile Header Card */}
          <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-3xl shadow-xl overflow-hidden mb-8 relative`}>
            <div className={`h-40 ${GRADIENTS.PRIMARY} relative`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent"></div>
            </div>

            <div className="px-6 sm:px-8 pb-8 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-20 gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 flex-1">
                  {/* Avatar */}
                  <div className={`relative ${ANIMATIONS.FADE.IN_UP}`}>
                    <PulseGlow variant="glow" className={`w-36 h-36 ${GRADIENTS.PRIMARY} rounded-2xl border-4 border-card shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300 overflow-hidden`}>
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Profile"
                          width={144}
                          height={144}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-6xl font-bold text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </PulseGlow>
                    <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${COLORS.PRIMARY.DEFAULT} rounded-full border-4 border-card shadow-lg flex items-center justify-center ${ANIMATIONS.PULSE.GENTLE}`}>
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className={`pb-2 ${ANIMATIONS.FADE.IN_UP}`} style={{ animationDelay: "0.2s" }}>
                    <h1 className={`text-4xl sm:text-5xl font-extrabold ${COLORS.TEXT.DEFAULT} mb-2`}>
                      {displayName}
                    </h1>
                    {displayUsername && (
                      <p className={`${COLORS.TEXT.MUTED} text-lg font-medium mb-3`}>
                        @{displayUsername}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {user?.created_at && (
                        <span className={`flex items-center ${COLORS.TEXT.MUTED} ${COLORS.BACKGROUND.MUTED} px-3 py-1.5 rounded-full`}>
                          <Calendar className="w-4 h-4 mr-1.5" />
                          Joined{" "}
                          {new Date(user.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {user?.phone && (
                        <span className={`${COLORS.TEXT.MUTED} ${COLORS.BACKGROUND.MUTED} px-3 py-1.5 rounded-full`}>
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className={`flex items-center space-x-2 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold group ${ANIMATIONS.PULSE.GLOW}`}
                >
                  <Edit2 className={`w-4 h-4 group-hover:rotate-12 transition-transform ${ANIMATIONS.ROTATE.MEDIUM}`} />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Bio Section */}
              {bio && (
                <div className={`mt-8 pt-6 border-t ${COLORS.BORDER.DEFAULT}`}>
                  <p className={`${COLORS.TEXT.DEFAULT} leading-relaxed text-lg`}>
                    {bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${ANIMATIONS.FADE.IN_UP}`} style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between mb-4">
                <PulseGlow variant="glow" className={`p-3 ${GRADIENTS.PRIMARY} rounded-xl group-hover:scale-110 transition-transform ${ANIMATIONS.ROTATE.SLOW}`}>
                  <Route className="w-6 h-6 text-white" />
                </PulseGlow>
                <div className="text-right">
                  <p className={`text-3xl font-extrabold ${COLORS.TEXT.PRIMARY} mb-0`}>
                    {stats.totalRoutes}
                  </p>
                </div>
              </div>
              <p className={`${COLORS.TEXT.DEFAULT} font-semibold`}>Routes Created</p>
              <p className={`text-xs ${COLORS.TEXT.MUTED} mt-1`}>Total routes planned</p>
            </div>

            <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${ANIMATIONS.FADE.IN_UP}`} style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between mb-4">
                <PulseGlow variant="glow" className={`p-3 ${GRADIENTS.PRIMARY} rounded-xl group-hover:scale-110 transition-transform ${ANIMATIONS.ROTATE.SLOW}`}>
                  <Map className="w-6 h-6 text-white" />
                </PulseGlow>
                <div className="text-right">
                  <p className={`text-3xl font-extrabold ${COLORS.TEXT.PRIMARY} mb-0`}>
                    {stats.totalTrips}
                  </p>
                </div>
              </div>
              <p className={`${COLORS.TEXT.DEFAULT} font-semibold`}>Total Trips</p>
              <p className={`text-xs ${COLORS.TEXT.MUTED} mt-1`}>All your adventures</p>
            </div>

            <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${ANIMATIONS.FADE.IN_UP}`} style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-4">
                <PulseGlow variant="glow" className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </PulseGlow>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-purple-700 mb-0">
                    {stats.totalPosts}
                  </p>
                </div>
              </div>
              <p className={`${COLORS.TEXT.DEFAULT} font-semibold`}>Posts Written</p>
              <p className={`text-xs ${COLORS.TEXT.MUTED} mt-1`}>Share your stories</p>
            </div>

            <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${ANIMATIONS.FADE.IN_UP}`} style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-between mb-4">
                <PulseGlow variant="glow" className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </PulseGlow>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-orange-700 mb-0">
                    {stats.totalDiaries}
                  </p>
                </div>
              </div>
              <p className={`${COLORS.TEXT.DEFAULT} font-semibold`}>Diaries Written</p>
              <p className={`text-xs ${COLORS.TEXT.MUTED} mt-1`}>Your travel memories</p>
            </div>
          </div>

          {/* Trip Statistics Card */}
          <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-2xl shadow-xl p-8 mb-8`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT} flex items-center gap-2`}>
                <Trophy className="w-6 h-6 text-yellow-500" />
                Trip Statistics
              </h2>
              <TrendingUp className={`w-5 h-5 ${COLORS.TEXT.MUTED}`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className={`${COLORS.PRIMARY.LIGHT} rounded-xl p-6 ${COLORS.BORDER.PRIMARY} border-2 relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-24 h-24 ${COLORS.PRIMARY.LIGHT} rounded-full -mr-12 -mt-12 opacity-20`}></div>
                <div className="relative">
                  <p className={`text-sm font-semibold ${COLORS.TEXT.MUTED} mb-2 uppercase tracking-wide`}>
                    Completed Trips
                  </p>
                  <p className={`text-5xl font-extrabold ${COLORS.TEXT.PRIMARY} mb-2`}>
                    {stats.tripsCompleted}
                  </p>
                  <p className={`text-xs ${COLORS.TEXT.MUTED}`}>
                    Out of {stats.totalTrips} total trips
                  </p>
                </div>
              </div>
              <div className={`${COLORS.BACKGROUND.MUTED} rounded-xl p-6 ${COLORS.BORDER.DEFAULT} border-2 relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-24 h-24 ${COLORS.BACKGROUND.SECONDARY} rounded-full -mr-12 -mt-12 opacity-20`}></div>
                <div className="relative">
                  <p className={`text-sm font-semibold ${COLORS.TEXT.MUTED} mb-2 uppercase tracking-wide`}>
                    Completion Rate
                  </p>
                  <p className={`text-5xl font-extrabold ${COLORS.TEXT.DEFAULT} mb-2`}>
                    {completionRate}%
                  </p>
                  <div className={`w-full ${COLORS.BACKGROUND.SECONDARY} rounded-full h-2 mt-3`}>
                    <div
                      className={`${GRADIENTS.PRIMARY} h-2 rounded-full transition-all duration-500`}
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
