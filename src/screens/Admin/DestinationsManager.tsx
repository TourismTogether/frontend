"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
  Image as ImageIcon,
} from "lucide-react";

// Dynamically import LocationPicker to avoid SSR issues
const LocationPicker = dynamic(
  () =>
    import("../../components/Map/LocationPicker").then(
      (mod) => mod.LocationPicker
    ),
  { ssr: false }
);

import Image from "next/image";
import { API_ENDPOINTS, getDestinationImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";

interface Destination {
  id: string;
  name: string;
  country: string;
  region_name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category: string;
  best_season: string;
  average_rating: number;
  total_reviews: number;
  images: string[];
}

const CATEGORIES = [
  "Beach",
  "Mountain",
  "City",
  "Historical",
  "Nature",
  "Adventure",
  "Cultural",
  "Island",
  "Desert",
  "Other",
];

const SEASONS = ["Spring", "Summer", "Autumn", "Winter", "Year-round"];

interface Region {
  id: string;
  address: string;
}

export const DestinationsManager: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDestination, setEditingDestination] =
    useState<Destination | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    region_id: "",
    region_name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    category: "",
    best_season: "",
    images: [] as string[],
  });

  useEffect(() => {
    fetchDestinations();
    fetchRegions();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.DESTINATIONS.BASE, {
        credentials: "include",
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

  const fetchRegions = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.REGIONS.BASE, {
        credentials: "include",
      });
      const result = await res.json();
      if (result.status === 200) {
        setRegions(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  const handleCreate = () => {
    setEditingDestination(null);
    fetchRegions(); // Refresh regions list
    setFormData({
      name: "",
      country: "",
      region_id: "",
      region_name: "",
      description: "",
      latitude: 10.762880383009653, // Default to Ho Chi Minh City
      longitude: 106.6824797006774,
      category: "",
      best_season: "",
      images: [],
    });
    setShowModal(true);
  };

  const handleEdit = async (destination: Destination) => {
    setEditingDestination(destination);
    // Refresh regions list before editing
    const res = await fetch(API_ENDPOINTS.REGIONS.BASE, {
      credentials: "include",
    });
    const result = await res.json();
    const updatedRegions = result.status === 200 ? result.data || [] : [];
    setRegions(updatedRegions);

    // Find region_id from region_name using fresh data
    const matchedRegion = updatedRegions.find(
      (r: Region) => r.address === destination.region_name
    );
    setFormData({
      name: destination.name,
      country: destination.country || "",
      region_id: matchedRegion?.id || "",
      region_name: destination.region_name || "",
      description: destination.description || "",
      latitude: destination.latitude || 10.762880383009653,
      longitude: destination.longitude || 106.6824797006774,
      category: destination.category || "",
      best_season: destination.best_season || "",
      images: destination.images || [],
    });
    setShowModal(true);
  };

  const handleRegionChange = (regionId: string) => {
    const selectedRegion = regions.find((r) => r.id === regionId);
    setFormData({
      ...formData,
      region_id: regionId,
      region_name: selectedRegion?.address || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa destination này?")) return;

    try {
      const res = await fetch(API_ENDPOINTS.DESTINATIONS.DELETE(Number(id)), {
        method: "DELETE",
        credentials: "include",
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
      // Validate region_id
      if (!formData.region_id) {
        alert("Vui lòng chọn khu vực.");
        return;
      }

      // Prepare destination data
      const destinationData: {
        name: string;
        country: string;
        description: string;
        latitude: number;
        longitude: number;
        category: string;
        best_season: string;
        images: string[];
        rating: number;
        region_id: string;
      } = {
        name: formData.name,
        country: formData.country || "",
        description: formData.description || "",
        latitude: formData.latitude,
        longitude: formData.longitude,
        category: formData.category || "",
        best_season: formData.best_season || "",
        images: formData.images || [],
        rating: 0,
        region_id: formData.region_id,
      };

      let response: Response;
      if (editingDestination) {
        // Update
        response = await fetch(
          API_ENDPOINTS.DESTINATIONS.UPDATE(Number(editingDestination.id)),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(destinationData),
          }
        );
      } else {
        // Create
        response = await fetch(API_ENDPOINTS.DESTINATIONS.CREATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(destinationData),
        });
      }

      const result = await response.json();

      if (result.status === 200) {
        setShowModal(false);
        fetchDestinations();
      } else {
        alert(
          result.message || "Failed to save destination. Please try again."
        );
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    }
  };

  const filteredDestinations = destinations.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className={`w-8 h-8 animate-spin ${COLORS.TEXT.PRIMARY}`} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT}`}>Destinations</h2>
          <p className={`${COLORS.TEXT.MUTED} text-sm`}>Quản lý các điểm đến du lịch</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDestinations}
            className={`p-2 ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleCreate}
            className={`flex items-center gap-2 ${GRADIENTS.PRIMARY} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}
          >
            <Plus className="w-4 h-4" />
            Thêm Destination
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={`relative mb-6 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl p-4`}>
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${COLORS.TEXT.MUTED}`} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, quốc gia hoặc danh mục..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDestinations.length === 0 ? (
          <div className={`col-span-full text-center py-12 ${COLORS.TEXT.MUTED}`}>
            Chưa có destination nào
          </div>
        ) : (
          filteredDestinations.map((destination) => (
            <div
              key={destination.id}
              className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all`}
            >
              {/* Image */}
              <div className={`h-40 ${GRADIENTS.PRIMARY} flex items-center justify-center relative overflow-hidden`}>
                {destination.images?.[0] ? (
                  <Image
                    src={destination.images[0]}
                    alt={destination.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <MapPin className="w-12 h-12 text-white/80" />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className={`font-semibold ${COLORS.TEXT.DEFAULT}`}>
                      {destination.name}
                    </h3>
                    <p className={`text-sm ${COLORS.TEXT.MUTED}`}>
                      {destination.country}{" "}
                      {destination.region_name &&
                        `• ${destination.region_name}`}
                    </p>
                  </div>
                  {destination.category && (
                    <span className={`px-2 py-1 ${COLORS.PRIMARY.LIGHT} ${COLORS.TEXT.PRIMARY} text-xs rounded-full`}>
                      {destination.category}
                    </span>
                  )}
                </div>

                <div className={`flex items-center justify-between text-sm ${COLORS.TEXT.MUTED} mb-4`}>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span>
                      {destination.average_rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className={`${COLORS.TEXT.MUTED} ml-1`}>
                      ({destination.total_reviews || 0} reviews)
                    </span>
                  </div>
                  {destination.best_season && (
                    <span className={COLORS.TEXT.MUTED}>
                      {destination.best_season}
                    </span>
                  )}
                </div>

                <div className={`flex items-center justify-end space-x-2 pt-3 border-t ${COLORS.BORDER.DEFAULT}`}>
                  <button
                    onClick={() => handleEdit(destination)}
                    className={`p-2 ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.PRIMARY} hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(destination.id)}
                    className={`p-2 ${COLORS.TEXT.MUTED} hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-2xl w-full max-w-3xl my-8`}>
            <div className={`flex items-center justify-between p-4 border-b ${COLORS.BORDER.DEFAULT}`}>
              <h3 className={`text-lg font-semibold ${COLORS.TEXT.DEFAULT}`}>
                {editingDestination
                  ? "Chỉnh sửa Destination"
                  : "Thêm Destination mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-4 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              <div>
                <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                  Tên điểm đến *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                    Quốc gia
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                    Vùng/Khu vực *
                  </label>
                  <select
                    value={formData.region_id}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                    required
                  >
                    <option value="">-- Chọn khu vực --</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.address}
                      </option>
                    ))}
                  </select>
                  {regions.length === 0 && (
                    <p className={`text-xs ${COLORS.TEXT.MUTED} mt-1`}>
                      Chưa có region nào. Vui lòng tạo region trước.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  placeholder="Nhập mô tả về điểm đến..."
                />
              </div>

              {/* Map Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn vị trí trên bản đồ (Click để chọn tọa độ)
                </label>
                {typeof window !== "undefined" && (
                  <LocationPicker
                    initialLat={formData.latitude || 10.762880383009653}
                    initialLng={formData.longitude || 106.6824797006774}
                    onLocationSelect={(lat, lng) => {
                      setFormData({
                        ...formData,
                        latitude: lat,
                        longitude: lng,
                      });
                    }}
                    height="300px"
                  />
                )}
              </div>

              {/* Manual Coordinate Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        latitude: lat,
                      });
                    }}
                    className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        longitude: lng,
                      });
                    }}
                    className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                    Danh mục
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                    Mùa tốt nhất
                  </label>
                  <select
                    value={formData.best_season}
                    onChange={(e) =>
                      setFormData({ ...formData, best_season: e.target.value })
                    }
                    className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  >
                    <option value="">-- Chọn mùa --</option>
                    {SEASONS.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                  URL Hình ảnh (cách nhau bằng dấu phẩy)
                </label>
                <div className="flex items-center space-x-2">
                  <ImageIcon className={`w-5 h-5 ${COLORS.TEXT.MUTED}`} />
                  <input
                    type="text"
                    value={formData.images.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        images: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    className={`flex-1 px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 ${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 ${GRADIENTS.PRIMARY} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}
                >
                  <Save className="w-4 h-4" />
                  {editingDestination ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
