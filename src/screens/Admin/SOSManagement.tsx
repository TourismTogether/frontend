"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Navigation,
  RefreshCw,
  Filter,
  X,
  UserPlus,
  Users,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Dynamically import MapContainer to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Custom icons for different SOS statuses
// This function will only be called on client-side since MapContainer has ssr: false
const createCustomIcon = (color: string) => {
  if (typeof window === "undefined") {
    return null;
  }
  
  // Lazy load Leaflet only when needed
  const L = require("leaflet");
  
  // Fix for default marker icon in Next.js (only needed once)
  if (!(L.Icon.Default.prototype as any)._iconUrlFixed) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
    (L.Icon.Default.prototype as any)._iconUrlFixed = true;
  }
  
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      <span style="color: white; font-size: 18px;">!</span>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

interface SOSRequest {
  user_id: string;
  latitude: number;
  longitude: number;
  is_safe: boolean;
  is_shared_location: boolean;
  emergency_contacts?: string[] | null;
  user_full_name?: string;
  user_phone?: string;
  user_avatar_url?: string;
}

type SOSStatus = "all" | "pending" | "in_progress" | "completed";

interface Supporter {
  user_id: string;
  is_available: boolean;
  user_full_name?: string;
  user_phone?: string;
  user_avatar_url?: string;
}

export const SOSManagement: React.FC = () => {
  const [sosRequests, setSOSRequests] = useState<SOSRequest[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SOSRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<SOSStatus>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedSupporterId, setSelectedSupporterId] = useState<string>("");
  const [assigningSupporter, setAssigningSupporter] = useState<string | null>(null);

  const fetchSOSRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/travellers/sos/all`, {
        credentials: "include",
      });
      const result = await res.json();

      if (result.status === 200 && result.data) {
        setSOSRequests(result.data);
      } else {
        setSOSRequests([]);
      }
    } catch (error) {
      setSOSRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSupporters = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/supporters/with-user-info`, {
        credentials: "include",
      });
      const result = await res.json();

      if (result.status === 200 && result.data) {
        setSupporters(result.data);
      } else {
        setSupporters([]);
      }
    } catch (error) {
      setSupporters([]);
    }
  }, []);

  useEffect(() => {
    fetchSOSRequests();
    fetchSupporters();
    // Polling every 10 seconds for updates
    const interval = setInterval(fetchSOSRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchSOSRequests, fetchSupporters]);

  // Prevent body scroll and manage z-index when modal is open
  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    if (selectedRequest) {
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      // Lower Leaflet map z-index
      const leafletContainers = document.querySelectorAll(".leaflet-container");
      leafletContainers.forEach((container) => {
        (container as HTMLElement).style.zIndex = "1";
      });
    } else {
      // Restore body scroll
      document.body.style.overflow = "";
      // Restore Leaflet map z-index
      const leafletContainers = document.querySelectorAll(".leaflet-container");
      leafletContainers.forEach((container) => {
        (container as HTMLElement).style.zIndex = "";
      });
    }
    return () => {
      if (typeof window === "undefined") return;
      document.body.style.overflow = "";
      const leafletContainers = document.querySelectorAll(".leaflet-container");
      leafletContainers.forEach((container) => {
        (container as HTMLElement).style.zIndex = "";
      });
    };
  }, [selectedRequest]);

  const getSOSStatus = (request: SOSRequest): "pending" | "in_progress" | "completed" => {
    if (request.is_safe) {
      return "completed";
    }
    if (request.emergency_contacts && request.emergency_contacts.length > 0) {
      return "in_progress";
    }
    return "pending";
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-orange-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "#eab308"; // yellow
      case "in_progress":
        return "#f97316"; // orange
      case "completed":
        return "#22c55e"; // green
      default:
        return "#6b7280"; // gray
    }
  };

  const handleResolveEmergency = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`${API_URL}/travellers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          is_safe: true,
          is_shared_location: false,
          emergency_contacts: [],
        }),
      });

      if (res.ok) {
        await fetchSOSRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      alert("Failed to resolve emergency. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignSupporter = async (userId: string, supporterId: string) => {
    if (!supporterId) {
      alert("Please select a supporter");
      return;
    }

    setAssigningSupporter(userId);
    try {
      const request = sosRequests.find((r) => r.user_id === userId);
      if (!request) {
        alert("SOS request not found");
        return;
      }

      const currentContacts = request.emergency_contacts || [];
      if (currentContacts.includes(supporterId)) {
        alert("This supporter is already assigned to this SOS request");
        return;
      }

      const updatedContacts = [...currentContacts, supporterId];

      const res = await fetch(`${API_URL}/travellers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          emergency_contacts: updatedContacts,
        }),
      });

      if (res.ok) {
        // Fetch updated SOS requests
        const result = await fetch(`${API_URL}/travellers/sos/all`, {
          credentials: "include",
        });
        const fetchResult = await result.json();
        if (fetchResult.status === 200 && fetchResult.data) {
          setSOSRequests(fetchResult.data);
          setSelectedSupporterId("");
          // Update selectedRequest if it's the one being modified
          if (selectedRequest?.user_id === userId) {
            const updatedRequest = fetchResult.data.find((r: SOSRequest) => r.user_id === userId);
            if (updatedRequest) {
              setSelectedRequest(updatedRequest);
            }
          }
        }
      } else {
        alert("Failed to assign supporter. Please try again.");
      }
    } catch (error) {
      alert("Failed to assign supporter. Please try again.");
    } finally {
      setAssigningSupporter(null);
    }
  };

  const handleRemoveSupporter = async (userId: string, supporterId: string) => {
    setAssigningSupporter(userId);
    try {
      const request = sosRequests.find((r) => r.user_id === userId);
      if (!request) {
        alert("SOS request not found");
        return;
      }

      const currentContacts = request.emergency_contacts || [];
      const updatedContacts = currentContacts.filter((id) => id !== supporterId);

      const res = await fetch(`${API_URL}/travellers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          emergency_contacts: updatedContacts,
        }),
      });

      if (res.ok) {
        // Fetch updated SOS requests
        const result = await fetch(`${API_URL}/travellers/sos/all`, {
          credentials: "include",
        });
        const fetchResult = await result.json();
        if (fetchResult.status === 200 && fetchResult.data) {
          setSOSRequests(fetchResult.data);
          // Update selectedRequest if it's the one being modified
          if (selectedRequest?.user_id === userId) {
            const updatedRequest = fetchResult.data.find((r: SOSRequest) => r.user_id === userId);
            if (updatedRequest) {
              setSelectedRequest(updatedRequest);
            }
          }
        }
      } else {
        alert("Failed to remove supporter. Please try again.");
      }
    } catch (error) {
      alert("Failed to remove supporter. Please try again.");
    } finally {
      setAssigningSupporter(null);
    }
  };

  const getSupporterInfo = (supporterId: string): Supporter | undefined => {
    return supporters.find((s) => s.user_id === supporterId);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  const filteredRequests = sosRequests.filter((request) => {
    if (statusFilter === "all") return true;
    const status = getSOSStatus(request);
    return status === statusFilter;
  });

  const pendingCount = sosRequests.filter((r) => getSOSStatus(r) === "pending").length;
  const inProgressCount = sosRequests.filter((r) => getSOSStatus(r) === "in_progress").length;
  const completedCount = sosRequests.filter((r) => getSOSStatus(r) === "completed").length;

  // Calculate map center and bounds
  const activeRequests = filteredRequests.filter((r) => !r.is_safe);
  const defaultCenter: [number, number] = [10.762880383009653, 106.6824797006774]; // Ho Chi Minh City
  const mapCenter = activeRequests.length > 0
    ? [activeRequests[0].latitude, activeRequests[0].longitude] as [number, number]
    : defaultCenter;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total SOS</p>
              <p className="text-2xl font-bold text-gray-900">{sosRequests.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">{inProgressCount}</p>
            </div>
            <Navigation className="w-8 h-8 text-orange-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "in_progress"
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "completed"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Completed ({completedCount})
          </button>
          <div className="ml-auto">
            <button
              onClick={fetchSOSRequests}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Map and List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-[600px] w-full">
            {typeof window !== "undefined" && (
              <MapContainer
                center={mapCenter}
                zoom={activeRequests.length > 0 ? 12 : 10}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {filteredRequests.map((request) => {
                  const status = getSOSStatus(request);
                  const markerColor = getMarkerColor(status);
                  return (
                    <Marker
                      key={request.user_id}
                      position={[request.latitude, request.longitude]}
                      icon={createCustomIcon(markerColor)}
                      eventHandlers={{
                        click: () => setSelectedRequest(request),
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-semibold">{request.user_full_name || "Unknown"}</p>
                          <p className="text-sm text-gray-600">
                            Status: {getStatusLabel(status)}
                          </p>
                          {request.user_phone && (
                            <p className="text-sm text-gray-600">Phone: {request.user_phone}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </div>

        {/* SOS Requests List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">SOS Requests</h2>
            <p className="text-sm text-gray-500">
              {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading && filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Loading SOS requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No SOS requests found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const status = getSOSStatus(request);
                  const isSelected = selectedRequest?.user_id === request.user_id;
                  return (
                    <div
                      key={request.user_id}
                      onClick={() => setSelectedRequest(request)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50 border-l-4 border-indigo-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {request.user_full_name || "Unknown User"}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                status
                              )} text-white`}
                            >
                              {getStatusLabel(status)}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
                              </span>
                            </div>
                            {request.user_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{request.user_phone}</span>
                              </div>
                            )}
                            {request.emergency_contacts &&
                              request.emergency_contacts.length > 0 && (
                                <div className="text-xs text-orange-600 mt-1">
                                  Assigned to {request.emergency_contacts.length} supporter
                                  {request.emergency_contacts.length !== 1 ? "s" : ""}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                      {!request.is_safe && (
                        <div className="mt-3 flex gap-2">
                          {request.user_phone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCall(request.user_phone!);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openGoogleMaps(request.latitude, request.longitude);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Navigation className="w-4 h-4" />
                            Navigate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveEmergency(request.user_id);
                            }}
                            disabled={processingId === request.user_id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Request Details Modal */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedRequest(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative"
            style={{ zIndex: 10000 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">SOS Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            {/* Content - Scrollable */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-medium text-gray-700">Traveler Name</label>
                <p className="text-gray-900">{selectedRequest.user_full_name || "Unknown"}</p>
              </div>
              {selectedRequest.user_phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-gray-900">{selectedRequest.user_phone}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      getSOSStatus(selectedRequest)
                    )} text-white`}
                  >
                    {getStatusLabel(getSOSStatus(selectedRequest))}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-gray-900">
                  {selectedRequest.latitude.toFixed(6)}, {selectedRequest.longitude.toFixed(6)}
                </p>
              </div>
              {/* Assign Supporter Section */}
              {!selectedRequest.is_safe && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Assign Supporter
                  </label>
                  <div className="flex gap-2 mb-4">
                    <select
                      value={selectedSupporterId}
                      onChange={(e) => setSelectedSupporterId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={assigningSupporter === selectedRequest.user_id}
                    >
                      <option value="">Select a supporter...</option>
                      {supporters
                        .filter(
                          (s) =>
                            !selectedRequest.emergency_contacts?.includes(s.user_id)
                        )
                        .map((supporter) => (
                          <option key={supporter.user_id} value={supporter.user_id}>
                            {supporter.user_full_name || supporter.user_id}
                            {supporter.user_phone && ` - ${supporter.user_phone}`}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() =>
                        handleAssignSupporter(
                          selectedRequest.user_id,
                          selectedSupporterId
                        )
                      }
                      disabled={
                        !selectedSupporterId ||
                        assigningSupporter === selectedRequest.user_id
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign
                    </button>
                  </div>
                </div>
              )}

              {/* Assigned Supporters List */}
              {selectedRequest.emergency_contacts &&
                selectedRequest.emergency_contacts.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      <Users className="w-4 h-4 inline mr-1" />
                      Assigned Supporters ({selectedRequest.emergency_contacts.length})
                    </label>
                    <div className="space-y-2">
                      {selectedRequest.emergency_contacts.map((supporterId) => {
                        const supporter = getSupporterInfo(supporterId);
                        return (
                          <div
                            key={supporterId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {supporter?.user_avatar_url ? (
                                <img
                                  src={supporter.user_avatar_url}
                                  alt={supporter.user_full_name || supporterId}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-indigo-600" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {supporter?.user_full_name || supporterId}
                                </p>
                                {supporter?.user_phone && (
                                  <p className="text-xs text-gray-500">
                                    {supporter.user_phone}
                                  </p>
                                )}
                              </div>
                            </div>
                            {!selectedRequest.is_safe && (
                              <button
                                onClick={() =>
                                  handleRemoveSupporter(
                                    selectedRequest.user_id,
                                    supporterId
                                  )
                                }
                                disabled={
                                  assigningSupporter === selectedRequest.user_id
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Remove supporter"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              {!selectedRequest.is_safe && (
                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  {selectedRequest.user_phone && (
                    <button
                      onClick={() => handleCall(selectedRequest.user_phone!)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Call Traveler
                    </button>
                  )}
                  <button
                    onClick={() =>
                      openGoogleMaps(selectedRequest.latitude, selectedRequest.longitude)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Navigation className="w-5 h-5" />
                    Navigate to Location
                  </button>
                  <button
                    onClick={() => handleResolveEmergency(selectedRequest.user_id)}
                    disabled={processingId === selectedRequest.user_id}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 ml-auto"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Resolve Emergency
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

