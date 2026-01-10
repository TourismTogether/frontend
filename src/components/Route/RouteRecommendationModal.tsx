// AI Route Recommendation Modal Component
// Displays AI-generated complete itinerary for a trip

import React, { useState } from "react";
import {
  X,
  MapPin,
  Sparkles,
  Plus,
  Loader2,
  CheckCircle,
  Wand2,
} from "lucide-react";
import { IRoute } from "@/lib/type/interface";
import { AIGeneratedRoute } from "@/services/aiRoutePlannerService";
import { COLORS, GRADIENTS } from "@/constants/colors";

interface RouteRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiGeneratedRoutes: AIGeneratedRoute[];
  onSelectRoute: (
    route: Omit<
      IRoute,
      "id" | "created_at" | "updated_at" | "trip_id" | "costs"
    >
  ) => void;
  onSelectAllRoutes?: () => void;
  loading?: boolean;
}

export const RouteRecommendationModal: React.FC<
  RouteRecommendationModalProps
> = ({
  isOpen,
  onClose,
  aiGeneratedRoutes,
  onSelectRoute,
  onSelectAllRoutes,
  loading = false,
}) => {
  const [selectedRoutes, setSelectedRoutes] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleSelectRoute = (route: IRoute, index: number) => {
    onSelectRoute({
      index: 0, // Will be set by parent
      title: route.title,
      description: route.description,
      lngStart: route.lngStart,
      latStart: route.latStart,
      lngEnd: route.lngEnd,
      latEnd: route.latEnd,
      details: route.details,
    });

    // Mark as selected
    setSelectedRoutes((prev) => new Set(prev).add(index));
  };

  const handleSelectAll = () => {
    if (onSelectAllRoutes) {
      onSelectAllRoutes();
      // Mark all as selected
      setSelectedRoutes(new Set(aiGeneratedRoutes.map((_, idx) => idx)));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-5xl max-h-[90vh] ${COLORS.BACKGROUND.CARD} rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 ${COLORS.BORDER.DEFAULT} border-b ${GRADIENTS.PRIMARY_LIGHT} opacity-80 transition-colors duration-200 relative`}>
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className={`p-2 ${COLORS.PRIMARY.LIGHT} rounded-lg transition-colors duration-200 backdrop-blur-sm bg-white/10 dark:bg-white/5`}>
              <Wand2 className={`h-6 w-6 text-white drop-shadow-lg transition-colors duration-200`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold text-white drop-shadow-lg transition-colors duration-200`}>
                Lộ Trình AI Đề Xuất
              </h2>
              <p className={`text-sm text-white/95 drop-shadow-md mt-1 transition-colors duration-200`}>
                Lộ trình hoàn chỉnh được AI tính toán để buổi đi chơi trọn vẹn
                nhất
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            {aiGeneratedRoutes.length > 0 && onSelectAllRoutes && (
              <button
                onClick={handleSelectAll}
                className={`flex items-center gap-2 px-4 py-2 ${COLORS.PRIMARY.DEFAULT} ${COLORS.PRIMARY.HOVER} text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg backdrop-blur-sm`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Thêm Tất Cả ({aiGeneratedRoutes.length})</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-colors duration-200 backdrop-blur-sm`}
              aria-label="Close"
            >
              <X className={`h-5 w-5 text-white drop-shadow-md transition-colors duration-200`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className={`h-12 w-12 animate-spin ${COLORS.TEXT.PRIMARY} mb-4 transition-colors duration-200`} />
              <p className={`${COLORS.TEXT.MUTED} font-medium text-lg mb-2 transition-colors duration-200`}>
                AI đang tính toán lộ trình...
              </p>
              <p className={`${COLORS.TEXT.MUTED} text-sm text-center max-w-md transition-colors duration-200`}>
                Đang phân tích destination, thời gian, ngân sách và tạo lộ trình
                tối ưu cho bạn
              </p>
            </div>
          ) : aiGeneratedRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className={`p-4 ${COLORS.BACKGROUND.MUTED} rounded-full mb-4 transition-colors duration-200`}>
                <MapPin className={`h-10 w-10 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
              </div>
              <h3 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT} mb-2 transition-colors duration-200`}>
                Không thể tạo lộ trình
              </h3>
              <p className={`${COLORS.TEXT.MUTED} text-center max-w-md transition-colors duration-200`}>
                Không thể tạo lộ trình AI tại thời điểm này. Vui lòng thử lại
                sau hoặc tạo lộ trình thủ công.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`mb-4 p-4 ${COLORS.PRIMARY.LIGHT} rounded-lg ${COLORS.BORDER.PRIMARY} border transition-colors duration-200 relative`}>
                {/* Dark overlay for better text contrast */}
                <div className="absolute inset-0 bg-black/10 dark:bg-black/20 rounded-lg pointer-events-none"></div>
                <p className={`text-sm ${COLORS.TEXT.DEFAULT} relative z-10 font-medium transition-colors duration-200`}>
                  <span className="font-semibold">
                    ✨ AI đã tạo ra {aiGeneratedRoutes.length} chặng
                  </span>{" "}
                  để bạn có một hành trình trọn vẹn. Bạn có thể thêm tất cả hoặc
                  chọn từng chặng riêng lẻ.
                </p>
              </div>

              {aiGeneratedRoutes.map((aiRoute, index) => {
                const route = aiRoute.route;
                const isSelected = selectedRoutes.has(index);

                return (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-5 transition-all duration-200 ${
                      isSelected
                        ? `${COLORS.BORDER.PRIMARY} ${COLORS.PRIMARY.LIGHT}`
                        : `${COLORS.BORDER.DEFAULT} ${COLORS.BACKGROUND.CARD} hover:shadow-lg`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Route Number and Title */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors duration-200 ${
                              isSelected
                                ? `${COLORS.PRIMARY.DEFAULT} text-white`
                                : `${COLORS.PRIMARY.LIGHT} ${COLORS.TEXT.PRIMARY}`
                            }`}
                          >
                            {index + 1}
                          </div>
                          <h3 className={`text-lg font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                            {route.title}
                          </h3>
                          {isSelected && (
                            <span className={`px-2 py-1 ${COLORS.GREEN[100]} ${COLORS.GREEN.TEXT_700} text-xs font-semibold rounded-full flex items-center gap-1 transition-colors duration-200`}>
                              <CheckCircle className="h-3 w-3" />
                              Đã thêm
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {route.description && (
                          <p className={`text-sm ${COLORS.TEXT.MUTED} mb-3 transition-colors duration-200`}>
                            {route.description}
                          </p>
                        )}

                        {/* AI Reasoning */}
                        {aiRoute.reasoning && (
                          <div className={`mb-3 p-3 ${COLORS.BACKGROUND.MUTED} ${COLORS.BORDER.DEFAULT} border rounded-lg transition-colors duration-200`}>
                            <p className={`text-xs font-semibold ${COLORS.TEXT.PRIMARY} mb-1 transition-colors duration-200`}>
                              💡 Lý do AI đề xuất:
                            </p>
                            <p className={`text-xs ${COLORS.TEXT.MUTED} transition-colors duration-200`}>
                              {aiRoute.reasoning}
                            </p>
                          </div>
                        )}

                        {/* Coordinates */}
                        <div className={`flex items-center gap-4 text-xs ${COLORS.TEXT.MUTED} mb-3 transition-colors duration-200`}>
                          <div className="flex items-center gap-1">
                            <MapPin className={`h-3 w-3 ${COLORS.GREEN.TEXT_500} transition-colors duration-200`} />
                            <span>
                              Bắt đầu: {route.latStart.toFixed(4)},{" "}
                              {route.lngStart.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className={`h-3 w-3 ${COLORS.DESTRUCTIVE.TEXT} transition-colors duration-200`} />
                            <span>
                              Kết thúc: {route.latEnd.toFixed(4)},{" "}
                              {route.lngEnd.toFixed(4)}
                            </span>
                          </div>
                        </div>

                        {/* Activities */}
                        {route.details && route.details.length > 0 && (
                          <div className="mb-3">
                            <p className={`text-xs font-semibold ${COLORS.TEXT.MUTED} mb-2 transition-colors duration-200`}>
                              Hoạt động:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {route.details.map((detail, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 ${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} text-xs rounded-md ${COLORS.BORDER.DEFAULT} border transition-colors duration-200`}
                                >
                                  {detail}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add Button */}
                      {!isSelected && (
                        <button
                          onClick={() => handleSelectRoute(route, index)}
                          className={`flex items-center gap-2 px-4 py-2 ${COLORS.PRIMARY.DEFAULT} ${COLORS.PRIMARY.HOVER} text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 shrink-0`}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Thêm</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 ${COLORS.BORDER.DEFAULT} border-t ${COLORS.BACKGROUND.MUTED} transition-colors duration-200`}>
          <p className={`text-xs ${COLORS.TEXT.MUTED} text-center transition-colors duration-200`}>
            Lộ trình được AI tính toán dựa trên destination, thời gian, ngân
            sách và độ khó của trip. Bạn có thể chỉnh sửa sau khi thêm vào trip.
          </p>
        </div>
      </div>
    </div>
  );
};
