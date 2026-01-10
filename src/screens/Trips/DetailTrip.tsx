// src/app/trips/[id]/DetailTrip.tsx

"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Activity,
  ArrowLeft,
  PlusCircle,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AddRouteForm } from "./AddRouteForm";
import { RouteCard } from "@/components/Route/RouteCard";
import { RouteRecommendationModal } from "@/components/Route/RouteRecommendationModal";
import dynamic from "next/dynamic";
import { ICost, IRoute, ITrip, IDestination } from "@/lib/type/interface";
import {
  generateAIItinerary,
  AIGeneratedRoute,
  TripContext,
} from "@/services/aiRoutePlannerService";
import { COLORS } from "@/constants/colors";
import Loading from "@/components/Loading/Loading";

// Dynamically import RouteMap to avoid SSR issues
const RouteMap = dynamic(
  () =>
    import("@/components/Map/RouteMap").then((mod) => ({
      default: mod.RouteMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className={`w-full rounded-lg overflow-hidden ${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.MUTED} flex items-center justify-center transition-colors duration-300`}
        style={{ height: "500px" }}
      >
        <p className={`${COLORS.TEXT.MUTED} transition-colors duration-200`}>Loading map...</p>
      </div>
    ),
  }
);

// --- TYPE EXTENSIONS ---
interface TripWithDetails extends ITrip {
  destination?: IDestination;
  routes: IRoute[];
}

// --- HELPER FUNCTIONS ---

const calculateSpentAmount = (routes: IRoute[]): number => {
  if (!routes || routes.length === 0) return 0;
  return routes.reduce((sumRoute, route) => {
    const currentCosts = Array.isArray(route.costs) ? route.costs : [];
    const routeCost = currentCosts.reduce((sumCost, cost) => {
      // Ensure amount is a number, not a string
      const amount =
        typeof cost.amount === "string"
          ? parseFloat(cost.amount) || 0
          : Number(cost.amount) || 0;
      return sumCost + amount;
    }, 0);
    return sumRoute + routeCost;
  }, 0);
};

const formatCurrency = (amount: number | null | undefined) => {
  const value = amount || 0;
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "planning":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "ongoing":
    case "active":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return `${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.MUTED} ${COLORS.BORDER.DEFAULT}`;
  }
};

// Normalize API cost response to match ICost interface
const normalizeCost = (
  apiCost: any,
  defaultCurrency: string = "VND"
): ICost => {
  // Ensure amount is always a number, not a string
  const rawAmount = apiCost.cost || apiCost.amount || 0;
  const amount =
    typeof rawAmount === "string"
      ? parseFloat(rawAmount) || 0
      : Number(rawAmount) || 0;

  return {
    id: apiCost.id,
    title: apiCost.title || "",
    description: apiCost.description || "",
    amount: amount,
    category: apiCost.category || "other",
    currency: apiCost.currency || defaultCurrency,
    route_id: apiCost.route_id,
    created_at: apiCost.created_at,
    updated_at: apiCost.updated_at,
  };
};

// Helper functions to validate coordinates
const isValidCoordinate = (value: number): boolean => {
  return !isNaN(value) && isFinite(value) && value !== 0;
};

const isValidLatitude = (lat: number): boolean => {
  return isValidCoordinate(lat) && lat >= -90 && lat <= 90;
};

const isValidLongitude = (lng: number): boolean => {
  return isValidCoordinate(lng) && lng >= -180 && lng <= 180;
};

const normalizeRoute = (apiRoute: any): IRoute => {
  // Handle both camelCase (lngStart) and snake_case (lng_start) from backend
  const lngStart = Number(apiRoute.lngStart ?? apiRoute.lng_start);
  const latStart = Number(apiRoute.latStart ?? apiRoute.lat_start);
  const lngEnd = Number(apiRoute.lngEnd ?? apiRoute.lng_end);
  const latEnd = Number(apiRoute.latEnd ?? apiRoute.lat_end);

  return {
    id: apiRoute.id,
    index: Number(apiRoute.index) || 0,
    trip_id: apiRoute.trip_id,
    title: apiRoute.title || "",
    description: apiRoute.description || "",
    lngStart: isValidLongitude(lngStart) ? lngStart : 0,
    latStart: isValidLatitude(latStart) ? latStart : 0,
    lngEnd: isValidLongitude(lngEnd) ? lngEnd : 0,
    latEnd: isValidLatitude(latEnd) ? latEnd : 0,
    details: Array.isArray(apiRoute.details) ? apiRoute.details : [],
    costs: [], // Will be populated separately
    created_at: apiRoute.created_at,
    updated_at: apiRoute.updated_at,
  };
};

// --- MAIN COMPONENT ---

interface DetailTripProps {
  params: {
    id: string;
  };
}

export const DetailTrip: React.FC<DetailTripProps> = ({ params }) => {
  const router = useRouter();
  const tripId = params.id;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [editingRoute, setEditingRoute] = useState<IRoute | null>(null);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] =
    useState(false);
  const [aiGeneratedRoutes, setAiGeneratedRoutes] = useState<
    AIGeneratedRoute[]
  >([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    const fetchTripAndRoutes = async () => {
      if (!tripId || !API_URL || tripId === "NaN" || tripId === "undefined") return;

      setLoading(true);
      try {
        // 1. Fetch Trip Details
        const tripResponse = await fetch(`${API_URL}/trips/${tripId}`);
        if (!tripResponse.ok) {
          throw new Error(`Failed to fetch trip: ${tripResponse.status}`);
        }
        const tripResult = await tripResponse.json();
        const rawTrip: ITrip & { destination?: IDestination } =
          tripResult.data || tripResult;

        // 2. Fetch Routes
        const routesResponse = await fetch(`${API_URL}/trips/${String(tripId)}/routes`);
        let rawRoutes: any[] = [];

        if (routesResponse.ok) {
          const routesResult = await routesResponse.json();
          rawRoutes = routesResult.data || routesResult || [];
        } else {
          console.warn(`Failed to fetch routes for trip ${tripId}`);
        }

        // 3. Normalize routes and fetch costs for each route
        const routesWithCostsPromises = rawRoutes.map(async (apiRoute) => {
          const normalizedRoute = normalizeRoute(apiRoute);

          if (!normalizedRoute.id) {
            console.warn("Route without ID found:", apiRoute);
            return normalizedRoute;
          }

          try {
            const costsResponse = await fetch(
              `${API_URL}/routes/${normalizedRoute.id}/costs`
            );

            if (costsResponse.ok) {
              const costsResult = await costsResponse.json();
              let rawCosts: any[] = [];

              // Handle different API response formats
              if (costsResult.data !== undefined && costsResult.data !== null) {
                rawCosts = Array.isArray(costsResult.data)
                  ? costsResult.data
                  : [costsResult.data];
              } else if (Array.isArray(costsResult)) {
                rawCosts = costsResult;
              } else if (typeof costsResult === "object" && costsResult.id) {
                rawCosts = [costsResult];
              }

              // Normalize costs
              const normalizedCosts = rawCosts
                .filter((c: any) => c && typeof c === "object")
                .map((c: any) => normalizeCost(c, rawTrip.currency || "VND"));

              return {
                ...normalizedRoute,
                costs: normalizedCosts,
              };
            }
          } catch (err) {
            console.error(
              `Error fetching costs for route ${normalizedRoute.id}:`,
              err
            );
          }

          return normalizedRoute;
        });

        const routesWithCosts = await Promise.all(routesWithCostsPromises);

        // Filter out routes with invalid coordinates
        const validRoutes = routesWithCosts.filter((route) => {
          return (
            isValidLatitude(route.latStart) &&
            isValidLongitude(route.lngStart) &&
            isValidLatitude(route.latEnd) &&
            isValidLongitude(route.lngEnd)
          );
        });

        // Sort routes by index
        validRoutes.sort((a, b) => (a.index || 0) - (b.index || 0));

        // Calculate spent amount
        const spentAmount = calculateSpentAmount(validRoutes);

        const finalTrip: TripWithDetails = {
          ...rawTrip,
          id: rawTrip.id!,
          destination_id: rawTrip.destination_id,
          title: rawTrip.title,
          description: rawTrip.description,
          departure: rawTrip.departure,
          distance: rawTrip.distance,
          start_date: rawTrip.start_date,
          end_date: rawTrip.end_date,
          difficult: rawTrip.difficult,
          total_budget: rawTrip.total_budget || 0,
          spent_amount: spentAmount,
          status: rawTrip.status || "planning",
          members: rawTrip.members || 1,
          currency: rawTrip.currency || "VND",
          created_at: rawTrip.created_at,
          updated_at: rawTrip.updated_at,
          destination: rawTrip.destination,
          routes: validRoutes,
        };

        setTrip(finalTrip);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchTripAndRoutes();
  }, [tripId, API_URL]);

  const handleAddNewRoute = async (formValues: {
    index: number;
    title: string;
    description: string;
    lngStart: number;
    latStart: number;
    lngEnd: number;
    latEnd: number;
    details: string[];
  }) => {
    if (!trip || !API_URL) return;

    try {
      const routePayload = {
        ...formValues,
        trip_id: trip.id,
        costs: [],
      };

      const response = await fetch(`${API_URL}/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routePayload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to create route");
      }

      const result = await response.json();
      const apiRoute = result.data || result;

      const newRoute: IRoute = {
        ...normalizeRoute(apiRoute),
        ...formValues,
        costs: [],
        created_at: apiRoute.created_at || new Date(),
        updated_at: apiRoute.updated_at || new Date(),
      };

      const updatedRoutes = [...trip.routes, newRoute];
      updatedRoutes.sort((a, b) => (a.index || 0) - (b.index || 0));

      setTrip({
        ...trip,
        routes: updatedRoutes,
        spent_amount: calculateSpentAmount(updatedRoutes),
      });

      setIsAddingRoute(false);
      console.log("Route added successfully:", newRoute);
    } catch (err: any) {
      console.error("Add Route Error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddCost = async (
    routeId: string,
    newCost: Omit<ICost, "id" | "created_at" | "updated_at" | "route_id">
  ) => {
    if (!trip || !API_URL) return;

    try {
      const response = await fetch(`${API_URL}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCost,
          route_id: routeId,
          cost: newCost.amount, // API might expect 'cost' instead of 'amount'
        }),
      });

      if (!response.ok) throw new Error("Failed to add cost");

      const result = await response.json();
      const apiCost = result.data || result;
      const createdCost = normalizeCost(apiCost, trip.currency);

      const updatedRoutes = trip.routes.map((route) => {
        if (route.id === routeId) {
          return {
            ...route,
            costs: [...route.costs, createdCost],
          };
        }
        return route;
      });

      const newSpentAmount = calculateSpentAmount(updatedRoutes);

      // Update local state
      setTrip({
        ...trip,
        routes: updatedRoutes,
        spent_amount: newSpentAmount,
      });

      // Sync spent_amount to backend
      try {
        await fetch(`${API_URL}/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spent_amount: newSpentAmount }),
        });
      } catch (syncErr) {
        console.error("Failed to sync spent_amount to backend:", syncErr);
        // Don't throw - local state is updated, backend sync can fail silently
      }
    } catch (err) {
      console.error("Add cost error:", err);
      alert("Failed to add cost");
    }
  };

  const handleDeleteCost = async (routeId: string, costId: string) => {
    if (!trip || !API_URL) return;
    if (!confirm("Delete this cost?")) return;

    try {
      const response = await fetch(`${API_URL}/costs/${costId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete cost");

      const updatedRoutes = trip.routes.map((route) => {
        if (route.id === routeId) {
          return {
            ...route,
            costs: route.costs.filter((c: ICost) => c.id !== costId),
          };
        }
        return route;
      });

      const newSpentAmount = calculateSpentAmount(updatedRoutes);

      // Update local state
      setTrip({
        ...trip,
        routes: updatedRoutes,
        spent_amount: newSpentAmount,
      });

      // Sync spent_amount to backend
      try {
        await fetch(`${API_URL}/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spent_amount: newSpentAmount }),
        });
      } catch (syncErr) {
        console.error("Failed to sync spent_amount to backend:", syncErr);
        // Don't throw - local state is updated, backend sync can fail silently
      }
    } catch (err) {
      console.error("Delete cost error:", err);
      alert("Failed to delete cost");
    }
  };

  const handleGetRecommendations = async () => {
    if (!trip || !API_URL || !trip.destination) {
      alert("Vui lòng đảm bảo trip có thông tin destination.");
      return;
    }

    setIsRecommendationModalOpen(true);
    setLoadingRecommendations(true);

    try {
      const context: TripContext = {
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        budget: trip.total_budget,
        difficulty: trip.difficult,
        existingRoutes: trip.routes,
      };

      const generatedRoutes = await generateAIItinerary(API_URL, context);
      setAiGeneratedRoutes(generatedRoutes);
    } catch (err) {
      console.error("Error generating AI itinerary:", err);
      alert("Không thể tạo lộ trình AI. Vui lòng thử lại.");
      setAiGeneratedRoutes([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSelectRecommendedRoute = async (routeData: {
    index: number;
    title: string;
    description: string;
    lngStart: number;
    latStart: number;
    lngEnd: number;
    latEnd: number;
    details: string[];
  }) => {
    if (!trip || !API_URL) return;

    try {
      // Calculate next index
      const nextIndex =
        trip.routes.length > 0
          ? Math.max(...trip.routes.map((r) => r.index || 0)) + 1
          : 0;

      const routePayload = {
        ...routeData,
        index: nextIndex,
        trip_id: trip.id,
        costs: [],
      };

      const response = await fetch(`${API_URL}/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routePayload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to create route");
      }

      const result = await response.json();
      const apiRoute = result.data || result;

      const newRoute: IRoute = {
        ...normalizeRoute(apiRoute),
        ...routeData,
        index: nextIndex,
        costs: [],
        created_at: apiRoute.created_at || new Date(),
        updated_at: apiRoute.updated_at || new Date(),
      };

      const updatedRoutes = [...trip.routes, newRoute];
      updatedRoutes.sort((a, b) => (a.index || 0) - (b.index || 0));

      setTrip({
        ...trip,
        routes: updatedRoutes,
        spent_amount: calculateSpentAmount(updatedRoutes),
      });

      console.log("Recommended route added successfully:", newRoute);
    } catch (err: any) {
      console.error("Add Recommended Route Error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!trip || !API_URL || !routeId) return;

    try {
      const response = await fetch(`${API_URL}/routes/${routeId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to delete route");
      }

      // Remove route from local state
      const updatedRoutes = trip.routes.filter((r) => r.id !== routeId);

      // Re-index remaining routes to maintain sequence
      const reindexedRoutes = updatedRoutes.map((r, index) => ({
        ...r,
        index: index,
      }));

      setTrip({
        ...trip,
        routes: reindexedRoutes,
        spent_amount: calculateSpentAmount(reindexedRoutes),
      });

      console.log("Route deleted successfully");
    } catch (err: any) {
      console.error("Delete Route Error:", err);
      alert(`Error deleting route: ${err.message}`);
    }
  };

  const handleEditRoute = (route: IRoute) => {
    setEditingRoute(route);
  };

  const handleUpdateRoute = async (formValues: {
    title: string;
    description: string;
    lngStart: number;
    latStart: number;
    lngEnd: number;
    latEnd: number;
    details: string[];
  }) => {
    if (!trip || !API_URL || !editingRoute?.id) return;

    try {
      // Only send fields that exist in the backend route model
      const routePayload = {
        trip_id: trip.id,
        index: editingRoute.index,
        title: formValues.title,
        description: formValues.description,
        lngStart: formValues.lngStart,
        latStart: formValues.latStart,
        lngEnd: formValues.lngEnd,
        latEnd: formValues.latEnd,
        // Note: details is not part of the route table, it's handled separately if needed
      };

      const response = await fetch(`${API_URL}/routes/${editingRoute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routePayload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to update route");
      }

      const result = await response.json();
      const apiRoute = result.data || result;

      const updatedRoute: IRoute = {
        ...normalizeRoute(apiRoute),
        ...formValues,
        index: editingRoute.index,
        costs: editingRoute.costs,
        created_at: editingRoute.created_at,
        updated_at: apiRoute.updated_at || new Date(),
      };

      const updatedRoutes = trip.routes.map((r) =>
        r.id === editingRoute.id ? updatedRoute : r
      );

      setTrip({
        ...trip,
        routes: updatedRoutes,
        spent_amount: calculateSpentAmount(updatedRoutes),
      });

      setEditingRoute(null);
      console.log("Route updated successfully:", updatedRoute);
    } catch (err: any) {
      console.error("Update Route Error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditCost = async (routeId: string, cost: ICost) => {
    if (!trip || !API_URL || !cost.id) return;

    try {
      const costPayload = {
        route_id: routeId,
        title: cost.title,
        description: cost.description,
        category: cost.category,
        cost: cost.amount, // Backend uses 'cost' field
      };

      const response = await fetch(`${API_URL}/costs/${cost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(costPayload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to update cost");
      }

      const result = await response.json();
      const apiCost = result.data || result;
      const updatedCost = normalizeCost(apiCost, trip.currency || "VND");

      const updatedRoutes = trip.routes.map((route) => {
        if (route.id === routeId) {
          return {
            ...route,
            costs: route.costs.map((c) => (c.id === cost.id ? updatedCost : c)),
          };
        }
        return route;
      });

      const newSpentAmount = calculateSpentAmount(updatedRoutes);

      // Update local state
      setTrip({
        ...trip,
        routes: updatedRoutes,
        spent_amount: newSpentAmount,
      });

      // Sync spent_amount to backend
      try {
        await fetch(`${API_URL}/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spent_amount: newSpentAmount }),
        });
      } catch (syncErr) {
        console.error("Failed to sync spent_amount to backend:", syncErr);
        // Don't throw - local state is updated, backend sync can fail silently
      }

      console.log("Cost updated successfully");
    } catch (err: any) {
      console.error("Update Cost Error:", err);
      alert(`Error updating cost: ${err.message}`);
    }
  };

  // --- RENDER ---

  if (loading) {
    return <Loading type="trips" message="Loading trip details..." />;
  }

  if (error || !trip) {
    return (
      <div className={`flex h-screen flex-col items-center justify-center gap-6 ${COLORS.BACKGROUND.DEFAULT} p-4 text-center transition-colors duration-300`}>
        <div className={`p-4 bg-destructive/10 rounded-full transition-colors duration-200`}>
          <AlertCircle className={`h-16 w-16 text-destructive transition-colors duration-200`} />
        </div>
        <h2 className={`text-3xl font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>Error Loading Trip</h2>
        <p className={`${COLORS.TEXT.MUTED} max-w-md transition-colors duration-200`}>{error || "Trip not found"}</p>
        <button
          onClick={() => router.push("/trips")}
          className={`rounded-xl ${COLORS.PRIMARY.DEFAULT} ${COLORS.PRIMARY.HOVER} px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
        >
          Back to Trips
        </button>
      </div>
    );
  }

  // Ensure values are numbers, not strings
  const totalBudget = Number(trip.total_budget) || 0;
  const spentAmount = Number(trip.spent_amount) || 0;

  const budgetUsage = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;
  const remaining = totalBudget - spentAmount;

  const destinationName = trip.destination?.name || "Unknown Destination";

  return (
    <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT} pb-20 relative transition-colors duration-300`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation - Enhanced */}
        <button
          onClick={() => router.push("/trips")}
          className={`mb-6 flex items-center text-sm font-medium ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.DEFAULT} transition-all duration-200 group`}
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Trips
        </button>

        {/* Header - Enhanced with better styling */}
        <div className={`mb-8 ${COLORS.BACKGROUND.CARD} rounded-2xl shadow-lg ${COLORS.BORDER.DEFAULT} p-6 sm:p-8 transition-all duration-300`}>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="flex-1">
              <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${COLORS.TEXT.DEFAULT} mb-4 transition-colors duration-200`}>
                {trip.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={`rounded-full border-2 px-3 py-1 text-xs font-bold shadow-sm transition-colors duration-200 ${getStatusColor(
                    trip.status
                  )}`}
                >
                  {trip.status.toUpperCase()}
                </span>
                <span className={`flex items-center text-sm ${COLORS.TEXT.MUTED} ${COLORS.BACKGROUND.MUTED} px-3 py-1 rounded-lg transition-colors duration-200`}>
                  <Calendar className={`mr-1.5 h-4 w-4 ${COLORS.TEXT.PRIMARY} transition-colors duration-200`} />
                  {new Date(trip.start_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(trip.end_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {trip.description && (
                <p className={`${COLORS.TEXT.MUTED} text-base leading-relaxed max-w-2xl transition-colors duration-200`}>
                  {trip.description}
                </p>
              )}
            </div>
            <div className={`text-left md:text-right bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 ${COLORS.BORDER.DEFAULT} transition-colors duration-300`}>
              <p className={`text-xs font-semibold ${COLORS.TEXT.MUTED} uppercase tracking-wide mb-1 transition-colors duration-200`}>
                Destination
              </p>
              <div className="flex items-center md:justify-end gap-2">
                <MapPin className={`h-5 w-5 ${COLORS.TEXT.PRIMARY} transition-colors duration-200`} />
                <p className={`text-lg font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                  {destinationName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Add Route */}
        {isAddingRoute && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              // Close when clicking on the backdrop (not on the form itself)
              if (e.target === e.currentTarget) {
                setIsAddingRoute(false);
              }
            }}
          >
            <div
              className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AddRouteForm
                onClose={() => setIsAddingRoute(false)}
                onSubmit={(route) => {
                  // Remove 'index' if present before passing to prop
                  // and match expected signature: (route: { title, description, lngStart, latStart, lngEnd, latEnd, details }) => void
                  // Since handleAddNewRoute needs 'index', wrap here if needed
                  const newRoute = { ...route, index: trip.routes.length };
                  // If handleAddNewRoute returns a Promise, ignore it for AddRouteForm expectations
                  void handleAddNewRoute(newRoute);
                }}
                defaultStartLat={
                  trip.routes.length > 0
                    ? trip.routes[trip.routes.length - 1].latEnd
                    : trip.destination?.latitude
                }
                defaultStartLng={
                  trip.routes.length > 0
                    ? trip.routes[trip.routes.length - 1].lngEnd
                    : trip.destination?.longitude
                }
                defaultEndLat={trip.destination?.latitude}
                defaultEndLng={trip.destination?.longitude}
              />
            </div>
          </div>
        )}

        {/* Modal Edit Route */}
        {editingRoute && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditingRoute(null);
              }
            }}
          >
            <div
              className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AddRouteForm
                onClose={() => setEditingRoute(null)}
                onSubmit={handleUpdateRoute}
                initialRoute={editingRoute}
              />
            </div>
          </div>
        )}

        {/* Route Recommendation Modal */}
        <RouteRecommendationModal
          isOpen={isRecommendationModalOpen}
          onClose={() => setIsRecommendationModalOpen(false)}
          aiGeneratedRoutes={aiGeneratedRoutes}
          onSelectAllRoutes={async () => {
            // Add all AI-generated routes to the trip
            if (!trip || !API_URL || aiGeneratedRoutes.length === 0) return;

            try {
              const startIndex =
                trip.routes.length > 0
                  ? Math.max(...trip.routes.map((r) => r.index || 0)) + 1
                  : 0;

              // Create all routes sequentially
              const newRoutes: IRoute[] = [];

              for (let idx = 0; idx < aiGeneratedRoutes.length; idx++) {
                const aiRoute = aiGeneratedRoutes[idx];
                const routePayload = {
                  index: startIndex + idx,
                  title: aiRoute.route.title,
                  description: aiRoute.route.description,
                  lngStart: aiRoute.route.lngStart,
                  latStart: aiRoute.route.latStart,
                  lngEnd: aiRoute.route.lngEnd,
                  latEnd: aiRoute.route.latEnd,
                  trip_id: trip.id,
                  costs: [],
                };

                const response = await fetch(`${API_URL}/routes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(routePayload),
                });

                if (!response.ok) {
                  const errJson = await response.json().catch(() => ({}));
                  throw new Error(
                    errJson.message || `Failed to create route ${idx + 1}`
                  );
                }

                const result = await response.json();
                const apiRoute = result.data || result;

                const newRoute: IRoute = {
                  ...normalizeRoute(apiRoute),
                  index: startIndex + idx,
                  title: aiRoute.route.title,
                  description: aiRoute.route.description,
                  lngStart: aiRoute.route.lngStart,
                  latStart: aiRoute.route.latStart,
                  lngEnd: aiRoute.route.lngEnd,
                  latEnd: aiRoute.route.latEnd,
                  details: aiRoute.route.details || [],
                  costs: [],
                  created_at: apiRoute.created_at || new Date(),
                  updated_at: apiRoute.updated_at || new Date(),
                };

                newRoutes.push(newRoute);
              }

              // Update trip with all new routes
              const updatedRoutes = [...trip.routes, ...newRoutes];
              updatedRoutes.sort((a, b) => (a.index || 0) - (b.index || 0));

              setTrip({
                ...trip,
                routes: updatedRoutes,
                spent_amount: calculateSpentAmount(updatedRoutes),
              });

              setIsRecommendationModalOpen(false);
              console.log(`Successfully added ${newRoutes.length} AI routes`);
            } catch (err: any) {
              console.error("Add All AI Routes Error:", err);
              alert(`Lỗi khi thêm routes: ${err.message}`);
            }
          }}
          onSelectRoute={(routeData) => {
            handleSelectRecommendedRoute(routeData);
          }}
          loading={loadingRecommendations}
        />

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3">
          {/* LEFT: Info & Budget - Enhanced */}
          <div className="space-y-6 lg:col-span-1">
            {/* Info Card - Enhanced */}
            <div className={`rounded-2xl ${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.CARD} p-6 shadow-lg transition-all duration-300`}>
              <h3 className={`mb-5 flex items-center text-xl font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                <div className={`p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3 transition-colors duration-200`}>
                  <Activity className={`h-5 w-5 ${COLORS.TEXT.PRIMARY} transition-colors duration-200`} />
                </div>
                General Info
              </h3>
              <div className="space-y-4">
                <div className={`flex justify-between items-center py-2 border-b ${COLORS.BORDER.LIGHT} transition-colors duration-200`}>
                  <span className={`${COLORS.TEXT.MUTED} flex items-center transition-colors duration-200`}>
                    <Users className={`w-4 h-4 mr-2 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
                    Members
                  </span>
                  <span className={`font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                    {trip.members}
                  </span>
                </div>
                <div className={`flex justify-between items-center py-2 border-b ${COLORS.BORDER.LIGHT} transition-colors duration-200`}>
                  <span className={`${COLORS.TEXT.MUTED} transition-colors duration-200`}>Distance</span>
                  <span className={`font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                    {trip.distance} km
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className={`${COLORS.TEXT.MUTED} transition-colors duration-200`}>Difficulty</span>
                  <span
                    className={`font-bold px-3 py-1 rounded-lg transition-colors duration-200 ${
                      trip.difficult >= 4
                        ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                        : trip.difficult >= 3
                        ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                        : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    }`}
                  >
                    {trip.difficult}/5
                  </span>
                </div>
              </div>
            </div>

            {/* Budget Card - Enhanced */}
            <div className={`rounded-2xl ${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.CARD} p-6 shadow-lg transition-all duration-300`}>
              <h3 className={`mb-5 flex items-center text-xl font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                <div className={`p-2 bg-green-100 dark:bg-green-900/20 rounded-lg mr-3 transition-colors duration-200`}>
                  <DollarSign className={`h-5 w-5 ${COLORS.TEXT.PRIMARY} transition-colors duration-200`} />
                </div>
                Budget
              </h3>

              <div className="mb-6">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className={`${COLORS.TEXT.MUTED} font-medium transition-colors duration-200`}>Progress</span>
                  <span className={`font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                    {budgetUsage.toFixed(0)}%
                  </span>
                </div>
                <div className={`h-3 w-full rounded-full ${COLORS.BACKGROUND.MUTED} overflow-hidden transition-colors duration-200`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      remaining < 0
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : budgetUsage > 80
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                    }`}
                    style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex justify-between items-center py-2 ${COLORS.BACKGROUND.MUTED} rounded-lg px-3 transition-colors duration-200`}>
                  <span className={`${COLORS.TEXT.MUTED} text-sm transition-colors duration-200`}>Total Budget</span>
                  <span className={`font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                    {formatCurrency(totalBudget)}
                  </span>
                </div>
                <div className={`flex justify-between items-center py-2 ${COLORS.BACKGROUND.MUTED} rounded-lg px-3 transition-colors duration-200`}>
                  <span className={`${COLORS.TEXT.MUTED} text-sm transition-colors duration-200`}>Spent</span>
                  <span className="font-bold text-destructive transition-colors duration-200">
                    {formatCurrency(spentAmount)}
                  </span>
                </div>
                <div
                  className={`mt-3 flex justify-between items-center rounded-xl p-4 font-bold transition-colors duration-200 ${
                    remaining < 0
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800"
                      : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800"
                  }`}
                >
                  <span>Remaining</span>
                  <span className="text-lg">{formatCurrency(remaining)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Routes List - Enhanced */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className={`flex items-center text-2xl sm:text-3xl font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                <div className={`p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg mr-3 transition-colors duration-200`}>
                  <MapPin className={`h-6 w-6 ${COLORS.TEXT.PRIMARY} transition-colors duration-200`} />
                </div>
                Itinerary
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGetRecommendations}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Sparkles className="h-5 w-5 transition-colors duration-200" /> Recommend Route
                </button>
                <button
                  onClick={() => setIsAddingRoute(true)}
                  className={`flex items-center gap-2 rounded-xl ${COLORS.PRIMARY.DEFAULT} ${COLORS.PRIMARY.HOVER} px-5 py-2.5 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
                >
                  <PlusCircle className="h-5 w-5 transition-colors duration-200" /> Add Stop
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {trip.routes.length > 0 ? (
                trip.routes.map((route, index) => (
                  <div key={route.id} className="relative">
                    {/* Route number indicator */}
                    <div className={`absolute -left-3 top-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-lg border-2 ${COLORS.BACKGROUND.CARD} transition-colors duration-200`}>
                      {index + 1}
                    </div>
                    <RouteCard
                      route={route}
                      onAddCost={handleAddCost}
                      onDeleteCost={handleDeleteCost}
                      onDeleteRoute={handleDeleteRoute}
                      onEditRoute={handleEditRoute}
                      onEditCost={handleEditCost}
                    />
                  </div>
                ))
              ) : (
                <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.CARD} py-16 text-center transition-all duration-300`}>
                  <div className={`mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/20 p-4 transition-colors duration-200`}>
                    <MapPin className={`h-10 w-10 ${COLORS.TEXT.PRIMARY} transition-colors duration-200`} />
                  </div>
                  <h3 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT} mb-2 transition-colors duration-200`}>
                    No routes yet
                  </h3>
                  <p className={`mt-1 text-sm ${COLORS.TEXT.MUTED} max-w-md transition-colors duration-200`}>
                    Start planning your trip by adding the first location to
                    your itinerary.
                  </p>
                  <button
                    onClick={() => setIsAddingRoute(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Add first route
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trip Route Map - Enhanced */}
        {trip.routes.length > 0 && (
          <div
            className={`mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg transition-opacity ${
              isAddingRoute ? "opacity-50" : "opacity-100"
            }`}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <MapPin className="h-6 w-6 text-indigo-600" />
              </div>
              Trip Route Map
            </h2>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <RouteMap
                routes={trip.routes}
                height="500px"
                showAllRoutes={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailTrip;
