'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Stopover {
  location_name: string;
  latitude: string;
  longitude: string;
  description: string;
  estimated_duration_hours: string;
}

export const CreateRoute: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'moderate',
    duration_days: '',
    distance_km: '',
    start_location: '',
    end_location: '',
    tags: '',
    is_public: true,
  });
  const [stopovers, setStopovers] = useState<Stopover[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .insert([
          {
            creator_id: user!.id,
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            duration_days: parseInt(formData.duration_days) || null,
            distance_km: parseFloat(formData.distance_km) || null,
            start_location: formData.start_location,
            end_location: formData.end_location,
            tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
            is_public: formData.is_public,
          },
        ])
        .select()
        .single();

      if (routeError) throw routeError;

      if (stopovers.length > 0) {
        const stopoverData = stopovers.map((stopover, index) => ({
          route_id: routeData.id,
          order_index: index + 1,
          location_name: stopover.location_name,
          latitude: parseFloat(stopover.latitude),
          longitude: parseFloat(stopover.longitude),
          description: stopover.description,
          estimated_duration_hours: parseFloat(stopover.estimated_duration_hours) || null,
        }));

        const { error: stopoverError } = await supabase.from('route_stopovers').insert(stopoverData);

        if (stopoverError) throw stopoverError;
      }

      router.push(`/routes/${routeData.id}`);
    } catch (error: any) {
      console.error('Error creating route:', error);
      alert(error.message || 'Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  const addStopover = () => {
    setStopovers([
      ...stopovers,
      {
        location_name: '',
        latitude: '',
        longitude: '',
        description: '',
        estimated_duration_hours: '',
      },
    ]);
  };

  const removeStopover = (index: number) => {
    setStopovers(stopovers.filter((_, i) => i !== index));
  };

  const updateStopover = (index: number, field: keyof Stopover, value: string) => {
    const updated = [...stopovers];
    updated[index][field] = value;
    setStopovers(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Route</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">Route Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Duration (days)</label>
              <input
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={formData.distance_km}
                onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Start Location</label>
              <input
                type="text"
                value={formData.start_location}
                onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">End Location</label>
              <input
                type="text"
                value={formData.end_location}
                onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="hiking, camping, mountain"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Make this route public</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Stopovers</h3>
              <button
                type="button"
                onClick={addStopover}
                className="flex items-center space-x-1 text-green-600 hover:text-green-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Stopover</span>
              </button>
            </div>

            {stopovers.map((stopover, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 mb-4 relative">
                <button
                  type="button"
                  onClick={() => removeStopover(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Location Name
                    </label>
                    <input
                      type="text"
                      value={stopover.location_name}
                      onChange={(e) => updateStopover(index, 'location_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={stopover.latitude}
                      onChange={(e) => updateStopover(index, 'latitude', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={stopover.longitude}
                      onChange={(e) => updateStopover(index, 'longitude', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={stopover.description}
                      onChange={(e) => updateStopover(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={stopover.estimated_duration_hours}
                      onChange={(e) =>
                        updateStopover(index, 'estimated_duration_hours', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/routes')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
