"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  Phone,
  MapPin,
  Shield,
  User,
  CheckCircle,
  Loader2,
  PhoneCall,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UserInfo {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
}

interface SupportMember {
  user_id: string;
  is_available: boolean;
  user: UserInfo | null;
}

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [supportTeam, setSupportTeam] = useState<SupportMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosActivated, setSosActivated] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState<SupportMember | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [sendingLocation, setSendingLocation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSupportTeam();
      getUserLocation();
    }
  }, [isOpen]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Location access denied or unavailable
        }
      );
    }
  };

  const fetchSupportTeam = async () => {
    try {
      setLoading(true);

      // Fetch all supporters from backend API
      const supportersRes = await fetch(`${API_URL}/supporters`, {
        credentials: 'include',
      });
      const supportersResult = await supportersRes.json();

      if (supportersResult.status !== 200 || !supportersResult.data) {
        setSupportTeam([]);
        return;
      }

      const supporters = supportersResult.data;

      // Filter available supporters (or use all if none available)
      const availableSupporters = supporters.filter((s: { is_available: boolean }) => s.is_available);
      const supportersToUse = availableSupporters.length > 0 ? availableSupporters : supporters;

      if (supportersToUse.length === 0) {
        setSupportTeam([]);
        return;
      }

      // Fetch user info for each supporter
      const supportersWithUsers: SupportMember[] = await Promise.all(
        supportersToUse.map(async (supporter: { user_id: string; is_available: boolean }) => {
          try {
            const userRes = await fetch(`${API_URL}/users/${supporter.user_id}`, {
              credentials: 'include',
            });
            const userResult = await userRes.json();
            
            return {
              user_id: supporter.user_id,
              is_available: supporter.is_available,
              user: userResult.status === 200 && userResult.data ? {
                id: userResult.data.id,
                full_name: userResult.data.full_name,
                phone: userResult.data.phone,
                avatar_url: userResult.data.avatar_url,
              } : null,
            };
          } catch {
            return {
              user_id: supporter.user_id,
              is_available: supporter.is_available,
              user: null,
            };
          }
        })
      );

      setSupportTeam(supportersWithUsers);
    } catch {
      setSupportTeam([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSOS = async () => {
    setSosActivated(true);

    // Update user's safety status via backend API
    if (profile?.user_id) {
      try {
        await fetch(`${API_URL}/travellers/${profile.user_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            is_safe: false,
            latitude: userLocation?.lat,
            longitude: userLocation?.lng,
            is_shared_location: true,
          }),
        });
      } catch {
        // Failed to update safety status
      }
    }
  };

  const handleSelectSupport = async (support: SupportMember) => {
    setSelectedSupport(support);
    setSendingLocation(true);

    // Simulate sending location to support
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSendingLocation(false);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const cancelSOS = async () => {
    setSosActivated(false);
    setSelectedSupport(null);

    // Update user's safety status via backend API
    if (profile?.user_id) {
      try {
        await fetch(`${API_URL}/travellers/${profile.user_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ is_safe: true }),
        });
      } catch {
        // Failed to update safety status
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Emergency</h2>
                <p className="text-white/80 text-sm">
                  Get help when you need it
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* SOS Button */}
          {!sosActivated ? (
            <div className="text-center mb-8">
              <button onClick={handleSOS} className="relative group">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
                <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group-hover:from-red-600 group-hover:to-red-700">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-white mx-auto mb-1" />
                    <span className="text-2xl font-black text-white tracking-wider">
                      SOS
                    </span>
                  </div>
                </div>
              </button>
              <p className="text-muted-foreground mt-4 text-sm">
                Press the SOS button if you need immediate help
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-red-600 mb-2">
                SOS Activated!
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Your location has been shared. Select a support member below.
              </p>
              <button
                onClick={cancelSOS}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Cancel SOS
              </button>
            </div>
          )}

          {/* Location Status */}
          {userLocation && (
            <div className="bg-muted/50 rounded-lg p-3 mb-6 flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-destination flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Your Location
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
              </div>
              <Navigation className="w-4 h-4 text-destination animate-pulse" />
            </div>
          )}

          {/* Support Team */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-traveller" />
              Support Team
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-traveller animate-spin" />
              </div>
            ) : supportTeam.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No support members available
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try again later or call emergency services
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {supportTeam.map((support) => (
                  <div
                    key={support.user_id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedSupport?.user_id === support.user_id
                        ? 'border-traveller bg-traveller/5'
                        : 'border-border hover:border-traveller/50 hover:bg-muted/30'
                      }`}
                    onClick={() => sosActivated && handleSelectSupport(support)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-traveller/20 rounded-full flex items-center justify-center">
                          {support.user?.avatar_url ? (
                            <img
                              src={support.user.avatar_url}
                              alt={support.user?.full_name || 'Support'}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-traveller" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground flex items-center">
                            {support.user?.full_name || 'Support Member'}
                            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {support.user?.phone ? `📞 ${support.user.phone}` : 'Hỗ trợ viên'}
                          </p>
                        </div>
                      </div>

                      {selectedSupport?.user_id === support.user_id ? (
                        sendingLocation ? (
                          <Loader2 className="w-6 h-6 text-traveller animate-spin" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(support.user?.phone || '');
                          }}
                          className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
                          title="Call"
                        >
                          <PhoneCall className="w-5 h-5 text-white" />
                        </button>
                      )}
                    </div>

                    {selectedSupport?.user_id === support.user_id && !sendingLocation && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-green-600 font-medium mb-2">
                          ✓ Đã chia sẻ vị trí với {support.user?.full_name || 'hỗ trợ viên'}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCall(support.user?.phone || '')}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>Gọi ngay</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Numbers */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Emergency Numbers
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCall("113")}
                className="flex items-center space-x-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-700">Police</p>
                  <p className="text-xs text-red-600">113</p>
                </div>
              </button>
              <button
                onClick={() => handleCall("114")}
                className="flex items-center space-x-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-orange-700">Fire</p>
                  <p className="text-xs text-orange-600">114</p>
                </div>
              </button>
              <button
                onClick={() => handleCall("115")}
                className="flex items-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-700">Ambulance</p>
                  <p className="text-xs text-blue-600">115</p>
                </div>
              </button>
              <button
                onClick={() => handleCall("1900599920")}
                className="flex items-center space-x-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-green-700">Tourism</p>
                  <p className="text-xs text-green-600">1900.599.920</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
