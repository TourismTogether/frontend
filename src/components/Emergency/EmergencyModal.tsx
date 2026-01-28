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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from 'next-themes';

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
  const { theme } = useTheme();
  const { profile, user } = useAuth();
  const [supportTeam, setSupportTeam] = useState<SupportMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosActivated, setSosActivated] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState<SupportMember | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [sendingLocation, setSendingLocation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSupportTeam();
      getUserLocation();
      checkSOSStatus();
    }
  }, [isOpen]);

  // Check SOS status periodically when SOS is activated
  useEffect(() => {
    if (!sosActivated || !isOpen) return;

    const checkInterval = setInterval(async () => {
      await checkSOSStatus();
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [sosActivated, isOpen]);

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
          setUserLocation({
            lat: 10.762892238148003,
            lng: 106.68248479264726,
          });
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
        }
      );
    } else {
      setUserLocation({
        lat: 10.762892238148003,
        lng: 106.68248479264726,
      });
    }
  };

  const checkSOSStatus = async () => {
    const userId = profile?.user_id || profile?.id || user?.id;
    if (!userId) return;

    try {
      const res = await fetch(`${API_URL}/travellers/${userId}`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.status === 200 && result.data) {
        const isSafe = result.data.is_safe !== false;
        const isShared = result.data.is_shared_location === true;
        
        if (isSafe || !isShared) {
          if (sosActivated) {
            alert('SOS đã được xử lý bởi supporter. Cảm ơn bạn!');
          }
          setSosActivated(false);
          setSelectedSupport(null);
        } else {
          setSosActivated(true);
          
          if (result.data.emergency_contacts && Array.isArray(result.data.emergency_contacts) && result.data.emergency_contacts.length > 0) {
            const supporterId = result.data.emergency_contacts[0];
            const supporter = supportTeam.find(s => s.user_id === supporterId);
            if (supporter) {
              setSelectedSupport(supporter);
            } else {
              setSelectedSupport(null);
            }
          } else {
            setSelectedSupport(null);
          }
        }
      }
    } catch (error) {
      // Error checking SOS status
    }
  };

  const fetchSupportTeam = async () => {
    try {
      setLoading(true);

      const supportersRes = await fetch(`${API_URL}/supporters`, {
        credentials: 'include',
      });
      const supportersResult = await supportersRes.json();

      if (supportersResult.status !== 200 || !supportersResult.data) {
        setSupportTeam([]);
        return;
      }

      const supporters = supportersResult.data;
      const availableSupporters = supporters.filter((s: { is_available: boolean }) => s.is_available);
      const supportersToUse = availableSupporters.length > 0 ? availableSupporters : supporters;

      if (supportersToUse.length === 0) {
        setSupportTeam([]);
        return;
      }

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
    const userId = profile?.user_id || profile?.id || user?.id;
    
    if (!userId) {
      alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    let currentLat = userLocation?.lat;
    let currentLng = userLocation?.lng;

    if (!currentLat || !currentLng) {
      try {
        const location = await new Promise<{ lat: number; lng: number }>((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              },
              () => {
                resolve({
                  lat: 10.762892238148003,
                  lng: 106.68248479264726,
                });
              },
              { timeout: 5000, enableHighAccuracy: false }
            );
          } else {
            resolve({
              lat: 10.762892238148003,
              lng: 106.68248479264726,
            });
          }
        });
        currentLat = location.lat;
        currentLng = location.lng;
        setUserLocation(location);
      } catch {
        currentLat = 10.762892238148003;
        currentLng = 106.68248479264726;
        setUserLocation({ lat: currentLat, lng: currentLng });
      }
    }

    setSosActivated(true);

    try {
      const response = await fetch(`${API_URL}/travellers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          is_safe: false,
          latitude: currentLat,
          longitude: currentLng,
          is_shared_location: true,
          emergency_contacts: [],
        }),
      });

      const result = await response.json();
      if (result.status !== 200) {
        alert('Không thể kích hoạt SOS. Vui lòng thử lại.');
        setSosActivated(false);
      } else {
        alert('SOS đã được kích hoạt! Vị trí của bạn đã được gửi đến các supporter.');
      }
    } catch (error) {
      alert('Đã xảy ra lỗi khi kích hoạt SOS. Vui lòng thử lại.');
      setSosActivated(false);
    }
  };

  const handleSelectSupport = async (support: SupportMember) => {
    const userId = profile?.user_id || profile?.id || user?.id;
    
    if (!userId) return;

    setSelectedSupport(support);
    setSendingLocation(true);

    try {
      const travellerRes = await fetch(`${API_URL}/travellers/${userId}`, {
        credentials: 'include',
      });
      const travellerResult = await travellerRes.json();
      
      if (travellerResult.status === 200 && travellerResult.data) {
        let currentContacts: string[] = [];
        if (travellerResult.data.emergency_contacts) {
          if (typeof travellerResult.data.emergency_contacts === 'string') {
            try {
              currentContacts = JSON.parse(travellerResult.data.emergency_contacts);
            } catch {
              currentContacts = [];
            }
          } else if (Array.isArray(travellerResult.data.emergency_contacts)) {
            currentContacts = travellerResult.data.emergency_contacts;
          }
        }

        const updatedContacts = currentContacts.includes(support.user_id)
          ? currentContacts
          : [...currentContacts, support.user_id];

        await fetch(`${API_URL}/travellers/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            emergency_contacts: updatedContacts,
          }),
        });
      }
    } catch (error) {
      // Error updating emergency contacts
    } finally {
      setSendingLocation(false);
    }
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const cancelSOS = async () => {
    const userId = profile?.user_id || profile?.id || user?.id;
    
    if (!userId) return;

    setSosActivated(false);
    setSelectedSupport(null);

    try {
      await fetch(`${API_URL}/travellers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          is_safe: true,
          is_shared_location: false,
          emergency_contacts: [],
        }),
      });
    } catch (error) {
      alert('Đã xảy ra lỗi khi hủy SOS. Vui lòng thử lại.');
    }
  };

  if (!isOpen) return null;

  // Theme-based colors
  const getThemeColors = () => {
    switch (theme) {
      case 'dark':
        return {
          header: 'from-red-700 to-red-600',
          sosButton: 'from-red-600 to-red-700',
          sosButtonHover: 'from-red-700 to-red-800',
          card: 'bg-card border-border',
          text: 'text-foreground',
          muted: 'text-muted-foreground',
        };
      case 'modern':
        return {
          header: 'from-purple-600 to-pink-600',
          sosButton: 'from-purple-600 to-pink-600',
          sosButtonHover: 'from-purple-700 to-pink-700',
          card: 'bg-card border-border',
          text: 'text-foreground',
          muted: 'text-muted-foreground',
        };
      case 'history':
        return {
          header: 'from-amber-700 to-orange-700',
          sosButton: 'from-amber-600 to-orange-600',
          sosButtonHover: 'from-amber-700 to-orange-700',
          card: 'bg-card border-border',
          text: 'text-foreground',
          muted: 'text-muted-foreground',
        };
      default: // light
        return {
          header: 'from-red-600 to-red-500',
          sosButton: 'from-red-500 to-red-600',
          sosButtonHover: 'from-red-600 to-red-700',
          card: 'bg-card border-border',
          text: 'text-foreground',
          muted: 'text-muted-foreground',
        };
    }
  };

  const colors = getThemeColors();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${colors.card} border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.header} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Emergency SOS</h2>
                <p className="text-white/80 text-sm">
                  Kích hoạt khi cần hỗ trợ khẩn cấp
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
          {/* SOS Button - chỉ hiện khi chưa kích hoạt */}
          {!sosActivated ? (
            <div className="text-center mb-6">
              <button onClick={handleSOS} className="relative group">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
                <div className={`relative w-32 h-32 mx-auto bg-gradient-to-br ${colors.sosButton} rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group-hover:${colors.sosButtonHover}`}>
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-white mx-auto mb-1" />
                    <span className="text-2xl font-black text-white tracking-wider">
                      SOS
                    </span>
                  </div>
                </div>
              </button>
              <p className={`${colors.muted} mt-4 text-sm`}>
                Nhấn nút SOS nếu bạn cần hỗ trợ khẩn cấp
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className={`text-lg font-bold text-red-600 dark:text-red-400 mb-2`}>
                SOS Đã Kích Hoạt!
              </h3>
              <p className={`${colors.muted} text-sm mb-4`}>
                Vị trí của bạn đã được chia sẻ. Chọn supporter bên dưới.
              </p>
              <button
                onClick={cancelSOS}
                className={`text-sm ${colors.muted} hover:${colors.text} underline`}
              >
                Hủy SOS
              </button>
            </div>
          )}

          {/* Location Status - chỉ hiện khi đã có location */}
          {userLocation && (
            <div className="bg-muted/50 rounded-lg p-3 mb-6 flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${colors.text}`}>
                  Vị trí của bạn
                </p>
                <p className={`text-xs ${colors.muted} truncate font-mono`}>
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* Support Team - chỉ hiện khi SOS đã kích hoạt */}
          {sosActivated && (
            <div>
              <h3 className={`text-lg font-semibold ${colors.text} mb-4 flex items-center`}>
                <Phone className="w-5 h-5 mr-2 text-primary" />
                Đội hỗ trợ
              </h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : supportTeam.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <User className={`w-12 h-12 ${colors.muted} mx-auto mb-3`} />
                  <p className={colors.muted}>
                    Không có supporter nào sẵn sàng
                  </p>
                  <p className={`text-sm ${colors.muted} mt-1`}>
                    Vui lòng thử lại sau hoặc gọi dịch vụ khẩn cấp
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supportTeam.map((support) => (
                    <div
                      key={support.user_id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedSupport?.user_id === support.user_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      }`}
                      onClick={() => handleSelectSupport(support)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            {support.user?.avatar_url ? (
                              <img
                                src={support.user.avatar_url}
                                alt={support.user?.full_name || 'Support'}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <h4 className={`font-semibold ${colors.text} flex items-center`}>
                              {support.user?.full_name || 'Supporter'}
                              {support.is_available && (
                                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                              )}
                            </h4>
                            {support.user?.phone && (
                              <p className={`text-sm ${colors.muted}`}>
                                📞 {support.user.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {selectedSupport?.user_id === support.user_id ? (
                          sendingLocation ? (
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          ) : (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          )
                        ) : (
                          support.user?.phone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCall(support.user!.phone);
                              }}
                              className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
                              title="Gọi"
                            >
                              <PhoneCall className="w-5 h-5 text-white" />
                            </button>
                          )
                        )}
                      </div>

                      {selectedSupport?.user_id === support.user_id && !sendingLocation && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className={`text-sm text-green-600 dark:text-green-400 font-medium mb-2`}>
                            ✓ Đã chia sẻ vị trí với {support.user?.full_name || 'supporter'}
                          </p>
                          {support.user?.phone && (
                            <button
                              onClick={() => handleCall(support.user!.phone)}
                              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors w-full"
                            >
                              <PhoneCall className="w-4 h-4" />
                              <span>Gọi ngay</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
