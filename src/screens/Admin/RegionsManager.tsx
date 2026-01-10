"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  X,
  Save,
  Search,
  RefreshCw,
} from "lucide-react";
import { API_ENDPOINTS } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";

interface Region {
  id: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export const RegionsManager: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState({
    address: "",
  });

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.REGIONS.BASE, {
        credentials: "include",
      });
      const result = await res.json();
      if (result.status === 200) {
        setRegions(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRegion(null);
    setFormData({
      address: "",
    });
    setShowModal(true);
  };

  const handleEdit = (region: Region) => {
    setEditingRegion(region);
    setFormData({
      address: region.address || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa region này?")) return;

    try {
      const res = await fetch(API_ENDPOINTS.REGIONS.DELETE(String(id)), {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      
      if (res.ok && result.status === 200) {
        fetchRegions();
      } else {
        // Display error message from backend
        alert(result.message || "Không thể xóa region. Vui lòng thử lại.");
      }
    } catch (error) {
      alert("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const regionData = {
        address: formData.address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let response: Response;
      if (editingRegion) {
        // Update
        response = await fetch(API_ENDPOINTS.REGIONS.UPDATE(String(editingRegion.id)), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(regionData),
        });
      } else {
        // Create
        response = await fetch(API_ENDPOINTS.REGIONS.CREATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(regionData),
        });
      }

      const result = await response.json();

      if (result.status === 200) {
        setShowModal(false);
        fetchRegions();
      } else {
        alert(result.message || "Failed to save region. Please try again.");
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className={`w-8 h-8 animate-spin ${COLORS.TEXT.PRIMARY}`} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT}`}>Regions</h2>
          <p className={`${COLORS.TEXT.MUTED} text-sm`}>Quản lý các khu vực/địa điểm</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRegions}
            className={`p-2 ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleCreate}
            className={`flex items-center gap-2 ${GRADIENTS.PRIMARY} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}
          >
            <Plus className="w-4 h-4" />
            Thêm Region
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={`relative mb-6 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl p-4`}>
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${COLORS.TEXT.MUTED}`} />
        <input
          type="text"
          placeholder="Tìm kiếm theo địa chỉ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
        />
      </div>

      {/* Table */}
      <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${COLORS.BACKGROUND.MUTED} border-b ${COLORS.BORDER.DEFAULT}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${COLORS.TEXT.MUTED} uppercase tracking-wider`}>
                  Địa chỉ
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${COLORS.TEXT.MUTED} uppercase tracking-wider`}>
                  Ngày tạo
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${COLORS.TEXT.MUTED} uppercase tracking-wider`}>
                  Ngày cập nhật
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium ${COLORS.TEXT.MUTED} uppercase tracking-wider`}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className={`${COLORS.BACKGROUND.CARD} divide-y ${COLORS.BORDER.DEFAULT}`}>
              {filteredRegions.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`px-6 py-12 text-center ${COLORS.TEXT.MUTED}`}>
                    Chưa có region nào
                  </td>
                </tr>
              ) : (
                filteredRegions.map((region) => (
                  <tr key={region.id} className={`hover:${COLORS.BACKGROUND.MUTED}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className={`w-5 h-5 ${COLORS.TEXT.PRIMARY} mr-2`} />
                        <span className={`text-sm font-medium ${COLORS.TEXT.DEFAULT}`}>
                          {region.address}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.TEXT.MUTED}`}>
                      {new Date(region.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.TEXT.MUTED}`}>
                      {new Date(region.updated_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(region)}
                          className={`p-2 ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.PRIMARY} hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(region.id)}
                          className={`p-2 ${COLORS.TEXT.MUTED} hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-2xl w-full max-w-md`}>
            <div className={`flex items-center justify-between p-4 border-b ${COLORS.BORDER.DEFAULT}`}>
              <h3 className={`text-lg font-semibold ${COLORS.TEXT.DEFAULT}`}>
                {editingRegion ? "Chỉnh sửa Region" : "Thêm Region mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                  placeholder="Ví dụ: Ho Chi Minh City, Vietnam"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 ${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 ${GRADIENTS.PRIMARY} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}
                >
                  <Save className="w-4 h-4" />
                  {editingRegion ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

