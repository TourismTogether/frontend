"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Map,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Plus,
  Plane,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { WeatherMap } from "../../components/Map/WeatherMap";
import { CreateRouteModal } from "../Routes/CreateRouteModal";
import { CreateTripModal } from "../Trips/CreateTripModal";
import { CreatePostModal } from "../Forum/CreatePostModal";

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalTrips: 0,
    activeGroups: 0,
    totalPoints: 0,
  });
  const [recentRoutes, setRecentRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
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
      // Get user's id_user from account
      const { data: accountData } = await supabase
        .from("account")
        .select("id_user")
        .eq("email", user!.email || "")
        .maybeSingle();

      if (!accountData?.id_user) {
        setLoading(false);
        return;
      }

      const idUser = accountData.id_user;

      // Get routes count - routes belong to trips, so count routes for user's trips
      const { data: userTrips } = await supabase
        .from("join_trip")
        .select("id_trip")
        .eq("id_user", idUser);

      const tripIds = userTrips?.map((t) => t.id_trip) || [];

      const routesRes =
        tripIds.length > 0
          ? await supabase
              .from("routes")
              .select("uuid", { count: "exact", head: true })
              .in("id_trip", tripIds)
          : { count: 0 };

      // Get trips count - trips user has joined
      const tripsRes = await supabase
        .from("join_trip")
        .select("uuid", { count: "exact", head: true })
        .eq("id_user", idUser);

      // Get groups count
      const { count: groupsCount } = await supabase
        .from("group_member")
        .select("uuid", { count: "exact", head: true })
        .eq("id_user", idUser);

      // Get recent routes from trips user has joined
      const publicRoutesRes =
        tripIds.length > 0
          ? await supabase
              .from("routes")
              .select("*, trip(id_trip, title)")
              .in("id_trip", tripIds)
              .order("created_at", { ascending: false })
              .limit(6)
          : { data: [] };

      setStats({
        totalRoutes: routesRes.count || 0,
        totalTrips: tripsRes.count || 0,
        activeGroups: groupsCount || 0,
        totalPoints: profile?.points || 0,
      });

      // Transform routes data to match expected format
      const transformedRoutes = (publicRoutesRes.data || []).map(
        (route: any) => ({
          ...route,
          id: route.uuid,
          difficulty: route.trip?.difficult || "moderate",
          duration_days: null,
          distance_km: route.trip?.distance || 0,
          view_count: 0,
          profiles: {
            username: profile?.username || "user",
            avatar_url: profile?.avatar_url || null,
          },
        })
      );

      setRecentRoutes(transformedRoutes);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Map,
      label: "My Routes",
      value: stats.totalRoutes,
      color: "bg-routes",
      link: "/routes",
    },
    {
      icon: Users,
      label: "Active Groups",
      value: stats.activeGroups,
      color: "bg-region",
      link: "/groups",
    },
    {
      icon: BookOpen,
      label: "My Trips",
      value: stats.totalTrips,
      color: "bg-trip",
      link: "/trips",
    },
    {
      icon: Award,
      label: "Total Points",
      value: stats.totalPoints,
      color: "bg-trip",
      link: "/profile",
    },
  ];

  const quickActions = [
    {
      icon: Map,
      label: "Create New Route",
      color: "routes",
      onClick: () => setShowCreateRoute(true),
    },
    {
      icon: Users,
      label: "Create Travel Group",
      color: "region",
      onClick: () => setShowCreateGroup(true),
    },
    {
      icon: Plane,
      label: "Plan New Trip",
      color: "trip",
      onClick: () => setShowCreateTrip(true),
    },
    {
      icon: MessageSquare,
      label: "Start Discussion",
      color: "post",
      onClick: () => setShowCreatePost(true),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-traveller"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.username}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Ready for your next adventure?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.link}
                className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-card rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">
                Popular Routes
              </h2>
              <Link
                href="/routes"
                className="text-routes hover:text-routes/80 text-sm font-medium"
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
                    className="border border-border rounded-lg p-4 hover:border-routes transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">
                        {route.title}
                      </h3>
                      <span className="text-xs bg-routes/20 text-routes px-2 py-1 rounded">
                        {route.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {route.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{route.duration_days || "N/A"} days</span>
                      <span>{route.distance_km || 0} km</span>
                      <span className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {route.view_count || 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No routes yet</p>
                <button
                  onClick={() => setShowCreateRoute(true)}
                  className="px-4 py-2 bg-routes hover:bg-routes/90 text-white rounded-lg transition-colors text-sm"
                >
                  Create Your First Route
                </button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={`w-full flex items-center space-x-3 p-3 bg-${action.color}/10 hover:bg-${action.color}/20 rounded-lg transition-colors text-left`}
                  >
                    <Plus className={`w-5 h-5 text-${action.color}`} />
                    <span className="text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-traveller to-traveller/80 rounded-lg text-white">
              <h3 className="font-bold mb-2">
                Your Rank: {profile?.rank || "Beginner"}
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span>Level Progress</span>
                <span>{profile?.points || 0} pts</span>
              </div>
              <div className="w-full bg-traveller/30 rounded-full h-2 mt-2">
                <div
                  className="bg-white rounded-full h-2"
                  style={{
                    width: `${Math.min(
                      ((profile?.points || 0) / 1000) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Map Section */}
        <div className="mb-8">
          <WeatherMap />
        </div>
      </div>

      {/* Modals */}
      {showCreateRoute && (
        <CreateRouteModal
          onClose={() => setShowCreateRoute(false)}
          onRouteCreated={() => {
            fetchDashboardData();
            setShowCreateRoute(false);
          }}
        />
      )}

      {showCreateTrip && (
        <CreateTripModal
          onClose={() => setShowCreateTrip(false)}
          onTripCreated={() => {
            fetchDashboardData();
            setShowCreateTrip(false);
          }}
        />
      )}

      {/* {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={() => {
            fetchDashboardData();
            setShowCreateGroup(false);
          }}
        />
      )} */}

      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onPostCreated={() => {
            setShowCreatePost(false);
          }}
        />
      )}
    </div>
  );
};
