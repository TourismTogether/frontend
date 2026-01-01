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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
              <Wand2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Lộ Trình AI Đề Xuất
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Lộ trình hoàn chỉnh được AI tính toán để buổi đi chơi trọn vẹn
                nhất
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {aiGeneratedRoutes.length > 0 && onSelectAllRoutes && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Thêm Tất Cả ({aiGeneratedRoutes.length})</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-600 font-medium text-lg mb-2">
                AI đang tính toán lộ trình...
              </p>
              <p className="text-gray-500 text-sm text-center max-w-md">
                Đang phân tích destination, thời gian, ngân sách và tạo lộ trình
                tối ưu cho bạn
              </p>
            </div>
          ) : aiGeneratedRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <MapPin className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Không thể tạo lộ trình
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                Không thể tạo lộ trình AI tại thời điểm này. Vui lòng thử lại
                sau hoặc tạo lộ trình thủ công.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-700">
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
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 bg-white hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Route Number and Title */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                              isSelected
                                ? "bg-purple-600 text-white"
                                : "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {route.title}
                          </h3>
                          {isSelected && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Đã thêm
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {route.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {route.description}
                          </p>
                        )}

                        {/* AI Reasoning */}
                        {aiRoute.reasoning && (
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-semibold text-blue-700 mb-1">
                              💡 Lý do AI đề xuất:
                            </p>
                            <p className="text-xs text-blue-600">
                              {aiRoute.reasoning}
                            </p>
                          </div>
                        )}

                        {/* Coordinates */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span>
                              Bắt đầu: {route.latStart.toFixed(4)},{" "}
                              {route.lngStart.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-red-500" />
                            <span>
                              Kết thúc: {route.latEnd.toFixed(4)},{" "}
                              {route.lngEnd.toFixed(4)}
                            </span>
                          </div>
                        </div>

                        {/* Activities */}
                        {route.details && route.details.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2">
                              Hoạt động:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {route.details.map((detail, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-md border border-gray-200"
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
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex-shrink-0"
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
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Lộ trình được AI tính toán dựa trên destination, thời gian, ngân
            sách và độ khó của trip. Bạn có thể chỉnh sửa sau khi thêm vào trip.
          </p>
        </div>
      </div>
    </div>
  );
};
