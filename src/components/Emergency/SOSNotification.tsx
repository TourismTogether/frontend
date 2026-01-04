"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  AlertTriangle,
  MapPin,
  Phone,
  CheckCircle,
  X,
  User,
  Navigation,
  Clock,
  PhoneCall,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface SOSAlert {
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

interface SOSNotificationProps {
  currentUserId?: string;
  isSupporter?: boolean;
}

export const SOSNotification: React.FC<SOSNotificationProps> = ({
  currentUserId,
  isSupporter = false,
}) => {
  const { user } = useAuth();
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSOSAlerts = useCallback(async () => {
    if (!isSupporter || !currentUserId) {
      setSOSAlerts([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/travellers/sos/supporter/${currentUserId}`, {
        credentials: "include",
      });
      const result = await res.json();

      if (result.status === 200 && result.data) {
        setSOSAlerts(result.data);
      } else {
        setSOSAlerts([]);
      }
    } catch (error) {
      setSOSAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [isSupporter, currentUserId]);

  useEffect(() => {
    fetchSOSAlerts();

    // Polling every 10 seconds for new SOS alerts
    const interval = setInterval(fetchSOSAlerts, 10000);

    return () => clearInterval(interval);
  }, [fetchSOSAlerts]);

  const handleMarkAsProcessed = async (userId: string) => {
    setProcessingId(userId);
    try {
      await fetch(`${API_URL}/travellers/${userId}`, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          is_safe: true,
          is_shared_location: false,
          emergency_contacts: [],
        }),
      });
      await fetchSOSAlerts();
    } catch (error) {
      // Error marking as processed
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

  const getAlertColor = (alert: SOSAlert): string => {
    if (alert.is_safe) {
      return "border-green-500 bg-green-50";
    }
    if (alert.emergency_contacts && alert.emergency_contacts.includes(currentUserId || '')) {
      return "border-red-500 bg-red-50";
    }
    return "border-yellow-500 bg-yellow-50";
  };

  const getAlertBadgeColor = (alert: SOSAlert): string => {
    if (alert.is_safe) {
      return "bg-green-500";
    }
    if (alert.emergency_contacts && alert.emergency_contacts.includes(currentUserId || '')) {
      return "bg-red-500";
    }
    return "bg-yellow-500";
  };

  const getAlertLabel = (alert: SOSAlert): string => {
    if (alert.is_safe) {
      return "Đã xử lý";
    }
    if (alert.emergency_contacts && alert.emergency_contacts.includes(currentUserId || '')) {
      return "Yêu cầu trực tiếp";
    }
    return "Cần hỗ trợ";
  };

  const pendingAlerts = sosAlerts.filter((a) => !a.is_safe);
  const urgentAlerts = sosAlerts.filter(
    (a) => !a.is_safe && a.emergency_contacts && a.emergency_contacts.includes(currentUserId || '')
  );


  if (!isSupporter) return null;

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-all duration-200"
        title="SOS Alerts"
      >
        <Bell className="w-5 h-5" />
        {pendingAlerts.length > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white rounded-full px-1 ${
              urgentAlerts.length > 0 ? "bg-red-500 animate-pulse" : "bg-yellow-500"
            }`}
          >
            {pendingAlerts.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 w-96 max-h-[80vh] bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">SOS Alerts</h3>
                {pendingAlerts.length > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingAlerts.length} đang chờ
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              ) : sosAlerts.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Không có cảnh báo SOS</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Các yêu cầu cứu hộ sẽ hiển thị ở đây
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sosAlerts.map((alert) => (
                    <div
                      key={alert.user_id}
                      className={`p-4 transition-colors ${getAlertColor(alert)}`}
                    >
                      {/* Alert Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                            {alert.user_avatar_url ? (
                              <img
                                src={alert.user_avatar_url}
                                alt={alert.user_full_name || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {alert.user_full_name || "Người dùng"}
                            </h4>
                            <div className="text-xs text-muted-foreground">
                              ID: {alert.user_id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium text-white px-2 py-1 rounded-full ${getAlertBadgeColor(
                            alert
                          )}`}
                        >
                          {getAlertLabel(alert)}
                        </span>
                      </div>

                      {/* Location Info */}
                      <div className="bg-background/50 rounded-lg p-2 mb-3 flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-destination flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                        </span>
                      </div>

                      {/* Phone */}
                      {alert.user_phone && (
                        <div className="text-sm text-muted-foreground mb-3">
                          📞 {alert.user_phone}
                        </div>
                      )}

                      {/* Emergency contacts info */}
                      {alert.emergency_contacts && alert.emergency_contacts.length > 0 && (
                        <div className="text-xs text-muted-foreground mb-3">
                          <span>Đã chọn {alert.emergency_contacts.length} supporter(s)</span>
                        </div>
                      )}

                      {/* Actions */}
                      {!alert.is_safe && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openGoogleMaps(alert.latitude, alert.longitude)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Chỉ đường</span>
                          </button>
                          {alert.user_phone && (
                            <button
                              onClick={() => handleCall(alert.user_phone!)}
                              className="flex items-center justify-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleMarkAsProcessed(alert.user_id)}
                            disabled={processingId === alert.user_id}
                            className="flex items-center justify-center px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {processingId === alert.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Processed badge */}
                      {alert.is_safe && (
                        <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-100 rounded-lg py-2">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Đã xử lý xong</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {sosAlerts.length > 0 && (
              <div className="px-4 py-3 border-t border-border bg-muted/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>Trực tiếp</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span>Chung</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Đã xử lý</span>
                    </span>
                  </div>
                  <button
                    onClick={fetchSOSAlerts}
                    className="text-traveller hover:underline"
                  >
                    Làm mới
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

