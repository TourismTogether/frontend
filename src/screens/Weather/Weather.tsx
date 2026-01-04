"use client";

import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

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
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Fallback to Ho Chi Minh City if geolocation fails
          setLocation({ lat: 10.7769, lng: 106.7009 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocation({ lat: 10.7769, lng: 106.7009 });
    }
  }, []);

  const fetchWeather = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&timezone=auto`
      );

      if (!response.ok) throw new Error("Weather API error");

      const data = await response.json();
      const current = data.current;

      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`
      );
      const geoData = await geoResponse.json();

      // Map weather code to description
      const weatherCodeMap: {
        [key: number]: { main: string; description: string };
      } = {
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
        96: {
          main: "Thunderstorm",
          description: "thunderstorm with slight hail",
        },
        99: {
          main: "Thunderstorm",
          description: "thunderstorm with heavy hail",
        },
      };

      const weatherInfo = weatherCodeMap[current.weather_code] || {
        main: "Unknown",
        description: "unknown",
      };

      setWeather({
        temp: Math.round(current.temperature_2m),
        feels_like: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        wind_speed: Math.round(current.wind_speed_10m * 3.6), // Convert m/s to km/h
        visibility: current.visibility
          ? Math.round(current.visibility / 1000)
          : 10, // Convert m to km
        description: weatherInfo.description,
        icon: weatherInfo.main.toLowerCase(),
        main: weatherInfo.main,
        city:
          geoData.address?.city ||
          geoData.address?.town ||
          geoData.address?.village ||
          "Unknown Location",
      });
    } catch (err: unknown) {
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
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading weather information...</p>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Weather Error
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Unable to fetch weather data"}
          </p>
          <button
            onClick={fetchWeather}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const weatherDescription = getWeatherDescription(
    weather.main,
    weather.description,
    weather.temp
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </button>

        {/* Main Weather Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-lg font-semibold">{weather.city}</span>
                </div>
                <p className="text-indigo-100 text-sm">Current Weather</p>
              </div>
              <button
                onClick={fetchWeather}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Refresh weather"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weather Content */}
          <div className="p-8">
            {/* Main Weather Display */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center space-x-6 mb-6 md:mb-0">
                <div className="text-indigo-600">
                  {getWeatherIcon(weather.main, weather.description)}
                </div>
                <div>
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    {weather.temp}°C
                  </div>
                  <div className="text-xl text-gray-600 capitalize">
                    {weather.description}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Feels like {weather.feels_like}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Description */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Cloud className="w-5 h-5 mr-2 text-indigo-600" />
                Weather Description
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {weatherDescription}
              </p>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Droplets className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Humidity</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {weather.humidity}%
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Wind className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Wind Speed</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {weather.wind_speed} km/h
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Eye className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-sm text-gray-600">Visibility</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {weather.visibility} km
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Thermometer className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm text-gray-600">Feels Like</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {weather.feels_like}°C
                </div>
              </div>
            </div>

            {/* Location Map */}
            {location && typeof window !== "undefined" && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Location Map
                </h3>
                <div
                  className="rounded-xl overflow-hidden border border-gray-200"
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
