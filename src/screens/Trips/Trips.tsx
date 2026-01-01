// src/components/Trips.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { FormNewTrip } from "./FormNewTrip";
import { TripCard } from "./TripCard";
import { EditTripModal } from "./EditTripModal";

// --- INTERFACES ---
export interface IDestination {
  id?: string;
  region_id: string;
  name: string; // <--- Trường cần lấy
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  best_season: string;
  rating: number;
  images: Array<string> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ITrip {
  id?: string;
  destination_id: string;
  title: string;
  description: string;
  departure: string;
  distance: number;
  start_date: string;
  end_date: string;
  difficult: number;
  total_budget: number;
  spent_amount: number;
  status: "planning" | "ongoing" | "completed" | "cancelled" | string;
  created_at: string;
  updated_at: string;
  destination?: IDestination; // Thêm '?' vì ban đầu có thể chưa có
  currency?: string;
}

export interface IJoinTrip {
  user_id: string;
  trip_id: string;
  created_at: string;
}

// Hàm fetch chi tiết Destination (MỚI)
const fetchDestinationDetails = async (
  API_URL: string,
  destinationId: string
): Promise<IDestination | null> => {
  try {
    const response = await fetch(`${API_URL}/destinations/${destinationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch destination ${destinationId} (Status: ${response.status})`
      );
      return null;
    }

    const result = await response.json();
    // Giả định API trả về { data: IDestination } hoặc trực tiếp IDestination
    return result.data || result;
  } catch (error) {
    console.error(`Error fetching destination ${destinationId}:`, error);
    return null;
  }
};

export const Trips: React.FC = () => {
  const { user } = useAuth();

  const [trips, setTrips] = useState<ITrip[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal Add
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // State cho Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ITrip | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (API_URL && user?.id) {
      fetchUserTrips(user.id);
    } else if (!user) {
      setLoading(false);
    }
  }, [API_URL, user?.id]);

  /**
   * Fetch trips của user và sau đó fetch chi tiết destination nếu cần
   */
  const fetchUserTrips = async (userId: string) => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1. Fetch danh sách trips
      const response = await fetch(`${API_URL}/users/${userId}/trips`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 404) {
          // User has no trips yet
          setTrips([]);
          setLoading(false);
          return;
        }
        throw new Error(
          `Failed to fetch user trips (Status: ${response.status})`
        );
      }

      const result = await response.json();
      let tripsData: ITrip[] = [];

      // Handle different response formats
      if (Array.isArray(result)) {
        tripsData = result;
      } else if (result.data && Array.isArray(result.data)) {
        tripsData = result.data;
      } else if (result.data && !Array.isArray(result.data)) {
        // Single trip object
        tripsData = [result.data];
      } else {
        tripsData = [];
      }

      // 2. Xử lý trường hợp API không nhúng Destination
      // Nếu tripsData không có trường `destination.name` (hoặc `destination` là null/undefined)
      // VÀ có destination_id, thì ta tiến hành fetch chi tiết.
      const tripsToFetchDestination = tripsData.filter(
        (trip) => !trip.destination && trip.destination_id
      );

      if (tripsToFetchDestination.length > 0) {
        // Tạo một mảng các Promise để fetch chi tiết Destination song song
        const destinationPromises = tripsToFetchDestination.map((trip) =>
          fetchDestinationDetails(API_URL, trip.destination_id)
        );

        const destinations = await Promise.all(destinationPromises);

        // Map lại dữ liệu trips với thông tin destination đã fetch
        tripsData = tripsData.map((trip) => {
          if (trip.destination) return trip; // Bỏ qua nếu đã có destination (API đã nhúng)

          const destinationIndex = tripsToFetchDestination.findIndex(
            (t) => t.id === trip.id
          );

          const destination = destinations[destinationIndex];

          return {
            ...trip,
            destination: destination || undefined, // Gắn destination object vào trip
          } as ITrip;
        });
      }

      setTrips(tripsData);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      setTrips([]);
      // Don't show alert for fetch errors, just log and set empty array
    } finally {
      setLoading(false);
    }
  };

  // --- Các Handlers CRUD (giữ nguyên) ---
  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleOpenEditModal = (trip: ITrip) => {
    setSelectedTrip(trip);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedTrip(null);
    setIsEditModalOpen(false);
  };

  const handleTripActionSuccess = () => {
    if (user?.id) {
      fetchUserTrips(user.id);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!API_URL || !user?.id) {
      alert("Missing API URL or user information.");
      return;
    }

    if (!confirm(`Are you sure you want to delete this trip?`)) {
      return;
    }

    try {
      setLoading(true);

      // Bước 1: Xóa user khỏi trip (remove join_trip record)
      // This is optional - if it fails, we still try to delete the trip
      try {
        const deleteJoinTripResponse = await fetch(
          `${API_URL}/trips/${tripId}/users/${user.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (
          !deleteJoinTripResponse.ok &&
          deleteJoinTripResponse.status !== 404
        ) {
          console.warn(
            `Could not remove user from trip (Status: ${deleteJoinTripResponse.status}). Proceeding to delete trip.`
          );
        }
      } catch (joinError) {
        console.warn(
          "Error removing user from trip (non-critical):",
          joinError
        );
        // Continue with trip deletion even if this fails
      }

      // Bước 2: Xóa trip
      const deleteTripResponse = await fetch(`${API_URL}/trips/${tripId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!deleteTripResponse.ok) {
        let errorMessage = `Failed to delete trip (Status: ${deleteTripResponse.status})`;
        try {
          const errorData = await deleteTripResponse.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          try {
            const errorText = await deleteTripResponse.text();
            if (errorText) errorMessage = errorText;
          } catch {
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }

      // Success - refresh the trips list
      handleTripActionSuccess();
    } catch (error) {
      console.error("Error deleting trip:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Error deleting trip: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Logic (Enhanced loading state) ---
  if (loading || !user?.id) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        {!user ? (
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Please log in to view your trips.
            </p>
            <p className="text-gray-600">
              You need to be authenticated to access this page.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your trips...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* HEADER - Enhanced with better styling */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 sm:mb-12">
          {/* Tiêu đề */}
          <div className="mb-6 sm:mb-0">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">
              My Trips
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Manage your travel plans and budgets
            </p>
            {trips.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {trips.length} {trips.length === 1 ? "trip" : "trips"} planned
              </p>
            )}
          </div>

          {/* Nút Plan New Trip - Enhanced styling */}
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Plan New Trip</span>
          </button>
        </div>

        {/* Danh sách chuyến đi - Better spacing and responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {trips.length > 0 ? (
            trips.map((trip) => (
              // Thêm kiểm tra an toàn cho ID
              <div key={trip.id} className="relative group">
                {trip.id && (
                  <TripCard
                    trip={trip}
                    onEdit={() => handleOpenEditModal(trip)}
                    onDelete={() => handleDeleteTrip(trip.id!)}
                  />
                )}
              </div>
            ))
          ) : (
            // Enhanced Empty State
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-200">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 mb-6">
                  <MapPin className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No trips yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start planning your next adventure! Create your first trip to
                  begin organizing your travel plans.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center justify-center space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Trip</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL THÊM */}
      <FormNewTrip
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onTripCreated={handleTripActionSuccess}
      />

      {/* MODAL SỬA */}
      {selectedTrip && (
        <EditTripModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          trip={selectedTrip}
          onTripUpdated={handleTripActionSuccess}
        />
      )}
    </div>
  );
};
