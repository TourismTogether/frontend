"use client";

import React, { useState } from "react";
import { X, Loader2, Key, Hash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS } from "@/constants/api";
import { COLORS } from "@/constants/colors";

interface JoinTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: () => void;
}

export const JoinTripModal: React.FC<JoinTripModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    trip_id: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!API_URL || !user?.id) {
      setError("API URL or User ID is missing.");
      setLoading(false);
      return;
    }

    if (!formData.trip_id.trim()) {
      setError("Vui lòng nhập ID chuyến đi");
      setLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      setLoading(false);
      return;
    }

    try {
      // Call join trip API with password
      const response = await fetch(
        `${API_URL}/trips/${formData.trip_id}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            password: formData.password,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Không thể tham gia chuyến đi. Vui lòng kiểm tra lại ID và mật khẩu."
        );
      }

      const result = await response.json();
      
      // Success
      onJoinSuccess();
      onClose();
      setFormData({ trip_id: "", password: "" });
    } catch (err: any) {
      console.error("Error joining trip:", err);
      setError(err.message || "Không thể tham gia chuyến đi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ trip_id: "", password: "" });
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-colors duration-300">
      <div
        className={`${COLORS.BACKGROUND.CARD} rounded-2xl shadow-2xl w-full max-w-md mx-4 transition-colors duration-300`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 ${COLORS.BACKGROUND.CARD} border-b ${COLORS.BORDER.DEFAULT} px-6 py-4 flex items-center justify-between rounded-t-2xl transition-colors duration-300`}
        >
          <h2
            className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}
          >
            Tham gia chuyến đi
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 hover:${COLORS.BACKGROUND.MUTED} rounded-full transition-all duration-200`}
            disabled={loading}
          >
            <X
              className={`w-5 h-5 ${COLORS.TEXT.MUTED} transition-colors duration-200`}
            />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div
              className={`bg-destructive/10 border-destructive text-destructive px-4 py-3 rounded-lg transition-colors duration-200`}
            >
              {error}
            </div>
          )}

          {/* Trip ID */}
          <div>
            <label
              htmlFor="trip_id"
              className={`block text-sm font-semibold ${COLORS.TEXT.MUTED} mb-2 transition-colors duration-200`}
            >
              <Hash
                className={`w-4 h-4 inline mr-2 ${COLORS.TEXT.MUTED} transition-colors duration-200`}
              />
              ID Chuyến đi *
            </label>
            <input
              id="trip_id"
              name="trip_id"
              type="text"
              value={formData.trip_id}
              onChange={handleChange}
              required
              disabled={loading}
              className={`w-full p-3 ${COLORS.BORDER.DEFAULT} rounded-lg ${COLORS.BACKGROUND.CARD} ${COLORS.TEXT.DEFAULT} focus:ring-2 focus:ring-accent focus:${COLORS.BORDER.PRIMARY} transition-all duration-200 disabled:opacity-50`}
              placeholder="Nhập ID chuyến đi"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-semibold ${COLORS.TEXT.MUTED} mb-2 transition-colors duration-200`}
            >
              <Key
                className={`w-4 h-4 inline mr-2 ${COLORS.TEXT.MUTED} transition-colors duration-200`}
              />
              Mật khẩu *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className={`w-full p-3 ${COLORS.BORDER.DEFAULT} rounded-lg ${COLORS.BACKGROUND.CARD} ${COLORS.TEXT.DEFAULT} focus:ring-2 focus:ring-accent focus:${COLORS.BORDER.PRIMARY} transition-all duration-200 disabled:opacity-50`}
              placeholder="Nhập mật khẩu phòng"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className={`flex-1 px-4 py-3 ${COLORS.BORDER.DEFAULT} ${COLORS.TEXT.MUTED} rounded-lg hover:${COLORS.BACKGROUND.MUTED} transition-all duration-200 font-semibold disabled:opacity-50`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 ${COLORS.PRIMARY.DEFAULT} rounded-lg ${COLORS.PRIMARY.HOVER} transition-all duration-200 font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tham gia...
                </>
              ) : (
                "Tham gia"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
