'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Award, Calendar, Edit2, Trophy, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    routesCreated: 0,
    tripsCompleted: 0,
    groupsJoined: 0,
    reviewsWritten: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const [achievementsRes, routesRes, tripsRes, groupsRes, reviewsRes] = await Promise.all([
        supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user!.id)
          .order('earned_at', { ascending: false }),
        supabase.from('routes').select('id', { count: 'exact', head: true }).eq('creator_id', user!.id),
        supabase
          .from('trips')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('status', 'completed'),
        supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('status', 'active'),
        supabase.from('destination_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      ]);

      setAchievements(achievementsRes.data || []);
      setStats({
        routesCreated: routesRes.count || 0,
        tripsCompleted: tripsRes.count || 0,
        groupsJoined: groupsRes.count || 0,
        reviewsWritten: reviewsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'bronze':
        return 'from-orange-400 to-orange-600';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'platinum':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className={`h-32 bg-gradient-to-r ${getRankColor(profile?.rank || 'bronze')}`}></div>
          <div className="px-6 pb-6">
            <div className="flex items-start justify-between -mt-16">
              <div className="flex items-end space-x-4">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-green-600">
                    {profile?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="pb-4">
                  <h1 className="text-3xl font-bold text-gray-800">{profile?.username}</h1>
                  {profile?.full_name && (
                    <p className="text-gray-600">{profile.full_name}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    {profile?.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {profile.location}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {new Date(profile?.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button className="mt-4 flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>

            {profile?.bio && (
              <div className="mt-6">
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Adventure Rank</p>
                    <p className="text-2xl font-bold capitalize">{profile?.rank}</p>
                  </div>
                  <Trophy className="w-10 h-10 opacity-80" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Points</p>
                    <p className="text-2xl font-bold">{profile?.points}</p>
                  </div>
                  <Star className="w-10 h-10 opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.routesCreated}</p>
            <p className="text-gray-600 mt-2">Routes Created</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.tripsCompleted}</p>
            <p className="text-gray-600 mt-2">Trips Completed</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.groupsJoined}</p>
            <p className="text-gray-600 mt-2">Groups Joined</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-3xl font-bold text-orange-600">{stats.reviewsWritten}</p>
            <p className="text-gray-600 mt-2">Reviews Written</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Achievements</h2>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{achievement.achievement_name}</h3>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-green-600 mt-1">+{achievement.points_earned} points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No achievements yet. Start your adventure to earn badges!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
