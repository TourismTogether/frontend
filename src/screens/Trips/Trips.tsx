"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, MapPin, Edit, Trash2, Plane, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { FormNewTrip } from "./FormNewTrip";
import { TripCard } from "./TripCard";
import { EditTripModal } from "./EditTripModal";
import { API_ENDPOINTS, getTravelImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Loading from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";
import { ANIMATIONS } from "../../constants/animations";

// Interface definitions
export interface IDestination {
  id?: string;
  region_id: string;
  name: string;
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
  destination?: IDestination;
  currency?: string;
}

export interface IJoinTrip {
  user_id: string;
  trip_id: string;
  created_at: string;
}

interface TripApiResponse {
  data?: ITrip | ITrip[];
  status?: number;
  message?: string;
}

interface DestinationApiResponse {
  data?: IDestination;
  status?: number;
  message?: string;
}

// Fetch destination details
const fetchDestinationDetails = async (
  destinationId: string
): Promise<IDestination | null> => {
  try {
    if (!destinationId || destinationId === "NaN" || destinationId === "undefined") {
      console.error("Invalid destinationId:", destinationId);
      return null;
    }
    const response = await fetch(API_ENDPOINTS.DESTINATIONS.BY_ID(String(destinationId)), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch destination ${destinationId} (Status: ${response.status})`
      );
      return null;
    }

    const result: DestinationApiResponse = await response.json();
    return result.data || null;
  } catch (error) {
    console.error(`Error fetching destination ${destinationId}:`, error);
    return null;
  }
};

export const Trips: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<ITrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ITrip | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserTrips(user.id);
    } else if (!user) {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchUserTrips = async (userId: string) => {
    setLoading(true);

    try {
      if (!userId || userId === "NaN" || userId === "undefined") {
        console.error("Invalid userId:", userId);
        setTrips([]);
        setLoading(false);
        return;
      }
      const response = await fetch(API_ENDPOINTS.USERS.BY_ID(String(userId)) + "/trips", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          setTrips([]);
          setLoading(false);
          return;
        }
        throw new Error(
          `Failed to fetch user trips (Status: ${response.status})`
        );
      }

      const result: TripApiResponse = await response.json();
      let tripsData: ITrip[] = [];

      if (Array.isArray(result)) {
        tripsData = result;
      } else if (result.data && Array.isArray(result.data)) {
        tripsData = result.data;
      } else if (result.data && !Array.isArray(result.data)) {
        tripsData = [result.data];
      } else {
        tripsData = [];
      }

      // Fetch destination details for trips that don't have them
      const tripsToFetchDestination = tripsData.filter(
        (trip) => !trip.destination && trip.destination_id
      );

      if (tripsToFetchDestination.length > 0) {
        const destinationPromises = tripsToFetchDestination.map((trip) =>
          fetchDestinationDetails(trip.destination_id)
        );

        const destinations = await Promise.all(destinationPromises);

        tripsData = tripsData.map((trip) => {
          if (trip.destination) return trip;

          const destinationIndex = tripsToFetchDestination.findIndex(
            (t) => t.id === trip.id
          );

          const destination = destinations[destinationIndex];

          return {
            ...trip,
            destination: destination || undefined,
          } as ITrip;
        });
      }

      setTrips(tripsData);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

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
    if (!user?.id) {
      alert("Missing user information.");
      return;
    }

    if (!confirm(`Are you sure you want to delete this trip?`)) {
      return;
    }

    try {
      setLoading(true);

      // Try to remove user from trip first
      try {
        const deleteJoinTripResponse = await fetch(
          `${API_ENDPOINTS.TRIPS.BY_ID(String(tripId))}/users/${user.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
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
      }

      // Delete trip
      const deleteTripResponse = await fetch(API_ENDPOINTS.TRIPS.DELETE(Number(tripId)), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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

  if (loading || !user?.id) {
    return (
      <div className={`flex flex-col justify-center items-center h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
        {!user ? (
          <div className="text-center">
            <p className={`text-xl font-semibold ${COLORS.TEXT.DEFAULT} mb-2`}>
              Please log in to view your trips.
            </p>
            <p className={COLORS.TEXT.MUTED}>
              You need to be authenticated to access this page.
            </p>
          </div>
        ) : (
          <Loading type="trips" />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT}`}>
      {/* Hero Section */}
      <Hero
        title="My Trips ✈️"
        description="Manage your travel plans and budgets"
        subtitle={trips.length > 0 ? `${trips.length} ${trips.length === 1 ? "trip" : "trips"} planned` : undefined}
        imageKeyword="travel planning adventure"
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-20">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <h2 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
              Your Travel Plans
            </h2>
            <p className={`${COLORS.TEXT.MUTED} mt-1`}>
              Plan, organize, and track your adventures
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className={`flex items-center justify-center space-x-2 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold`}
          >
            <Plus className="w-5 h-5" />
            <span>Plan New Trip</span>
          </button>
        </div>

        {/* Trips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trips.length > 0 ? (
            trips.map((trip, index) => (
              <div
                key={trip.id}
                className={`relative group ${ANIMATIONS.FADE.IN_UP}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
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
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <div className={`text-center py-16 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border-2 border-dashed rounded-2xl shadow-lg`}>
                <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                  <Image
                    src={getTravelImageUrl("adventure planning", 200, 200)}
                    alt="No trips"
                    fill
                    className="object-cover opacity-50"
                    unoptimized
                  />
                </div>
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${COLORS.PRIMARY.LIGHT} mb-6 ${ANIMATIONS.BOUNCE.GENTLE}`}>
                  <Plane className={`w-10 h-10 ${COLORS.TEXT.PRIMARY} ${ANIMATIONS.ROTATE.SLOW}`} />
                </div>
                <h3 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT} mb-3`}>
                  No trips yet
                </h3>
                <p className={`${COLORS.TEXT.MUTED} mb-6 max-w-md mx-auto`}>
                  Start planning your next adventure! Create your first trip to
                  begin organizing your travel plans.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className={`inline-flex items-center justify-center space-x-2 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold ${ANIMATIONS.PULSE.GLOW}`}
                >
                  <Plus className={`w-5 h-5 ${ANIMATIONS.ROTATE.MEDIUM}`} />
                  <span>Create Your First Trip</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FormNewTrip
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onTripCreated={handleTripActionSuccess}
      />

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
