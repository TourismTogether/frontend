// src/lib/type/interface.ts

export interface IDestination {
  id?: string;
  region_id: string;
  name: string;
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  best_season: string;
  rating: number;
  images: Array<string>;
  created_at: Date;
  updated_at: Date;
}

export interface ITrip {
  id?: string;
  destination_id: string;
  title: string;
  description: string;
  departure: string;
  distance: number;
  start_date: string; // Đã sửa: dùng string cho dữ liệu từ API
  end_date: string; // Đã sửa: dùng string cho dữ liệu từ API
  difficult: number;
  total_budget: number;
  spent_amount: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  members: number; // Đã THÊM: để khớp với TripDetail
  currency: string; // Đã THÊM: để khớp với TripDetail
}

export interface ICost {
  id?: string;
  title: string;
  route_id: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface IRoute {
  id?: string;
  index: number;
  trip_id: string;
  title: string;
  description: string;
  lngStart: number;
  latStart: number;
  lngEnd: number;
  latEnd: number;
  details: string[];
  costs: ICost[];
  created_at: Date;
  updated_at: Date;
}

// Kiểu tổng hợp để hiển thị trên UI
export interface TripDetail {
  id: string;
  title: string;
  description: string;
  departure: string;
  // Destination có thể là Object nếu API trả về embed, hoặc chỉ là string/id.
  destination: IDestination | string | { name: string };
  start_date: string;
  end_date: string;
  difficult: number;
  total_budget: number;
  spent_amount: number;
  status: "planning" | "ongoing" | "completed" | "cancelled" | string;
  currency: string;
  members: number;
  routes: IRoute[];
  distance: number;
}
