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
  start_date: Date;
  end_date: Date;
  difficult: number;
  total_budget: number;
  spent_amount: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface IRoute {
  id?: string;
  index: number;
  trip_id: string;
  title: string;
  description: string;
  lngStart: number; // Kinh độ điểm bắt đầu
  latStart: number; // Vĩ độ điểm bắt đầu
  lngEnd: number; // Kinh độ điểm kết thúc
  latEnd: number; // Vĩ độ điểm kết thúc
  created_at: Date;
  updated_at: Date;
}
