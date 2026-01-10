"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Navigation,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Loader2,
  CloudLightning,
  CloudFog,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "../../contexts/AuthContext";
import { getTravelImageUrl } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";
import Loading from "../../components/Loading/Loading";
import Hero from "../../components/Hero/Hero";
import { ANIMATIONS } from "../../constants/animations";
import PulseGlow from "../../components/Animations/PulseGlow";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  visibility: number;
  description: string;
  icon: string;
  main: string;
  city: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface City {
  name: string;
  lat: number;
  lng: number;
}

interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    visibility?: number;
    weather_code: number;
  };
}

interface GeoApiResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
  };
}

const VIETNAM_CITIES: City[] = [
  { name: "Hồ Chí Minh", lat: 10.762880383009653, lng: 106.6824797006774 },
  { name: "Hà Nội", lat: 21.0285, lng: 105.8542 },
  { name: "Đà Nẵng", lat: 16.0544, lng: 108.2022 },
  { name: "Hải Phòng", lat: 20.8449, lng: 106.6881 },
  { name: "Cần Thơ", lat: 10.0452, lng: 105.7469 },
  { name: "An Giang", lat: 10.5216, lng: 105.1259 },
  { name: "Bà Rịa - Vũng Tàu", lat: 10.3460, lng: 107.0843 },
  { name: "Bắc Giang", lat: 21.2731, lng: 106.1946 },
  { name: "Bắc Kạn", lat: 22.1470, lng: 105.8342 },
  { name: "Bạc Liêu", lat: 9.2942, lng: 105.7272 },
  { name: "Bắc Ninh", lat: 21.1861, lng: 106.0763 },
  { name: "Bến Tre", lat: 10.2415, lng: 106.3759 },
  { name: "Bình Định", lat: 13.7750, lng: 109.2233 },
  { name: "Bình Dương", lat: 11.3254, lng: 106.4771 },
  { name: "Bình Phước", lat: 11.6476, lng: 106.6056 },
  { name: "Bình Thuận", lat: 10.9287, lng: 108.1021 },
  { name: "Cà Mau", lat: 9.1776, lng: 105.1527 },
  { name: "Cao Bằng", lat: 22.6657, lng: 106.2577 },
  { name: "Đắk Lắk", lat: 12.6662, lng: 108.0500 },
  { name: "Đắk Nông", lat: 12.0046, lng: 107.6877 },
  { name: "Điện Biên", lat: 21.4064, lng: 103.0157 },
  { name: "Đồng Nai", lat: 10.9574, lng: 106.8429 },
  { name: "Đồng Tháp", lat: 10.4930, lng: 105.6882 },
  { name: "Gia Lai", lat: 13.9833, lng: 108.0000 },
  { name: "Hà Giang", lat: 22.8183, lng: 104.9833 },
  { name: "Hà Nam", lat: 20.5433, lng: 105.9220 },
  { name: "Hà Tĩnh", lat: 18.3428, lng: 105.9058 },
  { name: "Hải Dương", lat: 20.9373, lng: 106.3146 },
  { name: "Hậu Giang", lat: 9.7844, lng: 105.4706 },
  { name: "Hòa Bình", lat: 20.8133, lng: 105.3383 },
  { name: "Hưng Yên", lat: 20.6464, lng: 106.0519 },
  { name: "Khánh Hòa", lat: 12.2388, lng: 109.1967 },
  { name: "Kiên Giang", lat: 9.9580, lng: 105.1324 },
  { name: "Kon Tum", lat: 14.3545, lng: 108.0076 },
  { name: "Lai Châu", lat: 22.3864, lng: 103.4700 },
  { name: "Lâm Đồng", lat: 11.9404, lng: 108.4583 },
  { name: "Lạng Sơn", lat: 21.8537, lng: 106.7613 },
  { name: "Lào Cai", lat: 22.4856, lng: 103.9700 },
  { name: "Long An", lat: 10.6086, lng: 106.6714 },
  { name: "Nam Định", lat: 20.4200, lng: 106.1683 },
  { name: "Nghệ An", lat: 18.6796, lng: 105.6813 },
  { name: "Ninh Bình", lat: 20.2539, lng: 105.9750 },
  { name: "Ninh Thuận", lat: 11.5646, lng: 108.9886 },
  { name: "Phú Thọ", lat: 21.3087, lng: 105.2044 },
  { name: "Phú Yên", lat: 13.0883, lng: 109.2950 },
  { name: "Quảng Bình", lat: 17.4687, lng: 106.6227 },
  { name: "Quảng Nam", lat: 15.8801, lng: 108.3380 },
  { name: "Quảng Ngãi", lat: 15.1167, lng: 108.8000 },
  { name: "Quảng Ninh", lat: 21.0064, lng: 107.2925 },
  { name: "Quảng Trị", lat: 16.7500, lng: 107.2000 },
  { name: "Sóc Trăng", lat: 9.6025, lng: 105.9739 },
  { name: "Sơn La", lat: 21.3257, lng: 103.9167 },
  { name: "Tây Ninh", lat: 11.3131, lng: 106.0963 },
  { name: "Thái Bình", lat: 20.4461, lng: 106.3369 },
  { name: "Thái Nguyên", lat: 21.5928, lng: 105.8442 },
  { name: "Thanh Hóa", lat: 19.8067, lng: 105.7845 },
  { name: "Thừa Thiên Huế", lat: 16.4637, lng: 107.5909 },
  { name: "Tiền Giang", lat: 10.3600, lng: 106.3600 },
  { name: "Trà Vinh", lat: 9.9347, lng: 106.3453 },
  { name: "Tuyên Quang", lat: 21.8183, lng: 105.2119 },
  { name: "Vĩnh Long", lat: 10.2537, lng: 105.9750 },
  { name: "Vĩnh Phúc", lat: 21.3087, lng: 105.5972 },
  { name: "Yên Bái", lat: 21.7050, lng: 104.8700 },
];

const getWeatherIcon = (main: string, description: string) => {
  const desc = description.toLowerCase();
  if (desc.includes("thunderstorm") || desc.includes("lightning")) {
    return <CloudLightning className="w-16 h-16 text-yellow-400" />;
  }
  if (desc.includes("snow")) {
    return <CloudSnow className="w-16 h-16 text-blue-200" />;
  }
  if (desc.includes("rain") || desc.includes("drizzle")) {
    return <CloudRain className="w-16 h-16 text-blue-400" />;
  }
  if (desc.includes("fog") || desc.includes("mist")) {
    return <CloudFog className="w-16 h-16 text-gray-400" />;
  }
  if (desc.includes("cloud")) {
    return <Cloud className="w-16 h-16 text-gray-300" />;
  }
  return <Sun className="w-16 h-16 text-yellow-400" />;
};

const getWeatherDescription = (
  main: string,
  description: string,
  temp: number
): string => {
  const desc = description.toLowerCase();
  const tempDesc =
    temp > 30
      ? "hot"
      : temp > 25
      ? "warm"
      : temp > 15
      ? "mild"
      : temp > 5
      ? "cool"
      : "cold";

  if (desc.includes("thunderstorm")) {
    return `There is a thunderstorm with lightning. The temperature is ${tempDesc} at ${temp}°C. Be cautious and stay indoors if possible.`;
  }
  if (desc.includes("snow")) {
    return `It's snowing! The temperature is ${tempDesc} at ${temp}°C. Dress warmly and be careful on slippery surfaces.`;
  }
  if (desc.includes("rain") || desc.includes("drizzle")) {
    return `It's raining outside. The temperature is ${tempDesc} at ${temp}°C. Don't forget your umbrella!`;
  }
  if (desc.includes("fog") || desc.includes("mist")) {
    return `There is fog or mist reducing visibility. The temperature is ${tempDesc} at ${temp}°C. Drive carefully.`;
  }
  if (desc.includes("cloud")) {
    return `The sky is cloudy. The temperature is ${tempDesc} at ${temp}°C. It's a good day for outdoor activities.`;
  }
  return `The weather is clear and sunny! The temperature is ${tempDesc} at ${temp}°C. Perfect weather for outdoor adventures!`;
};

export const Weather: React.FC = () => {
  const router = useRouter();
  const { profile } = useAuth();
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("current");
  const [isLocationFromProfile, setIsLocationFromProfile] = useState(false);

  const DEFAULT_LAT = 10.762880383009653;
  const DEFAULT_LNG = 106.6824797006774;

  useEffect(() => {
    const getUserLocation = async () => {
      if (profile?.latitude && profile?.longitude) {
        const lat = typeof profile.latitude === 'string' ? parseFloat(profile.latitude) : profile.latitude;
        const lng = typeof profile.longitude === 'string' ? parseFloat(profile.longitude) : profile.longitude;
        
        if (!isNaN(lat) && !isNaN(lng)) {
          setLocation({ lat, lng });
          setIsLocationFromProfile(true);
          setSelectedCity("current");
          return;
        }
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setIsLocationFromProfile(false);
            setSelectedCity("current");
          },
          () => {
            setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
            setIsLocationFromProfile(false);
            setSelectedCity("current");
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setIsLocationFromProfile(false);
        setSelectedCity("current");
      }
    };

    getUserLocation();
  }, [profile]);

  const fetchWeather = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&timezone=auto`
      );

      if (!response.ok) throw new Error("Weather API error");

      const data: WeatherApiResponse = await response.json();
      const current = data.current;

      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`
      );
      const geoData: GeoApiResponse = await geoResponse.json();

      const weatherCodeMap: Record<number, { main: string; description: string }> = {
        0: { main: "Clear", description: "clear sky" },
        1: { main: "Clear", description: "mainly clear" },
        2: { main: "Clouds", description: "partly cloudy" },
        3: { main: "Clouds", description: "overcast" },
        45: { main: "Fog", description: "fog" },
        48: { main: "Fog", description: "depositing rime fog" },
        51: { main: "Drizzle", description: "light drizzle" },
        53: { main: "Drizzle", description: "moderate drizzle" },
        55: { main: "Drizzle", description: "dense drizzle" },
        56: { main: "Drizzle", description: "light freezing drizzle" },
        57: { main: "Drizzle", description: "dense freezing drizzle" },
        61: { main: "Rain", description: "slight rain" },
        63: { main: "Rain", description: "moderate rain" },
        65: { main: "Rain", description: "heavy rain" },
        66: { main: "Rain", description: "light freezing rain" },
        67: { main: "Rain", description: "heavy freezing rain" },
        71: { main: "Snow", description: "slight snow fall" },
        73: { main: "Snow", description: "moderate snow fall" },
        75: { main: "Snow", description: "heavy snow fall" },
        77: { main: "Snow", description: "snow grains" },
        80: { main: "Rain", description: "slight rain showers" },
        81: { main: "Rain", description: "moderate rain showers" },
        82: { main: "Rain", description: "violent rain showers" },
        85: { main: "Snow", description: "slight snow showers" },
        86: { main: "Snow", description: "heavy snow showers" },
        95: { main: "Thunderstorm", description: "thunderstorm" },
        96: { main: "Thunderstorm", description: "thunderstorm with slight hail" },
        99: { main: "Thunderstorm", description: "thunderstorm with heavy hail" },
      };

      const weatherInfo = weatherCodeMap[current.weather_code] || {
        main: "Unknown",
        description: "unknown",
      };

      setWeather({
        temp: Math.round(current.temperature_2m),
        feels_like: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        wind_speed: Math.round(current.wind_speed_10m * 3.6),
        visibility: current.visibility
          ? Math.round(current.visibility / 1000)
          : 10,
        description: weatherInfo.description,
        icon: weatherInfo.main.toLowerCase(),
        main: weatherInfo.main,
        city:
          geoData.address?.city ||
          geoData.address?.town ||
          geoData.address?.village ||
          "Unknown Location",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch weather data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    if (location) {
      fetchWeather();
    }
  }, [location, fetchWeather]);

  if (loading) {
    return <Loading type="default" message="Loading weather information..." />;
  }

  if (error || !weather) {
    return (
      <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT} flex items-center justify-center p-4`}>
        <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-2xl shadow-xl p-8 max-w-md w-full text-center`}>
          <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
            <Image
              src={getTravelImageUrl("weather error", 200, 200)}
              alt="Error"
              fill
              className="object-cover opacity-50"
              unoptimized
            />
          </div>
          <AlertTriangle className={`w-16 h-16 text-red-500 mx-auto mb-4`} />
          <h2 className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT} mb-2`}>
            Weather Error
          </h2>
          <p className={`${COLORS.TEXT.MUTED} mb-6`}>
            {error || "Unable to fetch weather data"}
          </p>
          <button
            onClick={fetchWeather}
            className={`${GRADIENTS.PRIMARY} text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity`}
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    
    if (cityName === "current") {
      if (profile?.latitude && profile?.longitude) {
        const lat = typeof profile.latitude === 'string' ? parseFloat(profile.latitude) : profile.latitude;
        const lng = typeof profile.longitude === 'string' ? parseFloat(profile.longitude) : profile.longitude;
        if (!isNaN(lat) && !isNaN(lng)) {
          setLocation({ lat, lng });
          setIsLocationFromProfile(true);
          return;
        }
      }
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setIsLocationFromProfile(false);
          },
          () => {
            setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
            setIsLocationFromProfile(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setIsLocationFromProfile(false);
      }
    } else {
      const city = VIETNAM_CITIES.find(c => c.name === cityName);
      if (city) {
        setLocation({ lat: city.lat, lng: city.lng });
        setIsLocationFromProfile(false);
      }
    }
  };

  const weatherDescription = getWeatherDescription(
    weather.main,
    weather.description,
    weather.temp
  );

  return (
    <div className={`min-h-screen ${COLORS.BACKGROUND.DEFAULT} py-8 px-4`}>
      {/* Hero Section */}
      <Hero
        title="Weather Forecast 🌤️"
        description="Plan your trips with accurate weather information"
        imageKeyword="weather forecast sky"
        height="small"
      />

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className={`mb-6 flex items-center text-sm font-medium ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.DEFAULT} transition-colors`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </button>

        {/* City Selector */}
        <div className={`mb-6 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg p-4`}>
          <label className={`block text-sm font-semibold ${COLORS.TEXT.DEFAULT} mb-2`}>
            <MapPin className="w-4 h-4 inline mr-1" />
            Chọn địa điểm xem thời tiết
          </label>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className={`w-full px-4 py-3 pr-10 ${COLORS.BACKGROUND.DEFAULT} ${COLORS.BORDER.DEFAULT} border-2 rounded-lg ${COLORS.TEXT.DEFAULT} font-medium focus:outline-none focus:ring-2 focus:${COLORS.BORDER.PRIMARY} appearance-none cursor-pointer transition-all`}
            >
              <option value="current">
                📍 Vị trí hiện tại {isLocationFromProfile ? "(từ hồ sơ)" : ""}
              </option>
              {VIETNAM_CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 ${COLORS.TEXT.MUTED} pointer-events-none`} />
          </div>
        </div>

        {/* Main Weather Card */}
        <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-2xl shadow-2xl overflow-hidden ${ANIMATIONS.FADE.IN_UP}`}>
          {/* Header */}
          <div className={`${GRADIENTS.PRIMARY} p-8 text-white ${ANIMATIONS.PULSE.GENTLE}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <MapPin className={`w-5 h-5 mr-2 ${ANIMATIONS.BOUNCE.SOFT}`} />
                  <span className="text-lg font-semibold">{weather.city}</span>
                </div>
                <p className="text-white/80 text-sm">Current Weather</p>
              </div>
              <button
                onClick={fetchWeather}
                className={`p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors ${ANIMATIONS.ROTATE.MEDIUM}`}
                title="Refresh weather"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weather Content */}
          <div className="p-8">
            {/* Main Weather Display */}
            <div className={`flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b ${COLORS.BORDER.DEFAULT}`}>
              <div className="flex items-center space-x-6 mb-6 md:mb-0">
                <PulseGlow variant="glow" className={COLORS.TEXT.PRIMARY}>
                  <div className={ANIMATIONS.ROTATE.SLOW}>
                    {getWeatherIcon(weather.main, weather.description)}
                  </div>
                </PulseGlow>
                <div>
                  <div className={`text-6xl font-bold ${COLORS.TEXT.DEFAULT} mb-2 ${ANIMATIONS.FADE.IN_UP}`}>
                    {weather.temp}°C
                  </div>
                  <div className={`text-xl ${COLORS.TEXT.MUTED} capitalize ${ANIMATIONS.FADE.IN_UP}`} style={{ animationDelay: "0.1s" }}>
                    {weather.description}
                  </div>
                  <div className={`text-sm ${COLORS.TEXT.MUTED} mt-1 ${ANIMATIONS.FADE.IN_UP}`} style={{ animationDelay: "0.2s" }}>
                    Feels like {weather.feels_like}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Description */}
            <div className={`${COLORS.PRIMARY.LIGHT} rounded-xl p-6 mb-8`}>
              <h3 className={`text-lg font-semibold ${COLORS.TEXT.DEFAULT} mb-3 flex items-center`}>
                <Cloud className={`w-5 h-5 mr-2 ${COLORS.TEXT.PRIMARY}`} />
                Weather Description
              </h3>
              <p className={`${COLORS.TEXT.DEFAULT} leading-relaxed text-lg`}>
                {weatherDescription}
              </p>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className={`${COLORS.BACKGROUND.MUTED} rounded-xl p-4 ${ANIMATIONS.FADE.IN_UP} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`} style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center mb-2">
                  <Droplets className={`w-5 h-5 text-blue-500 mr-2 ${ANIMATIONS.PULSE.GENTLE}`} />
                  <span className={`text-sm ${COLORS.TEXT.MUTED}`}>Humidity</span>
                </div>
                <div className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
                  {weather.humidity}%
                </div>
              </div>

              <div className={`${COLORS.BACKGROUND.MUTED} rounded-xl p-4 ${ANIMATIONS.FADE.IN_UP} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`} style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center mb-2">
                  <Wind className={`w-5 h-5 ${COLORS.TEXT.PRIMARY} mr-2 ${ANIMATIONS.ROTATE.SLOW}`} />
                  <span className={`text-sm ${COLORS.TEXT.MUTED}`}>Wind Speed</span>
                </div>
                <div className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
                  {weather.wind_speed} km/h
                </div>
              </div>

              <div className={`${COLORS.BACKGROUND.MUTED} rounded-xl p-4 ${ANIMATIONS.FADE.IN_UP} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`} style={{ animationDelay: "0.3s" }}>
                <div className="flex items-center mb-2">
                  <Eye className={`w-5 h-5 text-purple-500 mr-2 ${ANIMATIONS.PULSE.GENTLE}`} />
                  <span className={`text-sm ${COLORS.TEXT.MUTED}`}>Visibility</span>
                </div>
                <div className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
                  {weather.visibility} km
                </div>
              </div>

              <div className={`${COLORS.BACKGROUND.MUTED} rounded-xl p-4 ${ANIMATIONS.FADE.IN_UP} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`} style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center mb-2">
                  <Thermometer className={`w-5 h-5 text-red-500 mr-2 ${ANIMATIONS.PULSE.GLOW}`} />
                  <span className={`text-sm ${COLORS.TEXT.MUTED}`}>Feels Like</span>
                </div>
                <div className={`text-2xl font-bold ${COLORS.TEXT.DEFAULT}`}>
                  {weather.feels_like}°C
                </div>
              </div>
            </div>

            {/* Location Map */}
            {location && typeof window !== "undefined" && (
              <div className="mt-8">
                <h3 className={`text-lg font-semibold ${COLORS.TEXT.DEFAULT} mb-4 flex items-center`}>
                  <MapPin className={`w-5 h-5 mr-2 ${COLORS.TEXT.PRIMARY}`} />
                  Location Map
                </h3>
                <div
                  className={`rounded-xl overflow-hidden ${COLORS.BORDER.DEFAULT} border`}
                  style={{ height: "400px" }}
                >
                  <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[location.lat, location.lng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">{weather.city}</p>
                          <p className="text-sm text-gray-600">
                            {weather.temp}°C - {weather.description}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
