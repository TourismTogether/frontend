'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Map, Users, BookOpen, TrendingUp, Award, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [routesRes, tripsRes, groupsRes, publicRoutesRes] = await Promise.all([
        supabase.from('routes').select('id', { count: 'exact', head: true }).eq('creator_id', user!.id),
        supabase.from('trips').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('status', 'active'),
        supabase
          .from('routes')
          .select('*, profiles(username, avatar_url)')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      setStats({
        totalRoutes: routesRes.count || 0,
        totalTrips: tripsRes.count || 0,
        activeGroups: groupsRes.count || 0,
        totalPoints: profile?.points || 0,
      });

      setRecentRoutes(publicRoutesRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Map, label: 'My Routes', value: stats.totalRoutes, color: 'bg-blue-500', link: '/routes' },
    { icon: Users, label: 'Active Groups', value: stats.activeGroups, color: 'bg-purple-500', link: '/groups' },
    { icon: BookOpen, label: 'My Trips', value: stats.totalTrips, color: 'bg-orange-500', link: '/trips' },
    { icon: Award, label: 'Total Points', value: stats.totalPoints, color: 'bg-yellow-500', link: '/profile' },
  ];

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back, {profile?.username}!</h1>
          <p className="text-gray-600 mt-2">Ready for your next adventure?</p>
          <p>hehe</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
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
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Popular Routes</h2>
              <Link href="/routes" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentRoutes.map((route) => (
                <Link
                  key={route.id}
                  href={`/routes/${route.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{route.title}</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {route.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{route.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{route.duration_days} days</span>
                    <span>{route.distance_km} km</span>
                    <span className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {route.view_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/routes/new"
                className="flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-800">Create New Route</span>
              </Link>
              <Link
                href="/groups/new"
                className="flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-800">Create Travel Group</span>
              </Link>
              <Link
                href="/trips/new"
                className="flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-800">Plan New Trip</span>
              </Link>
              <Link
                href="/forum"
                className="flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-800">Start Discussion</span>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
              <h3 className="font-bold mb-2">Your Rank: {profile?.rank}</h3>
              <div className="flex items-center justify-between text-sm">
                <span>Level Progress</span>
                <span>{profile?.points} pts</span>
              </div>
              <div className="w-full bg-green-700 rounded-full h-2 mt-2">
                <div
                  className="bg-white rounded-full h-2"
                  style={{ width: `${Math.min((profile?.points / 1000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
