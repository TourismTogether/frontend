"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  CircleMarker,
} from "react-leaflet";
import { ChevronDown, ChevronUp } from "lucide-react";
import L from "leaflet";
import { IRoute } from "@/lib/type/interface";

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface RouteMapProps {
  routes: IRoute[];
  height?: string;
  showAllRoutes?: boolean;
  center?: [number, number];
  zoom?: number;
}

// Helper function to validate coordinates
const isValidCoordinate = (value: number): boolean => {
  return !isNaN(value) && isFinite(value) && value !== 0;
};

const isValidLatitude = (lat: number): boolean => {
  return isValidCoordinate(lat) && lat >= -90 && lat <= 90;
};

const isValidLongitude = (lng: number): boolean => {
  return isValidCoordinate(lng) && lng >= -180 && lng <= 180;
};

const isValidRoute = (route: IRoute): boolean => {
  return (
    isValidLatitude(route.latStart) &&
    isValidLongitude(route.lngStart) &&
    isValidLatitude(route.latEnd) &&
    isValidLongitude(route.lngEnd)
  );
};

// Function to get route path from OSRM (Open Source Routing Machine)
// Retries up to 3 times to ensure we get actual road paths
async function getRoutePath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  retries: number = 3
): Promise<[number, number][] | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Use OSRM demo server (note: has rate limits, for production use your own instance)
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) {
        if (attempt < retries - 1) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, (attempt + 1) * 500)
          );
          continue;
        }
        console.warn("OSRM routing failed after retries");
        return null;
      }

      const data = await response.json();
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates;
        // OSRM returns [lng, lat], we need [lat, lng]
        return coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      }

      // If no route found, retry
      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, (attempt + 1) * 500)
        );
        continue;
      }

      return null;
    } catch (error) {
      if (attempt < retries - 1) {
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, (attempt + 1) * 500)
        );
        continue;
      }
      console.warn("Error fetching route path after retries:", error);
      return null;
    }
  }
  return null;
}

// Function to create smooth curved path using Bezier curves
function createCurvedPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numPoints: number = 20
): [number, number][] {
  const path: [number, number][] = [];

  // Calculate control points for Bezier curve
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;

  // Add perpendicular offset to create curve
  const latDiff = endLat - startLat;
  const lngDiff = endLng - startLng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  // Control point offset (perpendicular to the line)
  const offset = distance * 0.3; // 30% of distance
  const controlLat = midLat + (lngDiff / distance) * offset;
  const controlLng = midLng - (latDiff / distance) * offset;

  // Generate Bezier curve points
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat =
      (1 - t) * (1 - t) * startLat +
      2 * (1 - t) * t * controlLat +
      t * t * endLat;
    const lng =
      (1 - t) * (1 - t) * startLng +
      2 * (1 - t) * t * controlLng +
      t * t * endLng;
    path.push([lat, lng]);
  }

  return path;
}

// Color palette for routes
const routeColors = [
  "#10b981", // Green - first route
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Indigo
];

// Component to fit map bounds to show all routes
function FitBounds({ routes }: { routes: IRoute[] }) {
  const map = useMap();

  useEffect(() => {
    const validRoutes = routes.filter(isValidRoute);
    if (validRoutes.length > 0) {
      try {
        const bounds = validRoutes.reduce((acc, route) => {
          const start: [number, number] = [route.latStart, route.lngStart];
          const end: [number, number] = [route.latEnd, route.lngEnd];
          return acc.extend(start).extend(end);
        }, L.latLngBounds([validRoutes[0].latStart, validRoutes[0].lngStart], [validRoutes[0].latEnd, validRoutes[0].lngEnd]));

        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [routes, map]);

  return null;
}

// Create custom marker icon with route number
function createRouteMarkerIcon(
  routeNumber: number,
  color: string,
  isStart: boolean = false
) {
  const size = isStart ? 40 : 35;
  const fontSize = isStart ? "14px" : "12px";

  return L.divIcon({
    className: "custom-route-marker",
    html: `
      <div style="
        background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${fontSize};
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
      ">
        ${routeNumber}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Create start/end marker icons
function createSpecialMarkerIcon(type: "start" | "end", routeNumber: number) {
  const color = type === "start" ? "#10b981" : "#ef4444";
  const label = type === "start" ? "START" : "END";
  const size = 50;

  return L.divIcon({
    className: "custom-special-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        <div style="
          background: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 10px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
          white-space: nowrap;
        ">${label}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

export const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  height = "500px",
  showAllRoutes = true,
  center,
  zoom = 10,
}) => {
  // State to store route paths
  const [routePaths, setRoutePaths] = useState<Map<string, [number, number][]>>(
    new Map()
  );
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  // Filter out routes with invalid coordinates
  const validRoutes = useMemo(() => {
    return routes
      .filter(isValidRoute)
      .sort((a, b) => (a.index || 0) - (b.index || 0));
  }, [routes]);

  // Fetch route paths for all routes
  useEffect(() => {
    const fetchRoutePaths = async () => {
      if (validRoutes.length === 0) return;

      setLoadingPaths(true);
      const paths = new Map<string, [number, number][]>();

      // Fetch paths for each route sequentially to avoid rate limiting
      for (let i = 0; i < validRoutes.length; i++) {
        const route = validRoutes[i];
        const routeKey =
          route.id ||
          `${route.latStart}-${route.lngStart}-${route.latEnd}-${route.lngEnd}`;

        // Always try to get actual road path from OSRM
        const roadPath = await getRoutePath(
          route.latStart,
          route.lngStart,
          route.latEnd,
          route.lngEnd
        );

        if (roadPath && roadPath.length > 0) {
          paths.set(routeKey, roadPath);
        } else {
          // If OSRM fails, use a simple straight line (not curved)
          // This ensures we always have a path, even if not perfect
          paths.set(routeKey, [
            [route.latStart, route.lngStart],
            [route.latEnd, route.lngEnd],
          ]);
        }

        // Add small delay between requests to avoid rate limiting
        if (i < validRoutes.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      setRoutePaths(paths);
      setLoadingPaths(false);
    };

    fetchRoutePaths();
  }, [validRoutes]);

  // Calculate center if not provided
  const mapCenter = useMemo(() => {
    if (center) return center;
    if (validRoutes.length === 0)
      return [10.7769, 106.7009] as [number, number];

    try {
      const allLats = validRoutes.flatMap((r) => [r.latStart, r.latEnd]);
      const allLngs = validRoutes.flatMap((r) => [r.lngStart, r.lngEnd]);
      const avgLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
      const avgLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length;

      // Validate calculated center
      if (isValidLatitude(avgLat) && isValidLongitude(avgLng)) {
        return [avgLat, avgLng] as [number, number];
      }
    } catch (error) {
      console.error("Error calculating map center:", error);
    }

    return [10.7769, 106.7009] as [number, number]; // Default to Ho Chi Minh City
  }, [center, validRoutes]);

  if (validRoutes.length === 0) {
    return (
      <div
        className="w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-8">
          <p className="text-gray-500 text-lg font-medium mb-2">
            {routes.length === 0
              ? "No routes to display"
              : "No valid routes with coordinates to display"}
          </p>
          <p className="text-gray-400 text-sm">
            Add routes with valid coordinates to see them on the map
          </p>
        </div>
      </div>
    );
  }

  // Create connected path for all routes using actual road paths
  const connectedPath = useMemo(() => {
    if (validRoutes.length === 0) return [];

    const path: [number, number][] = [];

    // Build path using actual route paths from routePaths
    validRoutes.forEach((route, index) => {
      const routeKey =
        route.id ||
        `${route.latStart}-${route.lngStart}-${route.latEnd}-${route.lngEnd}`;

      const routePath = routePaths.get(routeKey);

      if (routePath && routePath.length > 0) {
        // Use actual road path
        if (index === 0) {
          // First route: add all points
          path.push(...routePath);
        } else {
          // Subsequent routes: skip first point (it's the same as previous route's end)
          path.push(...routePath.slice(1));
        }
      } else {
        // Fallback: use start and end points if no path available yet
        if (index === 0) {
          path.push([route.latStart, route.lngStart]);
        }
        path.push([route.latEnd, route.lngEnd]);
      }
    });

    return path;
  }, [validRoutes, routePaths]);

  return (
    <div
      className="w-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg relative"
      style={{ height }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showAllRoutes && validRoutes.length > 0 && (
          <FitBounds routes={validRoutes} />
        )}

        {/* Draw connected path showing full journey */}
        {connectedPath.length > 1 && (
          <Polyline
            positions={connectedPath}
            color="#6366f1"
            weight={3}
            opacity={0.4}
            dashArray="10, 5"
          />
        )}

        {/* Draw individual route polylines with distinct colors */}
        {validRoutes.map((route, index) => {
          const routeNumber = (route.index || 0) + 1;
          const color = routeColors[index % routeColors.length];
          const routeKey =
            route.id ||
            `${route.latStart}-${route.lngStart}-${route.latEnd}-${route.lngEnd}`;

          // Get the path (road path or curved path)
          const path = routePaths.get(routeKey) || [
            [route.latStart, route.lngStart],
            [route.latEnd, route.lngEnd],
          ];

          // Check if this route's start point is the same as previous route's end point
          const prevRoute = index > 0 ? validRoutes[index - 1] : null;
          const isStartPointShared =
            prevRoute &&
            Math.abs(route.latStart - prevRoute.latEnd) < 0.0001 &&
            Math.abs(route.lngStart - prevRoute.lngEnd) < 0.0001;

          // Check if this route's end point is the same as next route's start point
          const nextRoute =
            index < validRoutes.length - 1 ? validRoutes[index + 1] : null;
          const isEndPointShared =
            nextRoute &&
            Math.abs(route.latEnd - nextRoute.latStart) < 0.0001 &&
            Math.abs(route.lngEnd - nextRoute.lngStart) < 0.0001;

          return (
            <React.Fragment key={route.id || `route-${index}`}>
              {/* Add a shadow/outline for better visibility (rendered first, behind main line) */}
              <Polyline
                positions={path}
                color="#000000"
                weight={8}
                opacity={0.2}
                lineCap="round"
                lineJoin="round"
                smoothFactor={1}
              />
              {/* Main route line */}
              <Polyline
                positions={path}
                color={color}
                weight={6}
                opacity={0.9}
                lineCap="round"
                lineJoin="round"
                smoothFactor={1}
              />

              {/* Start marker with route number - only show if not shared with previous route's end */}
              {!isStartPointShared && (
                <Marker
                  position={[route.latStart, route.lngStart]}
                  icon={
                    index === 0
                      ? createSpecialMarkerIcon("start", routeNumber)
                      : createRouteMarkerIcon(routeNumber, color, true)
                  }
                >
                  <Popup className="route-popup">
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <p className="font-bold text-base text-gray-900">
                          Route {routeNumber}: {route.title || "Untitled Route"}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {route.description || "No description"}
                      </p>
                      <div className="border-t pt-2 mt-2 space-y-1">
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">Start:</span>{" "}
                          {route.latStart.toFixed(6)},{" "}
                          {route.lngStart.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">End:</span>{" "}
                          {route.latEnd.toFixed(6)}, {route.lngEnd.toFixed(6)}
                        </p>
                        {route.details && route.details.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-500 mb-1">
                              Activities:
                            </p>
                            <ul className="text-xs text-gray-600 space-y-0.5">
                              {route.details.slice(0, 3).map((detail, i) => (
                                <li key={i}>• {detail}</li>
                              ))}
                              {route.details.length > 3 && (
                                <li className="text-gray-400">
                                  +{route.details.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* End marker - show if it's the last route, or if end point is not shared with next route */}
              {index === validRoutes.length - 1 && (
                <Marker
                  position={[route.latEnd, route.lngEnd]}
                  icon={
                    index === validRoutes.length - 1
                      ? createSpecialMarkerIcon("end", routeNumber)
                      : createRouteMarkerIcon(routeNumber, color, false)
                  }
                >
                  <Popup className="route-popup">
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <p className="font-bold text-base text-gray-900">
                          {index === validRoutes.length - 1
                            ? `Final Destination: ${
                                route.title || "Route " + routeNumber
                              }`
                            : `Route ${routeNumber} End`}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {index === validRoutes.length - 1
                          ? route.description || "End of journey"
                          : "End point of this route"}
                      </p>
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">Coordinates:</span>{" "}
                          {route.latEnd.toFixed(6)}, {route.lngEnd.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Connection marker - show only once when end point is shared with next route's start */}
              {isEndPointShared && index < validRoutes.length - 1 && (
                <Marker
                  position={[route.latEnd, route.lngEnd]}
                  icon={createRouteMarkerIcon(routeNumber, color, false)}
                >
                  <Popup className="route-popup">
                    <div className="p-3 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <p className="font-bold text-base text-gray-900">
                          Route {routeNumber} ↔ Route {routeNumber + 1}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Connection point between routes
                      </p>
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">Coordinates:</span>{" "}
                          {route.latEnd.toFixed(6)}, {route.lngEnd.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Route Legend */}
      {validRoutes.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-w-xs pointer-events-auto overflow-hidden">
          {/* Legend Header with Toggle Button */}
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
          >
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Route Legend ({validRoutes.length})
            </p>
            {isLegendOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            )}
          </div>

          {/* Legend Content - Collapsible */}
          {isLegendOpen && (
            <div className="px-3 pb-3 border-t border-gray-100">
              <div className="space-y-1.5 max-h-48 overflow-y-auto mt-2">
                {validRoutes.map((route, index) => {
                  const routeNumber = (route.index || 0) + 1;
                  const color = routeColors[index % routeColors.length];
                  return (
                    <div
                      key={route.id || index}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="font-semibold text-gray-700">
                        Route {routeNumber}:
                      </span>
                      <span className="text-gray-600 truncate">
                        {route.title || "Untitled"}
                      </span>
                    </div>
                  );
                })}
              </div>
              {validRoutes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-500 shrink-0"></div>
                    <span className="text-gray-600">Start Point</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0"></div>
                    <span className="text-gray-600">End Point</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
