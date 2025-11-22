'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, DollarSign, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const Trips: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, routes(title)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-700';
      case 'ongoing':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
            <p className="text-gray-600 mt-2">Manage your travel plans and budgets</p>
          </div>
          <Link
            href="/trips/new"
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Plan New Trip</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{trip.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{trip.description}</p>

              <div className="space-y-2 mb-4">
                {trip.start_date && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(trip.start_date).toLocaleDateString()} -{' '}
                    {trip.end_date ? new Date(trip.end_date).toLocaleDateString() : 'TBD'}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {trip.spent_amount} / {trip.total_budget} {trip.currency}
                </div>
                {trip.routes && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    Route: {trip.routes.title}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 rounded-full h-2"
                    style={{
                      width: `${Math.min((trip.spent_amount / trip.total_budget) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {((trip.spent_amount / trip.total_budget) * 100).toFixed(0)}% of budget used
                </p>
              </div>
            </Link>
          ))}
        </div>

        {trips.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No trips yet</h3>
            <p className="text-gray-500">Start planning your next adventure!</p>
          </div>
        )}
      </div>
    </div>
  );
};
