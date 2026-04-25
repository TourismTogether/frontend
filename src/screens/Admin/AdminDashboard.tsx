"use client";

import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { Users, Shield, Map, BookOpen } from "lucide-react";
import { ADMIN_DS } from "./adminDesignSystem";

type Stats = {
  users: number;
  supporters: number;
  regions: number;
  destinations: number;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    supporters: 0,
    regions: 0,
    destinations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError("");
        const [usersRes, supportersRes, regionsRes, destinationsRes] =
          await Promise.all([
            fetch(API_ENDPOINTS.USERS.BASE, { credentials: "include" }),
            fetch(API_ENDPOINTS.SUPPORTERS.BASE, { credentials: "include" }),
            fetch(API_ENDPOINTS.REGIONS.BASE, { credentials: "include" }),
            fetch(API_ENDPOINTS.DESTINATIONS.BASE, { credentials: "include" }),
          ]);

        const [usersJson, supportersJson, regionsJson, destinationsJson] =
          await Promise.all([
            usersRes.json(),
            supportersRes.json(),
            regionsRes.json(),
            destinationsRes.json(),
          ]);

        setStats({
          users: Array.isArray(usersJson?.data) ? usersJson.data.length : 0,
          supporters: Array.isArray(supportersJson?.data)
            ? supportersJson.data.length
            : 0,
          regions: Array.isArray(regionsJson?.data) ? regionsJson.data.length : 0,
          destinations: Array.isArray(destinationsJson?.data)
            ? destinationsJson.data.length
            : 0,
        });
      } catch {
        setError("Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Total Supporters", value: stats.supporters, icon: Shield },
    { label: "Total Regions", value: stats.regions, icon: Map },
    { label: "Total Destinations", value: stats.destinations, icon: BookOpen },
  ];

  const maxValue = Math.max(...cards.map((c) => c.value), 1);
  const total = cards.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className={ADMIN_DS.page}>
      <div className="mb-6 md:mb-8">
        <h1 className={ADMIN_DS.title}>Admin Dashboard</h1>
        <p className={`${ADMIN_DS.subtitle} mt-2`}>
          Flat overview of key system entities.
        </p>
      </div>

      {error && <p className={`${ADMIN_DS.error} mb-4`}>{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={ADMIN_DS.card}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] text-[#4b5563]">{card.label}</p>
                <div className={ADMIN_DS.iconBox}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[24px] md:text-[32px] leading-none font-semibold text-[#111827]">
                {loading ? "Loading..." : card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mt-6">
        <div className={ADMIN_DS.section}>
          <h2 className="text-[20px] font-semibold text-[#111827] mb-4">
            Distribution Bar Chart
          </h2>
          <div className="space-y-3">
            {cards.map((card) => {
              const width = Math.max(6, Math.round((card.value / maxValue) * 100));
              return (
                <div key={`bar-${card.label}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] text-[#111827]">{card.label}</span>
                    <span className="text-[14px] font-medium text-[#111827]">
                      {card.value}
                    </span>
                  </div>
                  <div className="h-2 bg-[#f3f4f6] rounded">
                    <div
                      className="h-2 bg-[#F2673C] rounded"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={ADMIN_DS.section}>
          <h2 className="text-[20px] font-semibold text-[#111827] mb-4">
            Proportion Chart
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div
              className="w-44 h-44 rounded-full border border-[#e5e7eb]"
              style={{
                background: `conic-gradient(
                  #F2673C 0deg ${total ? (stats.users / total) * 360 : 0}deg,
                  #8B5CF6 ${total ? (stats.users / total) * 360 : 0}deg ${total ? ((stats.users + stats.supporters) / total) * 360 : 0}deg,
                  #16A34A ${total ? ((stats.users + stats.supporters) / total) * 360 : 0}deg ${total ? ((stats.users + stats.supporters + stats.regions) / total) * 360 : 0}deg,
                  #D97706 ${total ? ((stats.users + stats.supporters + stats.regions) / total) * 360 : 0}deg 360deg
                )`,
              }}
              aria-label="Admin entity proportion chart"
            />
            <div className="space-y-2 w-full">
              {[
                { label: "Users", color: "#F2673C", value: stats.users },
                { label: "Supporters", color: "#8B5CF6", value: stats.supporters },
                { label: "Regions", color: "#16A34A", value: stats.regions },
                { label: "Destinations", color: "#D97706", value: stats.destinations },
              ].map((entry) => (
                <div key={entry.label} className="flex items-center justify-between text-[14px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[#111827]">{entry.label}</span>
                  </div>
                  <span className="font-medium text-[#111827]">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
