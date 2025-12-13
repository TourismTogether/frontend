// src/components/FormNewTripModal.tsx (Tên component gốc của bạn có thể là FormNewTrip)
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
// Giả định đường dẫn chính xác đến interface của bạn
import { IDestination, ITrip } from "@/lib/type/interface";

// --- Interface và Mock Data cho Destination ---
interface INewTripFormState
  extends Omit<ITrip, "id" | "spent_amount" | "created_at" | "updated_at"> {}

const MOCK_DESTINATIONS: IDestination[] = [
  {
    id: "dest_1",
    region_id: "reg_1",
    name: "Hà Nội",
    country: "Việt Nam",
    description: "Thủ đô ngàn năm văn hiến",
    latitude: 21.0285,
    longitude: 105.8542,
    category: "City",
    best_season: "Autumn",
    rating: 4.5,
    images: [],
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "dest_2",
    region_id: "reg_2",
    name: "Đà Lạt",
    country: "Việt Nam",
    description: "Thành phố ngàn hoa",
    latitude: 11.9404,
    longitude: 108.4418,
    category: "Mountain",
    best_season: "All Year",
    rating: 4.8,
    images: [],
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "dest_3",
    region_id: "reg_3",
    name: "Hồ Chí Minh",
    country: "Việt Nam",
    description: "Thành phố không ngủ",
    latitude: 10.8231,
    longitude: 106.6297,
    category: "City",
    best_season: "Dry Season",
    rating: 4.6,
    images: [],
    created_at: new Date(),
    updated_at: new Date(),
  },
];
// --- Kết thúc Mock Data ---

interface FormNewTripProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: () => void;
}

export const FormNewTrip: React.FC<FormNewTripProps> = ({
  isOpen,
  onClose,
  onTripCreated,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] =
    useState<IDestination[]>(MOCK_DESTINATIONS);

  // Khởi tạo state ngày tháng bằng đối tượng Date()
  const initialFormState: INewTripFormState = {
    destination_id: "",
    title: "",
    description: "",
    departure: "",
    distance: 0,
    start_date: new Date(),
    end_date: new Date(),
    difficult: 1,
    total_budget: 0,
    status: "planning",
  };

  const [form, setForm] = useState<INewTripFormState>(initialFormState);

  // Nếu Modal đóng, không render gì
  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Bạn cần đăng nhập để tạo chuyến đi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Lấy id_user
      const { data: accountData } = await supabase
        .from("account")
        .select("id_user")
        .eq("email", user!.email || "")
        .maybeSingle();

      const user_id = accountData?.id_user;
      if (!user_id) {
        throw new Error("Không tìm thấy thông tin người dùng trong hệ thống.");
      }

      // Format Date object thành chuỗi ngày (YYYY-MM-DD)
      const tripData = {
        ...form,
        start_date: form.start_date.toISOString().split("T")[0],
        end_date: form.end_date.toISOString().split("T")[0],
        spent_amount: 0,
        total_budget: form.total_budget,
      };

      // 2. Insert Trip
      const { data: newTrip, error: tripError } = await supabase
        .from("trip")
        .insert(tripData)
        .select("uuid")
        .single();

      if (tripError) throw tripError;

      const newTripId = newTrip.uuid;

      // 3. Insert join_trip
      const { error: joinError } = await supabase
        .from("join_trip")
        .insert([{ id_user: user_id, id_trip: newTripId, role: "owner" }]);

      if (joinError) throw joinError;

      // Thành công
      onTripCreated();
      onClose();
      router.push(`/trips/${newTripId}`); // Chuyển hướng đến trang chi tiết
    } catch (err: any) {
      console.error("Lỗi khi tạo chuyến đi:", err);
      setError(
        err.message || "Đã xảy ra lỗi khi tạo chuyến đi. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // Hàm chuyển Date object thành chuỗi date input (YYYY-MM-DD)
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return (
    // Modal Overlay
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      {/* Modal Content */}
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-2xl font-bold text-foreground">
            ✨ Lập Kế Hoạch Chuyến Đi Mới
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/30 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Title and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Tên Chuyến Đi (Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
              />
            </div>
            <div>
              <label
                htmlFor="destination_id"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Điểm Đến (Destination) <span className="text-red-500">*</span>
              </label>
              <select
                id="destination_id"
                name="destination_id"
                value={form.destination_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
              >
                <option value="" disabled>
                  -- Chọn Điểm Đến --
                </option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}, {dest.country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Ngày Bắt Đầu (Start Date){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formatDate(form.start_date)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    start_date: new Date(e.target.value),
                  }))
                }
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
              />
            </div>
            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Ngày Kết Thúc (End Date) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formatDate(form.end_date)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    end_date: new Date(e.target.value),
                  }))
                }
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
              />
            </div>
          </div>

          {/* Departure, Distance, Budget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="departure"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Điểm Khởi Hành (Departure){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="departure"
                name="departure"
                value={form.departure}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
              />
            </div>
            <div>
              <label
                htmlFor="distance"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Khoảng Cách (km)
              </label>
              <input
                type="number"
                id="distance"
                name="distance"
                value={form.distance}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
              />
            </div>
            <div>
              <label
                htmlFor="total_budget"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Ngân Sách Tổng (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="total_budget"
                name="total_budget"
                value={form.total_budget}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
              />
            </div>
          </div>

          {/* Difficulty and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="difficult"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Mức Độ Khó (1: Dễ - 5: Rất Khó)
              </label>
              <input
                type="range"
                id="difficult"
                name="difficult"
                min="1"
                max="5"
                step="1"
                value={form.difficult}
                onChange={handleChange}
                className="w-full h-2 bg-muted-foreground rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-trip"
              />
              <p className="text-xs text-right text-muted-foreground mt-1">
                Mức độ hiện tại: **{form.difficult}**
              </p>
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Trạng Thái
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
              >
                <option value="planning">Planning (Đang Lập Kế Hoạch)</option>
                <option value="ongoing">Ongoing (Đang Diễn Ra)</option>
                <option value="completed">Completed (Đã Hoàn Thành)</option>
                <option value="cancelled">Cancelled (Đã Hủy)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Mô Tả Chi Tiết
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-trip focus:border-trip"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-trip hover:bg-trip/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>
                {loading ? "Đang Tạo Chuyến Đi..." : "Tạo Chuyến Đi Mới"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
