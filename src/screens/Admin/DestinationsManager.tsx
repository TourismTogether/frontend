'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Star,
  X,
  Save,
  Search,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Destination {
  id: string;
  name: string;
  country: string;
  region_name: string;
  latitude: number;
  longitude: number;
  category: string;
  best_season: string;
  average_rating: number;
  total_reviews: number;
  images: string[];
}

const CATEGORIES = [
  'Beach',
  'Mountain',
  'City',
  'Historical',
  'Nature',
  'Adventure',
  'Cultural',
  'Island',
  'Desert',
  'Other'
];

const SEASONS = [
  'Spring',
  'Summer',
  'Autumn',
  'Winter',
  'Year-round'
];

export const DestinationsManager: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    region_name: '',
    latitude: 0,
    longitude: 0,
    category: '',
    best_season: '',
    images: [] as string[]
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/destinations`, {
        credentials: 'include'
      });
      const result = await res.json();
      if (result.status === 200) {
        setDestinations(result.data);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDestination(null);
    setFormData({
      name: '',
      country: '',
      region_name: '',
      latitude: 0,
      longitude: 0,
      category: '',
      best_season: '',
      images: []
    });
    setShowModal(true);
  };

  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination);
    setFormData({
      name: destination.name,
      country: destination.country || '',
      region_name: destination.region_name || '',
      latitude: destination.latitude || 0,
      longitude: destination.longitude || 0,
      category: destination.category || '',
      best_season: destination.best_season || '',
      images: destination.images || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa destination này?')) return;

    try {
      const res = await fetch(`${API_URL}/destinations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchDestinations();
      }
    } catch {
      // Handle error silently
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDestination) {
        // Update
        await fetch(`${API_URL}/destinations/${editingDestination.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
      } else {
        // Create
        await fetch(`${API_URL}/destinations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchDestinations();
    } catch {
      // Handle error silently
    }
  };

  const filteredDestinations = destinations.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Destinations</h2>
          <p className="text-gray-500 text-sm">Quản lý các điểm đến du lịch</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDestinations}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm Destination
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, quốc gia hoặc danh mục..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDestinations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Chưa có destination nào
          </div>
        ) : (
          filteredDestinations.map((destination) => (
            <div
              key={destination.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="h-40 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                {destination.images?.[0] ? (
                  <img
                    src={destination.images[0]}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MapPin className="w-12 h-12 text-white/80" />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{destination.name}</h3>
                    <p className="text-sm text-gray-500">
                      {destination.country} {destination.region_name && `• ${destination.region_name}`}
                    </p>
                  </div>
                  {destination.category && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {destination.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span>{destination.average_rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-400 ml-1">
                      ({destination.total_reviews || 0} reviews)
                    </span>
                  </div>
                  {destination.best_season && (
                    <span className="text-gray-400">{destination.best_season}</span>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                  <button
                    onClick={() => handleEdit(destination)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(destination.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingDestination ? 'Chỉnh sửa Destination' : 'Thêm Destination mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên điểm đến *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quốc gia
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vùng/Khu vực
                  </label>
                  <input
                    type="text"
                    value={formData.region_name}
                    onChange={(e) => setFormData({ ...formData, region_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mùa tốt nhất
                  </label>
                  <select
                    value={formData.best_season}
                    onChange={(e) => setFormData({ ...formData, best_season: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">-- Chọn mùa --</option>
                    {SEASONS.map((season) => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Hình ảnh (cách nhau bằng dấu phẩy)
                </label>
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.images.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      images: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingDestination ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

