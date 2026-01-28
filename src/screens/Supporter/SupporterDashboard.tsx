"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  MapPin,
  Phone,
  CheckCircle,
  Navigation,
  RefreshCw,
  X,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Clock,
  Activity,
  Shield,
} from "lucide-react";
import { API_ENDPOINTS } from "../../constants/api";
import { useAuth } from "../../contexts/AuthContext";

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

export const SupporterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sosRequests, setSOSRequests] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SOSRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<SOSStatus>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  // Fetch supporter's SOS requests
  const fetchMySOSRequests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.TRAVELLERS.SOS_BY_SUPPORTER(String(user.id)), {
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
  }, [user?.id]);

  // Fetch supporter availability
  const fetchSupporterInfo = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(API_ENDPOINTS.SUPPORTERS.BY_ID(String(user.id)), {
        credentials: "include",
      });
      const result = await res.json();

      if (result.status === 200 && result.data) {
        setIsAvailable(result.data.is_available ?? true);
      }
    } catch (error) {
      console.error("Error fetching supporter info:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMySOSRequests();
    fetchSupporterInfo();
    // Polling every 10 seconds for updates
    const interval = setInterval(fetchMySOSRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchMySOSRequests, fetchSupporterInfo]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedRequest) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof window === "undefined") return;
      document.body.style.overflow = "";
    };
  }, [selectedRequest]);

  const toggleAvailability = async () => {
    if (!user?.id) return;
    
    setUpdatingAvailability(true);
    try {
      const res = await fetch(API_ENDPOINTS.SUPPORTERS.UPDATE(String(user.id)), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_available: !isAvailable }),
      });

      if (res.ok) {
        setIsAvailable(!isAvailable);
      } else {
        alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
      }
    } catch (error) {
      alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    } finally {
      setUpdatingAvailability(false);
    }
  };

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
        return "Chờ xử lý";
      case "in_progress":
        return "Đang xử lý";
      case "completed":
        return "Hoàn thành";
      default:
        return "—";
    }
  };

  const handleResolveEmergency = async (userId: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch(API_ENDPOINTS.TRAVELLERS.UPDATE(String(userId)), {
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
        await fetchMySOSRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      alert("Không thể đánh dấu đã xử lý. Vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                Supporter Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Quản lý các yêu cầu SOS được giao cho bạn
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card">
                <span className="text-sm text-muted-foreground">Trạng thái:</span>
                <button
                  onClick={toggleAvailability}
                  disabled={updatingAvailability}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  {updatingAvailability ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : isAvailable ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-muted-foreground">Offline</span>
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={fetchMySOSRequests}
                disabled={loading}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 text-foreground ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Tổng số</span>
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{sosRequests.length}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400">Chờ xử lý</span>
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-700 dark:text-yellow-400">{pendingCount}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-orange-700 dark:text-orange-400">Đang xử lý</span>
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-orange-700 dark:text-orange-400">{inProgressCount}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-green-700 dark:text-green-400">Hoàn thành</span>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-400">{completedCount}</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "pending", "in_progress", "completed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s === "all" ? "Tất cả" : s === "pending" ? "Chờ xử lý" : s === "in_progress" ? "Đang xử lý" : "Hoàn thành"}
              </button>
            ))}
          </div>
        </div>

        {/* SOS Requests List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Danh sách SOS</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {filteredRequests.length} yêu cầu {statusFilter !== "all" && `(${getStatusLabel(statusFilter)})`}
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading && filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-foreground mb-1">Chưa có yêu cầu SOS nào</p>
                <p className="text-xs text-muted-foreground">Các yêu cầu được giao cho bạn sẽ hiển thị ở đây</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredRequests.map((request) => {
                  const status = getSOSStatus(request);
                  const isSelected = selectedRequest?.user_id === request.user_id;
                  return (
                    <div
                      key={request.user_id}
                      onClick={() => setSelectedRequest(request)}
                      className={`p-4 sm:p-6 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/5 border-l-4 border-primary"
                          : "hover:bg-muted/50 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                            <span className="font-semibold text-base sm:text-lg text-foreground">
                              {request.user_full_name || "Người dùng"}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-semibold text-white shrink-0 ${getStatusColor(status)}`}
                            >
                              {getStatusLabel(status)}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                            {request.user_phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-4 h-4" />
                                <a
                                  href={`tel:${request.user_phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-foreground hover:underline"
                                >
                                  {request.user_phone}
                                </a>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span className="font-mono text-xs">
                                {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!request.is_safe && (
                          <div
                            className="flex gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {request.user_phone && (
                              <button
                                onClick={() => handleCall(request.user_phone!)}
                                className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors shadow-sm"
                                title="Gọi điện"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openGoogleMaps(request.latitude, request.longitude)}
                              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm"
                              title="Chỉ đường"
                            >
                              <Navigation className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResolveEmergency(request.user_id)}
                              disabled={processingId === request.user_id}
                              className="p-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Đánh dấu đã xử lý"
                            >
                              {processingId === request.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {selectedRequest && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in"
            onClick={(e) => e.target === e.currentTarget && setSelectedRequest(null)}
          >
            <div
              className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl z-[10000] animate-in slide-in-from-bottom-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
                <h2 className="text-lg font-bold text-foreground">Chi tiết yêu cầu SOS</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Người gửi
                  </span>
                  <p className="text-base font-semibold text-foreground">
                    {selectedRequest.user_full_name || "—"}
                  </p>
                </div>
                {selectedRequest.user_phone && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                      Số điện thoại
                    </span>
                    <a
                      href={`tel:${selectedRequest.user_phone}`}
                      className="text-base text-primary hover:underline font-medium"
                    >
                      {selectedRequest.user_phone}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Trạng thái
                  </span>
                  <span
                    className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold text-white ${getStatusColor(
                      getSOSStatus(selectedRequest)
                    )}`}
                  >
                    {getStatusLabel(getSOSStatus(selectedRequest))}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Vị trí
                  </span>
                  <p className="text-base font-mono text-foreground">
                    {selectedRequest.latitude.toFixed(6)}, {selectedRequest.longitude.toFixed(6)}
                  </p>
                </div>
                {!selectedRequest.is_safe && (
                  <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                    {selectedRequest.user_phone && (
                      <button
                        onClick={() => handleCall(selectedRequest.user_phone!)}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors shadow-sm"
                      >
                        <Phone className="w-4 h-4" />
                        Gọi điện
                      </button>
                    )}
                    <button
                      onClick={() => openGoogleMaps(selectedRequest.latitude, selectedRequest.longitude)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-sm"
                    >
                      <Navigation className="w-4 h-4" />
                      Chỉ đường
                    </button>
                    <button
                      onClick={() => handleResolveEmergency(selectedRequest.user_id)}
                      disabled={processingId === selectedRequest.user_id}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === selectedRequest.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Đánh dấu đã xử lý
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
