// src/screens/Trips/DetailTrip.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Activity,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- MOCK DATA CHI TIẾT ---
const MOCK_DETAIL_TRIPS = [
  {
    id: "mock_trip_1",
    title: "Khám phá Vịnh Hạ Long",
    description:
      "Chuyến đi 3 ngày 2 đêm khám phá kỳ quan thiên nhiên thế giới, bao gồm chèo thuyền kayak và ngủ đêm trên du thuyền.",
    departure: "Hà Nội",
    destination: "Vịnh Hạ Long",
    start_date: "2025-01-15",
    end_date: "2025-01-17",
    difficult: 2,
    total_budget: 15000000,
    spent_amount: 8500000,
    status: "ongoing",
    currency: "VND",
    members: 4,
    routes: [
      {
        day: 1,
        title: "Hà Nội - Vịnh Hạ Long (Du thuyền)",
        details: [
          "Di chuyển từ Hà Nội",
          "Nhận phòng du thuyền",
          "Ăn trưa & thăm quan Hang Sửng Sốt",
        ],
      },
      {
        day: 2,
        title: "Khám phá Lan Hạ và Chèo Kayak",
        details: [
          "Ngắm bình minh",
          "Chèo thuyền kayak tại Vịnh Lan Hạ",
          "Lớp học nấu ăn Việt Nam",
        ],
      },
      {
        day: 3,
        title: "Du thuyền - Hà Nội",
        details: ["Ăn sáng cuối cùng", "Trở về Hà Nội"],
      },
    ],
  },
  {
    id: "mock_trip_2",
    title: "Trekking Fansipan",
    description:
      "Thử thách chinh phục nóc nhà Đông Dương trong 4 ngày. Cần chuẩn bị thể lực tốt.",
    departure: "Sapa",
    destination: "Fansipan Peak",
    start_date: "2025-06-10",
    end_date: "2025-06-13",
    difficult: 5,
    total_budget: 8000000,
    spent_amount: 0,
    status: "planning",
    currency: "VND",
    members: 2,
    routes: [
      {
        day: 1,
        title: "Sapa - Trạm Tôn - Trại 1 (2200m)",
        details: [
          "Di chuyển đến Trạm Tôn",
          "Bắt đầu trekking",
          "Nghỉ đêm tại Trại 1",
        ],
      },
      {
        day: 2,
        title: "Trại 1 - Trại 2 (2800m)",
        details: ["Leo dốc cao", "Ăn trưa dã chiến"],
      },
      {
        day: 3,
        title: "Trại 2 - Đỉnh Fansipan - Trại 2",
        details: ["Chinh phục đỉnh Fansipan lúc bình minh", "Trở về Trại 2"],
      },
      {
        day: 4,
        title: "Trại 2 - Trạm Tôn - Sapa",
        details: ["Hạ sơn", "Ăn mừng chiến thắng"],
      },
    ],
  },
  {
    id: "mock_trip_3",
    title: "Đà Lạt Chill",
    description:
      "Nghỉ dưỡng nhẹ nhàng tại thành phố ngàn hoa, thăm quan các vườn dâu và cà phê.",
    departure: "TP. Hồ Chí Minh",
    destination: "Đà Lạt",
    start_date: "2024-10-20",
    end_date: "2024-10-24",
    difficult: 1,
    total_budget: 6000000,
    spent_amount: 6300000,
    status: "completed",
    currency: "VND",
    members: 3,
    routes: [
      {
        day: 1,
        title: "TP.HCM - Đà Lạt (Di chuyển & Check-in)",
        details: [
          "Bay/Xe khách đến Đà Lạt",
          "Nhận phòng khách sạn",
          "Ăn tối tại Chợ đêm Đà Lạt",
        ],
      },
      {
        day: 2,
        title: "Thăm quan phía Đông",
        details: [
          "Đồi chè Cầu Đất",
          "Chùa Linh Phước (Chùa Ve Chai)",
          "Quảng trường Lâm Viên",
        ],
      },
      {
        day: 3,
        title: "Thăm quan phía Bắc",
        details: ["Đường hầm đất sét", "Hồ Tuyền Lâm", "Thiền viện Trúc Lâm"],
      },
      {
        day: 4,
        title: "Vườn Dâu & Cafe",
        details: ["Thăm vườn dâu", "Thưởng thức cafe tại tiệm cafe nổi tiếng"],
      },
      {
        day: 5,
        title: "Đà Lạt - TP.HCM",
        details: ["Mua sắm đặc sản", "Di chuyển về"],
      },
    ],
  },
];
// --- KẾT THÚC MOCK DATA CHI TIẾT ---

// Hàm giả lập fetch trip
const fetchTripDetail = (id: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const trip = MOCK_DETAIL_TRIPS.find((t) => t.id === id);
      resolve(trip);
    }, 500); // Giả lập độ trễ mạng
  });
};

interface DetailTripProps {
  params: {
    id: string; // ID chuyến đi được truyền từ page cha
  };
}

// Component chính
export const DetailTrip: React.FC<DetailTripProps> = ({ params }) => {
  const router = useRouter();
  const tripId = params.id;

  console.log("tripId", tripId);

  // Kiểm tra tính hợp lệ của ID
  const isValidId = tripId && typeof tripId === "string" && tripId.length > 0;

  const [trip, setTrip] = useState<any>(null);
  // Khởi tạo loading dựa trên tính hợp lệ của ID
  const [loading, setLoading] = useState(isValidId);

  useEffect(() => {
    if (isValidId) {
      const loadTrip = async () => {
        const data = await fetchTripDetail(tripId);
        setTrip(data);
        setLoading(false);
      };
      loadTrip();
    } else {
      // Xử lý trường hợp ID không hợp lệ ngay lập tức
      setLoading(false);
      setTrip(null);
    }
  }, [tripId, isValidId]);

  // Các hàm phụ trợ
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-users/20 text-users";
      case "ongoing":
        return "bg-traveller/20 text-traveller";
      case "completed":
        return "bg-green-500/20 text-green-700";
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

  if (!trip) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-destructive">
          Chuyến đi không tồn tại hoặc ID không hợp lệ
        </h1>
        <button
          onClick={() => router.push("/trips")}
          className="mt-4 text-trip hover:underline flex items-center justify-center mx-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách chuyến đi
        </button>
      </div>
    );
  }

  const budgetUsage = Math.min(
    (trip.spent_amount / trip.total_budget) * 100,
    100
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header và Title */}
        <div className="mb-8 border-b pb-4 border-border">
          <button
            onClick={() => router.push("/trips")}
            className="text-muted-foreground hover:text-trip flex items-center mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-extrabold text-foreground">
              {trip.title}
            </h1>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(
                trip.status
              )}`}
            >
              {trip.status.toUpperCase()}
            </span>
          </div>
          <p className="text-lg text-muted-foreground mt-2">
            {trip.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột Trái: Thông tin tổng quan và Ngân sách */}
          <div className="lg:col-span-1 space-y-8">
            {/* Box Thông tin cơ bản */}
            <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
              <h2 className="text-xl font-bold mb-4 text-trip flex items-center">
                <MapPin className="w-5 h-5 mr-2" /> Thông tin cơ bản
              </h2>
              <div className="space-y-3 text-sm">
                <p className="flex justify-between items-center text-foreground">
                  **Địa điểm:** <span>{trip.destination}</span>
                </p>
                <p className="flex justify-between items-center text-foreground">
                  **Khởi hành:** <span>{trip.departure}</span>
                </p>
                <p className="flex justify-between items-center text-foreground">
                  **Ngày đi:**{" "}
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />{" "}
                    {new Date(trip.start_date).toLocaleDateString()}
                  </span>
                </p>
                <p className="flex justify-between items-center text-foreground">
                  **Ngày về:**{" "}
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />{" "}
                    {new Date(trip.end_date).toLocaleDateString()}
                  </span>
                </p>
                <p className="flex justify-between items-center text-foreground">
                  **Thành viên:**{" "}
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" /> {trip.members}
                  </span>
                </p>
                <p className="flex justify-between items-center text-foreground">
                  **Mức độ khó:**{" "}
                  <span className="font-semibold text-traveller">
                    {trip.difficult}/5
                  </span>
                </p>
              </div>
            </div>

            {/* Box Ngân sách và Chi tiêu */}
            <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
              <h2 className="text-xl font-bold mb-4 text-trip flex items-center">
                <DollarSign className="w-5 h-5 mr-2" /> Ngân sách & Chi tiêu
              </h2>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="flex justify-between font-medium text-foreground">
                    Ngân sách tổng:{" "}
                    <span>{formatCurrency(trip.total_budget)}</span>
                  </p>
                  <p className="flex justify-between font-medium text-destructive">
                    Đã chi tiêu:{" "}
                    <span>{formatCurrency(trip.spent_amount)}</span>
                  </p>
                  <p className="flex justify-between text-muted-foreground mt-2 border-t pt-2 border-border">
                    Còn lại:{" "}
                    <span>
                      {formatCurrency(trip.total_budget - trip.spent_amount)}
                    </span>
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-sm mb-1 text-muted-foreground">
                    Tiến độ chi tiêu: **{budgetUsage.toFixed(1)}%**
                  </p>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`rounded-full h-3 ${
                        budgetUsage > 100 ? "bg-destructive" : "bg-trip"
                      }`}
                      style={{ width: `${budgetUsage}%` }}
                    ></div>
                  </div>
                  {budgetUsage > 100 && (
                    <p className="text-xs text-destructive mt-1">
                      Đã vượt ngân sách!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cột Phải: Lịch trình chi tiết */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-foreground border-b pb-2 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-traveller" /> Lịch trình
              Chi tiết
            </h2>

            <div className="space-y-8">
              {trip.routes.map((route: any, index: number) => (
                <div key={index} className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <Trophy className="w-6 h-6 text-trip" />
                    <div className="w-0.5 h-full bg-border mt-2" />
                  </div>
                  <div className="bg-card p-5 rounded-xl shadow-md flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Ngày {route.day}: {route.title}
                    </h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {route.details.map((detail: string, i: number) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
