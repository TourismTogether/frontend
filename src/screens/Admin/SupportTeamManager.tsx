'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  User,
  Phone,
  CheckCircle,
  XCircle,
  X,
  Save,
  Search,
  RefreshCw
} from 'lucide-react';

import { API_ENDPOINTS } from "../../constants/api";
import { COLORS, GRADIENTS } from "../../constants/colors";

interface Supporter {
  user_id: string;
  is_available: boolean;
  user?: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url: string;
  };
}

interface User {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string;
}

export const SupportTeamManager: React.FC = () => {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupporter, setEditingSupporter] = useState<Supporter | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    is_available: true
  });

  useEffect(() => {
    fetchSupporters();
    fetchUsers();
  }, []);

  const fetchSupporters = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.SUPPORTERS.BASE, {
        credentials: 'include'
      });
      const result = await res.json();
      if (result.status === 200) {
        // Fetch user details for each supporter
        const supportersWithUsers = await Promise.all(
          result.data.map(async (supporter: Supporter) => {
            try {
              const userRes = await fetch(API_ENDPOINTS.USERS.BY_ID(String(supporter.user_id)), {
                credentials: 'include'
              });
              const userResult = await userRes.json();
              return {
                ...supporter,
                user: userResult.data
              };
            } catch {
              return supporter;
            }
          })
        );
        setSupporters(supportersWithUsers);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.USERS.BASE, {
        credentials: 'include'
      });
      const result = await res.json();
      if (result.status === 200) {
        setUsers(result.data);
      }
    } catch {
      // Handle error silently
    }
  };

  const handleCreate = () => {
    setEditingSupporter(null);
    setFormData({ user_id: '', is_available: true });
    setShowModal(true);
  };

  const handleEdit = (supporter: Supporter) => {
    setEditingSupporter(supporter);
    setFormData({
      user_id: supporter.user_id,
      is_available: supporter.is_available
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa supporter này?')) return;

    try {
      const res = await fetch(API_ENDPOINTS.SUPPORTERS.DELETE(String(userId)), {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchSupporters();
      }
    } catch {
      // Handle error silently
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupporter) {
        // Update
        await fetch(API_ENDPOINTS.SUPPORTERS.UPDATE(String(editingSupporter.user_id)), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ is_available: formData.is_available })
        });
      } else {
        // Create
        await fetch(API_ENDPOINTS.SUPPORTERS.CREATE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchSupporters();
    } catch {
      // Handle error silently
    }
  };

  const toggleAvailability = async (supporter: Supporter) => {
    try {
      await fetch(API_ENDPOINTS.SUPPORTERS.UPDATE(String(supporter.user_id)), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_available: !supporter.is_available })
      });
      fetchSupporters();
    } catch {
      // Handle error silently
    }
  };

  const filteredSupporters = supporters.filter(s => 
    s.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user?.phone?.includes(searchTerm)
  );

  const availableUsers = users.filter(u => 
    !supporters.some(s => s.user_id === u.id)
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
          <h2 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT}`}>Support Team</h2>
          <p className={`${COLORS.TEXT.MUTED} text-sm`}>Quản lý đội hỗ trợ SOS</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSupporters}
            className={`p-2 ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.DEFAULT} hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleCreate}
            className={`flex items-center gap-2 ${GRADIENTS.PRIMARY} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}
          >
            <Plus className="w-4 h-4" />
            Thêm Supporter
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={`relative mb-6 ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl p-4`}>
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${COLORS.TEXT.MUTED}`} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
        />
      </div>

      {/* Table */}
      <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg overflow-hidden`}>
        <table className="w-full">
          <thead className={`${COLORS.BACKGROUND.MUTED} border-b ${COLORS.BORDER.DEFAULT}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium ${COLORS.TEXT.MUTED} uppercase tracking-wider`}>
                Supporter
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${COLORS.TEXT.MUTED} uppercase tracking-wider`}>
                Số điện thoại
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${COLORS.TEXT.MUTED} uppercase tracking-wider`}>
                Trạng thái
              </th>
              <th className={`px-6 py-3 text-right text-xs font-medium ${COLORS.TEXT.MUTED} uppercase tracking-wider`}>
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${COLORS.BORDER.DEFAULT}`}>
            {filteredSupporters.length === 0 ? (
              <tr>
                <td colSpan={4} className={`px-6 py-12 text-center ${COLORS.TEXT.MUTED}`}>
                  Chưa có supporter nào
                </td>
              </tr>
            ) : (
              filteredSupporters.map((supporter) => (
                <tr key={supporter.user_id} className={`hover:${COLORS.BACKGROUND.MUTED}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${COLORS.PRIMARY.LIGHT} rounded-full flex items-center justify-center`}>
                        {supporter.user?.avatar_url ? (
                          <Image
                            src={supporter.user.avatar_url}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <User className={`w-5 h-5 ${COLORS.TEXT.PRIMARY}`} />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${COLORS.TEXT.DEFAULT}`}>
                          {supporter.user?.full_name || 'Unknown'}
                        </p>
                        <p className={`text-sm ${COLORS.TEXT.MUTED}`}>
                          ID: {supporter.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center ${COLORS.TEXT.MUTED}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      {supporter.user?.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleAvailability(supporter)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        supporter.is_available
                          ? `${COLORS.PRIMARY.LIGHT} ${COLORS.TEXT.PRIMARY}`
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {supporter.is_available ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Online
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Offline
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(supporter)}
                        className={`p-2 ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.PRIMARY} hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supporter.user_id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-2xl w-full max-w-md`}>
            <div className={`flex items-center justify-between p-4 border-b ${COLORS.BORDER.DEFAULT}`}>
              <h3 className={`text-lg font-semibold ${COLORS.TEXT.DEFAULT}`}>
                {editingSupporter ? 'Chỉnh sửa Supporter' : 'Thêm Supporter mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 hover:${COLORS.BACKGROUND.MUTED} rounded-lg transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {!editingSupporter && (
                <div>
                  <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                    Chọn User
                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className={`w-full px-3 py-2 ${COLORS.BORDER.DEFAULT} border rounded-lg focus:ring-2 focus:${COLORS.BORDER.PRIMARY} ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT}`}
                    required
                  >
                    <option value="">-- Chọn user --</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${COLORS.TEXT.DEFAULT} mb-1`}>
                  Trạng thái
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.is_available}
                      onChange={() => setFormData({ ...formData, is_available: true })}
                      className="mr-2"
                    />
                    <span className={COLORS.TEXT.PRIMARY}>Online</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!formData.is_available}
                      onChange={() => setFormData({ ...formData, is_available: false })}
                      className="mr-2"
                    />
                    <span className="text-red-600">Offline</span>
                  </label>
                </div>
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
                  {editingSupporter ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

