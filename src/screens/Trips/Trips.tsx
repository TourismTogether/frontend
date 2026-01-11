"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  MapPin,
  Edit,
  Trash2,
  Plane,
  Calendar,
  DollarSign,
  LayoutGrid,
  List,
  Clock,
  Gauge,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { FormNewTrip } from "./FormNewTrip";
import { TripCard } from "./TripCard";
import { EditTripModal } from "./EditTripModal";
import { API_ENDPOINTS, getTravelImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Loading from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";
import FeatureIntro from "../../components/FeatureIntro/FeatureIntro";
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
    if (
      !destinationId ||
      destinationId === "NaN" ||
      destinationId === "undefined"
    ) {
      console.error("Invalid destinationId:", destinationId);
      return null;
    }
    const response = await fetch(
      API_ENDPOINTS.DESTINATIONS.BY_ID(String(destinationId)),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

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

type ViewMode = "grid" | "list";

export const Trips: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<ITrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ITrip | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
      const response = await fetch(
        API_ENDPOINTS.USERS.BY_ID(String(userId)) + "/trips",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

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
      const deleteTripResponse = await fetch(
        API_ENDPOINTS.TRIPS.DELETE(Number(tripId)),
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

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
      <div
        className={`flex flex-col justify-center items-center h-screen ${COLORS.BACKGROUND.DEFAULT}`}
      >
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
        subtitle={
          trips.length > 0
            ? `${trips.length} ${trips.length === 1 ? "trip" : "trips"} planned`
            : undefined
        }
        proverb="Home is where the heart is"
        imageKeyword="travel planning adventure"
        height="large"
        features={[
          {
            icon: <Plane className="w-6 h-6" />,
            title: "Trip Planning",
            description:
              "Create detailed trip plans with destinations, dates, budgets, and all the information you need for your journey.",
          },
          {
            icon: <MapPin className="w-6 h-6" />,
            title: "Route Management",
            description:
              "Plan and visualize your travel routes. Add multiple stops and see your journey on interactive maps.",
          },
          {
            icon: <DollarSign className="w-6 h-6" />,
            title: "Budget Tracking",
            description:
              "Set budgets and track expenses. Monitor your spending to stay within your travel budget.",
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-20">
        {/* Header with Add Button and View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
              Your Travel Plans
            </h2>
            <p className={`${COLORS.TEXT.MUTED} mt-1`}>
              Plan, organize, and track your adventures
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div
              className={`flex items-center gap-1 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-lg p-1 transition-colors duration-300`}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === "grid"
                    ? `${COLORS.PRIMARY.DEFAULT} text-white shadow-md`
                    : `${COLORS.TEXT.MUTED} hover:${COLORS.BACKGROUND.MUTED}`
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === "list"
                    ? `${COLORS.PRIMARY.DEFAULT} text-white shadow-md`
                    : `${COLORS.TEXT.MUTED} hover:${COLORS.BACKGROUND.MUTED}`
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleOpenAddModal}
              className={`flex items-center justify-center space-x-2 ${GRADIENTS.PRIMARY} text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold`}
            >
              <Plus className="w-5 h-5" />
              <span>Plan New Trip</span>
            </button>
          </div>
        </div>

        {/* Trips Display with View Modes */}
        {trips.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {trips.map(
                (trip, index) =>
                  trip.id && (
                    <div
                      key={trip.id}
                      className={`${ANIMATIONS.FADE.IN_UP}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <TripCard
                        trip={trip}
                        onEdit={() => handleOpenEditModal(trip)}
                        onDelete={() => handleDeleteTrip(trip.id!)}
                      />
                    </div>
                  )
              )}
            </div>
          ) : (
            <div className="mt-8">
              <div
                className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-lg overflow-hidden transition-colors duration-300`}
              >
                <div className="divide-y divide-border">
                  {trips.map((trip, index) => {
                    if (!trip.id) return null;

                    const startDate = new Date(trip.start_date);
                    const endDate = new Date(trip.end_date);
                    const diffTime = Math.abs(
                      endDate.getTime() - startDate.getTime()
                    );
                    const diffDays =
                      Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    const destinationName =
                      trip.destination?.name || "Unknown Destination";
                    const percentageUsed = Math.min(
                      trip.total_budget > 0
                        ? (trip.spent_amount / trip.total_budget) * 100
                        : 0,
                      100
                    );

                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "planning":
                          return "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400";
                        case "ongoing":
                          return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 dark:text-yellow-400";
                        case "completed":
                          return "bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400";
                        case "cancelled":
                          return "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400";
                        default:
                          return "bg-gray-500/10 text-gray-500 border-gray-500/30";
                      }
                    };

                    const formatCurrency = (
                      amount: number,
                      currency: string = "VND"
                    ) => {
                      const safeAmount = amount || 0;
                      if (currency === "VND" || currency === "vnd") {
                        return (
                          new Intl.NumberFormat("vi-VN", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(safeAmount) + " ₫"
                        );
                      }
                      return new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: currency,
                        minimumFractionDigits: 0,
                      }).format(safeAmount);
                    };

                    return (
                      <Link
                        key={trip.id}
                        href={`/trips/${trip.id}`}
                        className={`block p-4 hover:${COLORS.BACKGROUND.MUTED} transition-colors duration-200 group`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Left: Title & Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3
                                className={`text-lg font-semibold ${COLORS.TEXT.DEFAULT} truncate group-hover:${COLORS.TEXT.PRIMARY} transition-colors duration-200`}
                              >
                                {trip.title}
                              </h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(
                                  trip.status || ""
                                )} shrink-0`}
                              >
                                {(trip.status || "UNKNOWN").toUpperCase()}
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-4 text-sm ${COLORS.TEXT.MUTED}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <MapPin
                                  className={`w-4 h-4 ${COLORS.TEXT.MUTED} shrink-0`}
                                />
                                <span
                                  className={`${COLORS.TEXT.MUTED} truncate`}
                                >
                                  {destinationName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar
                                  className={`w-4 h-4 ${COLORS.TEXT.MUTED} shrink-0`}
                                />
                                <span className={`${COLORS.TEXT.MUTED}`}>
                                  {startDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  -{" "}
                                  {endDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock
                                  className={`w-4 h-4 ${COLORS.TEXT.MUTED} shrink-0`}
                                />
                                <span className={`${COLORS.TEXT.MUTED}`}>
                                  {diffDays} {diffDays === 1 ? "day" : "days"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Budget & Actions */}
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <div
                                className={`text-sm font-semibold ${COLORS.TEXT.DEFAULT} mb-1`}
                              >
                                {formatCurrency(
                                  trip.spent_amount,
                                  trip.currency
                                )}{" "}
                                /{" "}
                                {formatCurrency(
                                  trip.total_budget,
                                  trip.currency
                                )}
                              </div>
                              <div
                                className={`w-24 ${COLORS.BACKGROUND.MUTED} rounded-full h-1.5 overflow-hidden`}
                              >
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    percentageUsed > 100
                                      ? "bg-destructive"
                                      : percentageUsed > 80
                                      ? "bg-yellow-500"
                                      : COLORS.PRIMARY.DEFAULT
                                  }`}
                                  style={{
                                    width: `${Math.min(percentageUsed, 100)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenEditModal(trip);
                                }}
                                className={`p-1.5 ${COLORS.BACKGROUND.MUTED} hover:${COLORS.BACKGROUND.MUTED_HOVER} ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.PRIMARY} rounded-md transition-all duration-200`}
                                title="Edit Trip"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteTrip(trip.id!);
                                }}
                                className={`p-1.5 ${COLORS.BACKGROUND.MUTED} hover:bg-destructive/10 ${COLORS.TEXT.MUTED} hover:text-destructive rounded-md transition-all duration-200`}
                                title="Delete Trip"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <div
              className={`text-center py-16 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border-2 border-dashed rounded-2xl shadow-lg`}
            >
              <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                <Image
                  src={getTravelImageUrl("adventure planning", 200, 200)}
                  alt="No trips"
                  fill
                  className="object-cover opacity-50"
                  unoptimized
                />
              </div>
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${COLORS.PRIMARY.LIGHT} mb-6 ${ANIMATIONS.BOUNCE.GENTLE}`}
              >
                <Plane
                  className={`w-10 h-10 ${COLORS.TEXT.PRIMARY} ${ANIMATIONS.ROTATE.SLOW}`}
                />
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
