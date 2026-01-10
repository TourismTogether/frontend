// Route Recommendation Algorithm Service
// This service provides intelligent route recommendations based on:
// 1. Popular routes from other trips
// 2. Proximity to trip destination
// 3. Similar trip patterns
// 4. Route popularity and frequency

import { IRoute } from "@/lib/type/interface";
import { IDestination } from "@/screens/Trips/Trips";

export interface RecommendedRoute {
  route: IRoute;
  score: number;
  reasons: string[];
  sourceTrip?: {
    id: string;
    title: string;
    destination?: IDestination;
  };
}

interface RouteWithTrip {
  route: IRoute;
  trip: {
    id: string;
    title: string;
    destination_id: string;
    destination?: IDestination;
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetch all routes from all trips (excluding current trip)
 */
async function fetchAllRoutes(
  API_URL: string,
  excludeTripId: string
): Promise<RouteWithTrip[]> {
  try {
    // Fetch all trips
    const tripsResponse = await fetch(`${API_URL}/trips`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!tripsResponse.ok) return [];

    const tripsResult = await tripsResponse.json();
    const trips = Array.isArray(tripsResult.data)
      ? tripsResult.data
      : tripsResult.data
      ? [tripsResult.data]
      : [];

    // Filter out current trip
    const otherTrips = trips.filter(
      (trip: any) => trip.id && trip.id !== excludeTripId
    );

    // Fetch routes for each trip
    const routesWithTrips: RouteWithTrip[] = [];

    await Promise.all(
      otherTrips.map(async (trip: any) => {
        try {
          if (!trip.id || trip.id === "NaN" || trip.id === "undefined") {
            return;
          }
          const routesResponse = await fetch(
            `${API_URL}/trips/${String(trip.id)}/routes`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (routesResponse.ok) {
            const routesResult = await routesResponse.json();
            const routes = Array.isArray(routesResult.data)
              ? routesResult.data
              : routesResult.data
              ? [routesResult.data]
              : [];

            routes.forEach((route: any) => {
              // Normalize route coordinates
              const latStart = Number(route.latStart ?? route.lat_start ?? 0);
              const lngStart = Number(route.lngStart ?? route.lng_start ?? 0);
              const latEnd = Number(route.latEnd ?? route.lat_end ?? 0);
              const lngEnd = Number(route.lngEnd ?? route.lng_end ?? 0);

              if (latStart && lngStart && latEnd && lngEnd) {
                routesWithTrips.push({
                  route: {
                    id: route.id,
                    index: Number(route.index) || 0,
                    trip_id: route.trip_id,
                    title: route.title || "",
                    description: route.description || "",
                    lngStart,
                    latStart,
                    lngEnd,
                    latEnd,
                    details: Array.isArray(route.details) ? route.details : [],
                    costs: [],
                    created_at: route.created_at,
                    updated_at: route.updated_at,
                  },
                  trip: {
                    id: trip.id,
                    title: trip.title || "Untitled Trip",
                    destination_id: trip.destination_id,
                    destination: trip.destination,
                  },
                });
              }
            });
          }
        } catch (err) {
          console.warn(`Error fetching routes for trip ${trip.id}:`, err);
        }
      })
    );

    return routesWithTrips;
  } catch (error) {
    console.error("Error fetching all routes:", error);
    return [];
  }
}

/**
 * Main recommendation algorithm
 */
export async function recommendRoutes(
  API_URL: string,
  currentTrip: {
    id: string;
    destination_id: string;
    destination?: IDestination;
    routes: IRoute[];
  },
  maxRecommendations: number = 5
): Promise<RecommendedRoute[]> {
  if (!API_URL || !currentTrip.id) {
    return [];
  }

  // Fetch all routes from other trips
  const allRoutesWithTrips = await fetchAllRoutes(API_URL, currentTrip.id);

  if (allRoutesWithTrips.length === 0) {
    return [];
  }

  // Get current trip destination coordinates
  const currentDestLat = currentTrip.destination?.latitude || 0;
  const currentDestLng = currentTrip.destination?.longitude || 0;

  // Calculate scores for each route
  const scoredRoutes: RecommendedRoute[] = allRoutesWithTrips.map(
    ({ route, trip }) => {
      const reasons: string[] = [];
      let score = 0;

      // 1. Proximity to destination (40% weight)
      if (currentDestLat && currentDestLng) {
        const routeCenterLat = (route.latStart + route.latEnd) / 2;
        const routeCenterLng = (route.lngStart + route.lngEnd) / 2;
        const distance = calculateDistance(
          currentDestLat,
          currentDestLng,
          routeCenterLat,
          routeCenterLng
        );

        // Score decreases with distance (max 100km for full points)
        const proximityScore = Math.max(0, 40 * (1 - distance / 100));
        score += proximityScore;

        if (distance < 50) {
          reasons.push(`Close to your destination (${distance.toFixed(1)}km)`);
        }
      }

      // 2. Route popularity (30% weight)
      // Count how many times similar routes appear
      const similarRoutes = allRoutesWithTrips.filter(
        (rt) =>
          rt.route.title.toLowerCase() === route.title.toLowerCase() ||
          (Math.abs(rt.route.latStart - route.latStart) < 0.01 &&
            Math.abs(rt.route.lngStart - route.lngStart) < 0.01)
      );

      const popularityScore = Math.min(30, similarRoutes.length * 5);
      score += popularityScore;

      if (similarRoutes.length > 1) {
        reasons.push(
          `Popular route (used in ${similarRoutes.length} other trips)`
        );
      }

      // 3. Route completeness (20% weight)
      // Routes with more details are better
      const detailScore = Math.min(20, route.details.length * 4);
      score += detailScore;

      if (route.details.length > 2) {
        reasons.push(`Well-detailed route with ${route.details.length} activities`);
      }

      // 4. Same destination region (10% weight)
      if (
        trip.destination_id === currentTrip.destination_id ||
        (trip.destination?.country === currentTrip.destination?.country &&
          trip.destination?.country)
      ) {
        score += 10;
        reasons.push("From trips to the same destination");
      }

      return {
        route,
        score: Math.round(score * 10) / 10, // Round to 1 decimal
        reasons: reasons.length > 0 ? reasons : ["General recommendation"],
        sourceTrip: {
          id: trip.id,
          title: trip.title,
          destination: trip.destination,
        },
      };
    }
  );

  // Filter out routes that are too similar to existing routes
  const filteredRoutes = scoredRoutes.filter((recommended) => {
    return !currentTrip.routes.some((existingRoute) => {
      const distance = calculateDistance(
        existingRoute.latStart,
        existingRoute.lngStart,
        recommended.route.latStart,
        recommended.route.lngStart
      );
      return distance < 1; // Less than 1km apart
    });
  });

  // Sort by score (highest first) and return top N
  return filteredRoutes
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);
}

/**
 * Get route recommendations based on destination proximity only
 * (Simpler version for when we don't have access to all trips)
 */
export function recommendRoutesByProximity(
  allDestinations: IDestination[],
  currentDestination: IDestination,
  existingRoutes: IRoute[],
  maxRecommendations: number = 5
): RecommendedRoute[] {
  if (!currentDestination.latitude || !currentDestination.longitude) {
    return [];
  }

  // Find nearby destinations
  const nearbyDestinations = allDestinations
    .map((dest) => {
      if (!dest.latitude || !dest.longitude || dest.id === currentDestination.id) {
        return null;
      }

      const distance = calculateDistance(
        currentDestination.latitude,
        currentDestination.longitude,
        dest.latitude,
        dest.longitude
      );

      if (distance > 200) return null; // Too far

      return {
        destination: dest,
        distance,
      };
    })
    .filter((d): d is { destination: IDestination; distance: number } => d !== null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxRecommendations);

  // Convert to recommended routes
  return nearbyDestinations.map(({ destination, distance }) => ({
    route: {
      index: 0,
      trip_id: "",
      title: `Visit ${destination.name}`,
      description: destination.description || `Explore ${destination.name}`,
      lngStart: destination.longitude,
      latStart: destination.latitude,
      lngEnd: destination.longitude,
      latEnd: destination.latitude,
      details: [
        `Visit ${destination.name}`,
        destination.category || "General",
        destination.best_season || "All year",
      ],
      costs: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
    score: Math.max(0, 100 - distance),
    reasons: [
      `Nearby destination (${distance.toFixed(1)}km away)`,
      destination.category ? `Category: ${destination.category}` : "",
    ].filter(Boolean),
  }));
}

