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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AddRouteForm } from "./AddRouteForm";
import { RouteCard } from "@/components/Route/RouteCard";
import { ICost, IRoute, ITrip, IDestination } from "@/lib/type/interface";

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
    const routeCost = currentCosts.reduce(
      (sumCost, cost) => sumCost + (cost.amount || 0),
      0
    );
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
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

// Normalize API cost response to match ICost interface
const normalizeCost = (
  apiCost: any,
  defaultCurrency: string = "VND"
): ICost => {
  return {
    id: apiCost.id,
    title: apiCost.title || "",
    description: apiCost.description || "",
    amount: apiCost.cost || apiCost.amount || 0,
    category: apiCost.category || "other",
    currency: apiCost.currency || defaultCurrency,
    route_id: apiCost.route_id,
    created_at: apiCost.created_at,
    updated_at: apiCost.updated_at,
  };
};

const normalizeRoute = (apiRoute: any): IRoute => {
  return {
    id: apiRoute.id,
    index: Number(apiRoute.index) || 0,
    trip_id: apiRoute.trip_id,
    title: apiRoute.title || "",
    description: apiRoute.description || "",
    lngStart: Number(apiRoute.lngStart) || 0,
    latStart: Number(apiRoute.latStart) || 0,
    lngEnd: Number(apiRoute.lngEnd) || 0,
    latEnd: Number(apiRoute.latEnd) || 0,
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

  useEffect(() => {
    const fetchTripAndRoutes = async () => {
      if (!tripId || !API_URL) return;

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
        const routesResponse = await fetch(`${API_URL}/trips/${tripId}/routes`);
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

        // Sort routes by index
        routesWithCosts.sort((a, b) => (a.index || 0) - (b.index || 0));

        // Calculate spent amount
        const spentAmount = calculateSpentAmount(routesWithCosts);

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
          routes: routesWithCosts,
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

      setTrip({
        ...trip,
        routes: updatedRoutes,
        spent_amount: calculateSpentAmount(updatedRoutes),
      });
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

      setTrip({
        ...trip,
        routes: updatedRoutes,
        spent_amount: calculateSpentAmount(updatedRoutes),
      });
    } catch (err) {
      console.error("Delete cost error:", err);
      alert("Failed to delete cost");
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold">Error Loading Trip</h2>
        <p className="text-muted-foreground">{error || "Trip not found"}</p>
        <button
          onClick={() => router.push("/trips")}
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Back to Trips
        </button>
      </div>
    );
  }

  const budgetUsage =
    trip.total_budget > 0 ? (trip.spent_amount / trip.total_budget) * 100 : 0;
  const remaining = trip.total_budget - trip.spent_amount;

  const destinationName = trip.destination?.name || "Unknown Destination";

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 relative">
      {/* Modal Add Route */}
      {isAddingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <AddRouteForm
              onClose={() => setIsAddingRoute(false)}
              onSubmit={handleAddNewRoute}
              currentMaxIndex={
                trip.routes.length > 0
                  ? Math.max(...trip.routes.map((r) => r.index || 0))
                  : 0
              }
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Navigation */}
        <button
          onClick={() => router.push("/trips")}
          className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </button>

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {trip.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                  trip.status
                )}`}
              >
                {trip.status}
              </span>
              <span className="flex items-center text-sm text-gray-500">
                <Calendar className="mr-1.5 h-4 w-4" />
                {new Date(trip.start_date).toLocaleDateString("vi-VN")} -{" "}
                {new Date(trip.end_date).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Destination</p>
            <p className="text-lg font-medium text-gray-900">
              {destinationName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* LEFT: Info & Budget */}
          <div className="space-y-6 lg:col-span-1">
            {/* Info Card */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-bold text-gray-900">
                <Activity className="mr-2 h-5 w-5 text-blue-500" /> General Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Members</span>
                  <span className="font-medium flex items-center">
                    <Users className="w-3 h-3 mr-1" /> {trip.members}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Distance</span>
                  <span className="font-medium">{trip.distance} km</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Difficulty</span>
                  <span className="font-medium text-orange-600">
                    {trip.difficult}/5
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-gray-600 italic">{trip.description}</p>
                </div>
              </div>
            </div>

            {/* Budget Card */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-bold text-gray-900">
                <DollarSign className="mr-2 h-5 w-5 text-green-600" /> Budget
              </h3>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium">{budgetUsage.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      remaining < 0 ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Budget:</span>
                  <span className="font-medium">
                    {formatCurrency(trip.total_budget)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Spent:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(trip.spent_amount)}
                  </span>
                </div>
                <div
                  className={`mt-2 flex justify-between rounded-lg p-2 font-bold ${
                    remaining < 0
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  <span>Remaining:</span>
                  <span>{formatCurrency(remaining)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Routes List */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center text-2xl font-bold text-gray-900">
                <MapPin className="mr-2 h-6 w-6 text-indigo-500" /> Itinerary
              </h2>
              <button
                onClick={() => setIsAddingRoute(true)}
                className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 hover:bg-gray-800"
              >
                <PlusCircle className="h-4 w-4" /> Add Stop
              </button>
            </div>

            <div className="space-y-4">
              {trip.routes.length > 0 ? (
                trip.routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onAddCost={handleAddCost}
                    onDeleteCost={handleDeleteCost}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
                  <div className="mb-3 rounded-full bg-gray-50 p-3">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    No routes yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start planning your trip by adding the first location.
                  </p>
                  <button
                    onClick={() => setIsAddingRoute(true)}
                    className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Add first route
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailTrip;
