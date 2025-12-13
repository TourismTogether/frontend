// src/components/Trips.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, DollarSign, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { FormNewTrip } from "./FormNewTrip";

// --- MOCK DATA ---
const MOCK_TRIPS = [
  {
    id: "mock_trip_1",
    uuid: "mock_trip_1",
    title: "Khám phá Vịnh Hạ Long",
    description:
      "Chuyến đi 3 ngày 2 đêm khám phá kỳ quan thiên nhiên thế giới, bao gồm chèo thuyền kayak và ngủ đêm trên du thuyền.",
    departure: "Hà Nội",
    destination: "Vịnh Hạ Long",
    start_date: new Date(2025, 0, 15).toISOString(), // 15/01/2025
    end_date: new Date(2025, 0, 17).toISOString(), // 17/01/2025
    difficult: 2,
    total_budget: 15000000,
    spent_amount: 8500000,
    status: "ongoing",
    currency: "VND",
    created_at: new Date(2024, 11, 1).toISOString(),
    routes: null,
  },
  {
    id: "mock_trip_2",
    uuid: "mock_trip_2",
    title: "Trekking Fansipan",
    description:
      "Thử thách chinh phục nóc nhà Đông Dương trong 4 ngày. Cần chuẩn bị thể lực tốt.",
    departure: "Sapa",
    destination: "Fansipan Peak",
    start_date: new Date(2025, 5, 10).toISOString(),
    end_date: new Date(2025, 5, 13).toISOString(),
    difficult: 5,
    total_budget: 8000000,
    spent_amount: 0,
    status: "planning",
    currency: "VND",
    created_at: new Date(2024, 11, 5).toISOString(),
    routes: null,
  },
  {
    id: "mock_trip_3",
    uuid: "mock_trip_3",
    title: "Đà Lạt Chill",
    description:
      "Nghỉ dưỡng nhẹ nhàng tại thành phố ngàn hoa, thăm quan các vườn dâu và cà phê.",
    departure: "TP. Hồ Chí Minh",
    destination: "Đà Lạt",
    start_date: new Date(2024, 9, 20).toISOString(),
    end_date: new Date(2024, 9, 24).toISOString(),
    difficult: 1,
    total_budget: 6000000,
    spent_amount: 6300000,
    status: "completed",
    currency: "VND",
    created_at: new Date(2024, 9, 1).toISOString(),
    routes: null,
  },
];
// --- KẾT THÚC MOCK DATA ---

export const Trips: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái Modal

  useEffect(() => {
    if (user) {
      fetchTrips();
    } else {
      // Nếu không có user (chưa đăng nhập hoặc context lỗi), vẫn hiển thị mock
      setTrips(MOCK_TRIPS);
      setLoading(false);
    }
  }, [user]);

  const fetchTrips = async () => {
    try {
      // Get user's id_user
      const { data: accountData } = await supabase
        .from("account")
        .select("id_user")
        .eq("email", user!.email || "")
        .maybeSingle();

      if (!accountData?.id_user) {
        // Nếu không tìm thấy user id trong DB
        setTrips(MOCK_TRIPS);
        setLoading(false);
        return;
      }

      // Get trips user has joined
      const { data: joinTrips, error: joinError } = await supabase
        .from("join_trip")
        .select("id_trip")
        .eq("id_user", accountData.id_user);

      if (joinError) throw joinError;

      const tripIds = joinTrips?.map((j) => j.id_trip) || [];

      if (tripIds.length === 0) {
        // KHÔNG CÓ CHUYẾN ĐI NÀO ĐƯỢC JOIN => LOAD MOCK TRIP
        setTrips(MOCK_TRIPS);
        setLoading(false);
        return;
      }

      // Get trip details
      const { data, error } = await supabase
        .from("trip")
        .select("*")
        .in("id_trip", tripIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedTrips = (data || []).map((trip: any) => ({
        ...trip,
        id: trip.uuid,
        currency: "VND", // Default currency
        routes: null,
      }));

      setTrips(transformedTrips);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleTripCreated = () => {
    fetchTrips(); // Tải lại danh sách chuyến đi sau khi tạo thành công
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-users/20 text-users";
      case "ongoing":
        return "bg-traveller/20 text-traveller";
      case "completed":
        return "bg-muted text-muted-foreground";
      case "cancelled":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trip"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Trips</h1>
            <p className="text-muted-foreground mt-2">
              Manage your travel plans and budgets
            </p>
          </div>

          {/* Thay Link bằng Button gọi Modal */}
          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-2 bg-trip hover:bg-trip/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Plan New Trip</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              // Nếu là mock trip, có thể dẫn đến một mock page, hoặc đơn giản là dùng id thật
              href={`/trips/${trip.id}`}
              className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">
                  {trip.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                    trip.status
                  )}`}
                >
                  {trip.status}
                </span>
              </div>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {trip.description}
              </p>

              <div className="space-y-2 mb-4">
                {trip.start_date && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(trip.start_date).toLocaleDateString()} -{" "}
                    {trip.end_date
                      ? new Date(trip.end_date).toLocaleDateString()
                      : "TBD"}
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {/* Định dạng tiền tệ cho dễ đọc (ví dụ: dùng Intl.NumberFormat nếu cần) */}
                  {trip.spent_amount.toLocaleString("vi-VN")} /{" "}
                  {trip.total_budget.toLocaleString("vi-VN")} {trip.currency}
                </div>
                {trip.departure && trip.destination && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {trip.departure} → {trip.destination}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-trip rounded-full h-2"
                    style={{
                      width: `${Math.min(
                        (trip.spent_amount / trip.total_budget) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((trip.spent_amount / trip.total_budget) * 100).toFixed(0)}%
                  of budget used
                </p>
              </div>
            </Link>
          ))}
        </div>

        {trips.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No trips yet
            </h3>
            <p className="text-muted-foreground">
              Start planning your next adventure!
            </p>
          </div>
        )}
      </div>

      {/* RENDER MODAL */}
      <FormNewTrip
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onTripCreated={handleTripCreated}
      />
    </div>
  );
};
