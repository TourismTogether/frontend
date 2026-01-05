"use client";

import React, { useState } from "react";
import {
  Shield,
  Users,
  MapPin,
  ArrowLeft,
  LayoutDashboard,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SupportTeamManager } from "./SupportTeamManager";
import { DestinationsManager } from "./DestinationsManager";
import { SOSManagement } from "./SOSManagement";
import { RegionsManager } from "./RegionsManager";

type TabType = "overview" | "supporters" | "destinations" | "sos" | "regions";

export const Admin: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview" as TabType, label: "Tổng quan", icon: LayoutDashboard },
    { id: "sos" as TabType, label: "SOS Management", icon: AlertTriangle },
    { id: "supporters" as TabType, label: "Support Team", icon: Users },
    { id: "regions" as TabType, label: "Regions", icon: Globe },
    { id: "destinations" as TabType, label: "Destinations", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-indigo-100 text-sm">Quản lý hệ thống</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 border-b border-white/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 rounded-t-lg"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "sos" && <SOSManagement />}
        {activeTab === "supporters" && <SupportTeamManager />}
        {activeTab === "regions" && <RegionsManager />}
        {activeTab === "destinations" && <DestinationsManager />}
      </div>
    </div>
  );
};

const OverviewTab: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Support Team</p>
            <p className="text-2xl font-bold text-gray-900">Quản lý</p>
          </div>
        </div>
        <p className="mt-4 text-gray-600 text-sm">
          Thêm, sửa, xóa thành viên trong đội hỗ trợ SOS
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Regions</p>
            <p className="text-2xl font-bold text-gray-900">Quản lý</p>
          </div>
        </div>
        <p className="mt-4 text-gray-600 text-sm">
          Thêm, sửa, xóa các khu vực/địa điểm
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Destinations</p>
            <p className="text-2xl font-bold text-gray-900">Quản lý</p>
          </div>
        </div>
        <p className="mt-4 text-gray-600 text-sm">
          Thêm, sửa, xóa các điểm đến du lịch
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">SOS Management</p>
            <p className="text-2xl font-bold text-gray-900">Monitor</p>
          </div>
        </div>
        <p className="mt-4 text-gray-600 text-sm">
          Monitor and manage SOS emergency requests from travelers
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Admin</p>
            <p className="text-2xl font-bold text-gray-900">Panel</p>
          </div>
        </div>
        <p className="mt-4 text-gray-600 text-sm">
          Quản lý toàn bộ hệ thống TourismTogether
        </p>
      </div>
    </div>
  );
};
