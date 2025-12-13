"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Activity,
  ArrowLeft,
  PlusCircle,
  Route,
  Navigation,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AddRouteForm } from "./AddRouteForm";

// --- INTERFACE/TYPES ĐÃ CẬP NHẬT ---
export interface IRoute {
  id?: string;
  index: number; // Đã thay thế cho 'day'
  trip_id: string; // Mới
  title: string;
  description: string; // Mới
  lngStart: number;
  latStart: number;
  lngEnd: number;
  latEnd: number;
  details: string[]; // Thay thế cho details
  created_at: Date; // Mới
  updated_at: Date; // Mới
}

interface TripDetail {
  id: string;
  title: string;
  description: string;
  departure: string;
  destination: string;
  start_date: string;
  end_date: string;
  difficult: number;
  total_budget: number;
  spent_amount: number;
  status: "planning" | "ongoing" | "completed" | "cancelled";
  currency: string;
  members: number;
  routes: IRoute[]; // Đã thay đổi
}

// Giá trị giả định cho created_at/updated_at
const mockDate = new Date();

// --- MOCK DATA ĐÃ SỬA ĐỔI (DÙNG 'index', THÊM TRƯỜNG MỚI) ---
const MOCK_DETAIL_TRIPS: TripDetail[] = [
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
        id: "r1_1",
        index: 1,
        trip_id: "mock_trip_1",
        title: "Hà Nội - Du thuyền Hạ Long",
        description: "Di chuyển từ thủ đô ra Hạ Long và lên du thuyền.",
        lngStart: 105.854,
        latStart: 21.028,
        lngEnd: 107.031,
        latEnd: 20.912,
        details: [
          "Di chuyển từ Hà Nội",
          "Nhận phòng du thuyền",
          "Ăn trưa & thăm quan Hang Sửng Sốt",
        ],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r1_2",
        index: 2,
        trip_id: "mock_trip_1",
        title: "Khám phá Lan Hạ và Kayak",
        description: "Hoạt động chính trong ngày là chèo kayak và học nấu ăn.",
        lngStart: 107.031,
        latStart: 20.912,
        lngEnd: 107.025,
        latEnd: 20.8,
        details: [
          "Ngắm bình minh",
          "Chèo thuyền kayak tại Vịnh Lan Hạ",
          "Lớp học nấu ăn Việt Nam",
        ],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r1_3",
        index: 3,
        trip_id: "mock_trip_1",
        title: "Du thuyền - Trở về Hà Nội",
        description: "Ăn sáng và trở về đất liền, kết thúc chuyến đi.",
        lngStart: 107.025,
        latStart: 20.8,
        lngEnd: 105.854,
        latEnd: 21.028,
        details: ["Ăn sáng cuối cùng", "Trở về Hà Nội"],
        created_at: mockDate,
        updated_at: mockDate,
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
        id: "r2_1",
        index: 1,
        trip_id: "mock_trip_2",
        title: "Sapa - Trạm Tôn - Trại 1 (2200m)",
        description: "Khởi hành trekking và nghỉ đêm đầu tiên.",
        lngStart: 103.834,
        latStart: 22.337,
        lngEnd: 103.811,
        latEnd: 22.3,
        details: [
          "Di chuyển đến Trạm Tôn",
          "Bắt đầu trekking",
          "Nghỉ đêm tại Trại 1",
        ],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r2_2",
        index: 2,
        trip_id: "mock_trip_2",
        title: "Trại 1 - Trại 2 (2800m)",
        description: "Ngày leo dốc chính.",
        lngStart: 103.811,
        latStart: 22.3,
        lngEnd: 103.785,
        latEnd: 22.28,
        details: ["Leo dốc cao", "Ăn trưa dã chiến"],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r2_3",
        index: 3,
        trip_id: "mock_trip_2",
        title: "Đỉnh Fansipan - Trại 2",
        description: "Chinh phục đỉnh vào sáng sớm.",
        lngStart: 103.785,
        latStart: 22.28,
        lngEnd: 103.787,
        latEnd: 22.3,
        details: ["Chinh phục đỉnh Fansipan lúc bình minh", "Trở về Trại 2"],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r2_4",
        index: 4,
        trip_id: "mock_trip_2",
        title: "Trại 2 - Sapa",
        description: "Hạ sơn và kết thúc hành trình.",
        lngStart: 103.787,
        latStart: 22.3,
        lngEnd: 103.834,
        latEnd: 22.337,
        details: ["Hạ sơn", "Ăn mừng chiến thắng"],
        created_at: mockDate,
        updated_at: mockDate,
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
        id: "r3_1",
        index: 1,
        trip_id: "mock_trip_3",
        title: "TP.HCM - Đà Lạt (Di chuyển & Check-in)",
        description: "Di chuyển lên Đà Lạt và nghỉ ngơi.",
        lngStart: 106.666,
        latStart: 10.793,
        lngEnd: 108.441,
        latEnd: 11.942,
        details: [
          "Bay/Xe khách đến Đà Lạt",
          "Nhận phòng khách sạn",
          "Ăn tối tại Chợ đêm Đà Lạt",
        ],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r3_2",
        index: 2,
        trip_id: "mock_trip_3",
        title: "Thăm quan phía Đông",
        description: "Thăm quan các điểm nổi tiếng phía Đông thành phố.",
        lngStart: 108.441,
        latStart: 11.942,
        lngEnd: 108.513,
        latEnd: 11.928,
        details: [
          "Đồi chè Cầu Đất",
          "Chùa Linh Phước",
          "Quảng trường Lâm Viên",
        ],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r3_3",
        index: 3,
        trip_id: "mock_trip_3",
        title: "Thăm quan phía Bắc",
        description: "Thăm các địa điểm nghỉ dưỡng và tự nhiên.",
        lngStart: 108.513,
        latStart: 11.928,
        lngEnd: 108.423,
        latEnd: 11.948,
        details: ["Đường hầm đất sét", "Hồ Tuyền Lâm", "Thiền viện Trúc Lâm"],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r3_4",
        index: 4,
        trip_id: "mock_trip_3",
        title: "Vườn Dâu & Cafe",
        description: "Thư giãn và thưởng thức đặc sản.",
        lngStart: 108.423,
        latStart: 11.948,
        lngEnd: 108.441,
        latEnd: 11.942,
        details: ["Thăm vườn dâu", "Thưởng thức cafe tại tiệm cafe nổi tiếng"],
        created_at: mockDate,
        updated_at: mockDate,
      },
      {
        id: "r3_5",
        index: 5,
        trip_id: "mock_trip_3",
        title: "Đà Lạt - TP.HCM",
        description: "Di chuyển về và mua sắm.",
        lngStart: 108.441,
        latStart: 11.942,
        lngEnd: 106.666,
        latEnd: 10.793,
        details: ["Mua sắm đặc sản", "Di chuyển về"],
        created_at: mockDate,
        updated_at: mockDate,
      },
    ],
  },
];
// --- KẾT THÚC MOCK DATA CHI TIẾT ĐÃ SỬA LỖI ---

// Hàm giả lập fetch trip
const fetchTripDetail = (id: string): Promise<TripDetail | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const trip = MOCK_DETAIL_TRIPS.find((t) => t.id === id);
      resolve(trip);
    }, 500);
  });
};

interface DetailTripProps {
  params: {
    id: string;
  };
}

// Component chính
export const DetailTrip: React.FC<DetailTripProps> = ({ params }) => {
  const router = useRouter();
  const tripId = params.id;

  const isValidId = tripId && typeof tripId === "string" && tripId.length > 0;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(isValidId);
  const [isAddingRoute, setIsAddingRoute] = useState(false);

  useEffect(() => {
    if (isValidId) {
      const loadTrip = async () => {
        const data = await fetchTripDetail(tripId);
        setTrip(data || null);
        setLoading(false);
      };
      loadTrip();
    } else {
      setLoading(false);
      setTrip(null);
    }
  }, [tripId, isValidId]);

  // Hàm xử lý khi thêm Route mới
  const handleAddNewRoute = (
    newRoute: Omit<IRoute, "id" | "created_at" | "updated_at" | "trip_id">
  ) => {
    if (!trip) return;

    // Giả lập thêm route vào mock data
    const newId = `r${trip.routes.length + 1}_${Date.now()}`;
    const now = new Date();

    // Thêm các trường thiếu
    const routeWithId: IRoute = {
      ...newRoute,
      id: newId,
      trip_id: trip.id,
      created_at: now,
      updated_at: now,
    };

    setTrip({
      ...trip,
      routes: [...trip.routes, routeWithId],
    });

    setIsAddingRoute(false);
  };

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
        return "bg-blue-100 text-blue-700";
      case "ongoing":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
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
    <div className="min-h-screen bg-background relative">
      {/* Component Thêm Route (Dạng Modal/Side Panel) */}
      {isAddingRoute && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <AddRouteForm
            onClose={() => setIsAddingRoute(false)}
            onSubmit={handleAddNewRoute}
            currentMaxIndex={
              trip.routes.length > 0
                ? Math.max(...trip.routes.map((r) => r.index))
                : 0
            }
          />
        </div>
      )}

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
                    {new Date(trip.start_date).toLocaleDateString("vi-VN")}
                  </span>
                </p>
                <p className="flex justify-between items-center text-foreground">
                  **Ngày về:**{" "}
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />{" "}
                    {new Date(trip.end_date).toLocaleDateString("vi-VN")}
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

          {/* Cột Phải: Lịch trình chi tiết (Hiển thị danh sách Route phẳng) */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-2xl font-bold text-foreground flex items-center">
                <Activity className="w-6 h-6 mr-2 text-traveller" /> Danh sách
                Chặng đường
              </h2>
              <button
                onClick={() => setIsAddingRoute(true)}
                className="flex items-center text-trip hover:text-trip-dark transition-colors font-medium text-sm border border-trip rounded-full px-3 py-1"
              >
                <PlusCircle className="w-4 h-4 mr-1" /> Thêm Chặng
              </button>
            </div>

            <div className="space-y-4">
              {trip.routes.map((route: IRoute) => (
                <div
                  key={route.id}
                  className="bg-card p-5 rounded-xl shadow-md border border-border transition-shadow hover:shadow-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-foreground">
                      <Route className="inline w-5 h-5 mr-2 text-traveller" />
                      Chặng {route.index}: {route.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-trip/10 text-trip">
                      Index {route.index}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {route.description}
                  </p>

                  {/* Tọa độ */}
                  <div className="text-sm text-muted-foreground mb-3 p-3 bg-muted rounded-md border border-border">
                    <h4 className="font-semibold text-foreground mb-1 flex items-center">
                      <Navigation className="w-4 h-4 mr-1" /> Tọa độ:
                    </h4>
                    <p>
                      **Bắt đầu:** Lat: **{route.latStart}**, Lng: **
                      {route.lngStart}**
                    </p>
                    <p>
                      **Kết thúc:** Lat: **{route.latEnd}**, Lng: **
                      {route.lngEnd}**
                    </p>
                  </div>

                  <h4 className="font-semibold text-sm text-foreground/80 mb-1">
                    Hoạt động:
                  </h4>
                  <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 ml-4">
                    {route.details.map((detail: string, i: number) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailTrip;
