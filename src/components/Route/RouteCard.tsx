// RouteCard.tsx

import React, { useState } from "react";
import {
  Route,
  Navigation,
  PlusCircle,
  DollarSign,
  Trash2,
  X,
  Check,
  AlertCircle,
  Edit,
  Pencil,
} from "lucide-react";
import { ICost, IRoute } from "@/lib/type/interface";

// Hàm tiện ích formatCurrency
const formatCurrencyLocal = (amount: number) => {
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
};

// --- AddCostForm Component ---
interface AddCostFormProps {
  onClose: () => void;
  onSubmit: (
    newCost: Omit<ICost, "id" | "created_at" | "updated_at" | "route_id">
  ) => void;
  initialData?: ICost;
}

const AddCostForm: React.FC<AddCostFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState(initialData?.category || "other");
  const [amount, setAmount] = useState<number>(initialData?.amount || 0);

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "other");
      setAmount(initialData.amount || 0);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || title.trim(), // Use title as fallback if description is empty
      category,
      amount,
      currency: "VND",
    });
    // Reset form after submission
    setTitle("");
    setDescription("");
    setCategory("other");
    setAmount(0);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-100 mt-2">
      <h4 className="text-sm font-bold mb-3 text-trip">
        {initialData ? "Sửa Chi Phí" : "Thêm Chi Phí"}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề (vd: Vé vào cửa, Bữa trưa)"
          required
          className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-trip focus:border-transparent"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả chi tiết (tùy chọn)"
          className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-trip focus:border-transparent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-trip focus:border-transparent"
        >
          <option value="transport">Vận chuyển</option>
          <option value="accommodation">Chỗ ở</option>
          <option value="food">Ăn uống</option>
          <option value="entertainment">Giải trí</option>
          <option value="shopping">Mua sắm</option>
          <option value="other">Khác</option>
        </select>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            required
            min="0"
            step="1000"
            placeholder="Số tiền (VND)"
            className="flex-1 rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-trip focus:border-transparent"
          />
          <button
            type="submit"
            className="flex items-center text-xs px-3 py-2 bg-trip text-white rounded-md hover:bg-trip-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!title.trim() || !amount || amount <= 0}
          >
            <Check className="w-4 h-4 mr-1" />
            <span>{initialData ? "Cập nhật" : "Thêm"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center text-xs px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

// --- RouteCard Component Chính ---
interface RouteCardProps {
  route: IRoute;
  onAddCost: (
    routeId: string,
    newCost: Omit<ICost, "id" | "created_at" | "updated_at" | "route_id">
  ) => void;
  onDeleteCost: (routeId: string, costId: string) => void;
  onDeleteRoute?: (routeId: string) => void;
  onEditRoute?: (route: IRoute) => void;
  onEditCost?: (routeId: string, cost: ICost) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onAddCost,
  onDeleteCost,
  onDeleteRoute,
  onEditRoute,
  onEditCost,
}) => {
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const totalRouteCost = route.costs.reduce(
    (sum, cost) => sum + cost.amount,
    0
  );

  const handleAddCostSubmit = (
    newCost: Omit<ICost, "id" | "created_at" | "updated_at" | "route_id">
  ) => {
    if (route.id) {
      onAddCost(route.id, newCost);
    }
    setIsAddingCost(false);
  };

  const handleDeleteClick = () => {
    if (!route.id) return;
    
    if (showDeleteConfirm) {
      // Confirm deletion
      if (onDeleteRoute) {
        onDeleteRoute(route.id);
      }
      setShowDeleteConfirm(false);
    } else {
      // Show confirmation
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="bg-card p-5 rounded-xl shadow-md border border-border transition-shadow hover:shadow-lg relative">
      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-red-50 border-2 border-red-300 rounded-xl flex items-center justify-center z-20 backdrop-blur-sm">
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-900 mb-1">
              Delete this route?
            </p>
            <p className="text-xs text-red-700 mb-3">
              This will also delete all associated costs.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleDeleteClick}
                className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header và Title */}
      <div className="flex justify-between items-start mb-2 border-b pb-2 border-dashed">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground">
            <Route className="inline w-5 h-5 mr-2 text-traveller" />
            {route.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-trip/10 text-trip">
            Stop {(route.index ?? 0) + 1}
          </span>
          {onEditRoute && route.id && (
            <button
              onClick={() => onEditRoute(route)}
              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit route"
              aria-label="Edit route"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDeleteRoute && route.id && (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete route"
              aria-label="Delete route"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{route.description}</p>

      {/* Tọa độ */}
      <div className="text-sm text-muted-foreground mb-3 p-3 bg-muted rounded-md border border-border">
        <h4 className="font-semibold text-foreground mb-1 flex items-center">
          <Navigation className="w-4 h-4 mr-1" /> Tọa độ:
        </h4>
        <p>
          Bắt đầu: Lat: {route.latStart}, Lng: {route.lngStart}
        </p>
        <p>
          Kết thúc: Lat: {route.latEnd}, Lng: {route.lngEnd}
        </p>
      </div>

      {/* Hoạt động */}
      <h4 className="font-semibold text-sm text-foreground/80 mb-1">
        Hoạt động:
      </h4>
      <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 ml-4 mb-4">
        {route.details.map((detail: string, i: number) => (
          <li key={i}>{detail}</li>
        ))}
      </ul>

      {/* Chi phí (Cost Management) */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-base text-foreground flex items-center">
            <DollarSign className="w-4 h-4 mr-1 text-red-500" /> Tổng Chi phí
            Chặng:{" "}
            <span className="ml-2 text-red-600">
              {formatCurrencyLocal(totalRouteCost)}
            </span>
          </h4>
          <button
            onClick={() => setIsAddingCost(!isAddingCost)}
            className="flex items-center text-xs text-red-500 hover:text-red-700 transition-colors font-medium border border-red-500 rounded-full px-2 py-1"
          >
            <PlusCircle className="w-3 h-3 mr-1" />{" "}
            {isAddingCost ? "Đóng" : "Thêm Cost"}
          </button>
        </div>

        {(isAddingCost || editingCostId) && (
          <div className="mb-4">
            <AddCostForm
              onClose={() => {
                setIsAddingCost(false);
                setEditingCostId(null);
              }}
              onSubmit={(newCost) => {
                if (editingCostId && onEditCost && route.id) {
                  // Edit existing cost
                  const existingCost = route.costs.find(c => c.id === editingCostId);
                  if (existingCost) {
                    onEditCost(route.id, {
                      ...existingCost,
                      ...newCost,
                    });
                  }
                  setEditingCostId(null);
                } else if (route.id) {
                  // Add new cost
                  onAddCost(route.id, newCost);
                  setIsAddingCost(false);
                }
              }}
              initialData={
                editingCostId
                  ? route.costs.find((c) => c.id === editingCostId) || undefined
                  : undefined
              }
            />
          </div>
        )}

        {/* Danh sách Cost */}
        <div className="space-y-2">
          {route.costs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic p-2 bg-gray-50 rounded-md">
              Chưa có chi phí nào được ghi nhận cho chặng này.
            </p>
          ) : (
            <div className="text-xs border rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 font-semibold bg-gray-100 p-2 text-foreground/80 border-b">
                <span className="col-span-2">Mô tả</span>
                <span className="text-right">Số tiền</span>
                <span className="text-center">Sửa</span>
                <span className="text-center">Xóa</span>
              </div>
              {route.costs.map((cost) => (
                <div
                  key={cost.id}
                  className="grid grid-cols-5 items-center p-2 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <span className="col-span-2 truncate">
                    {cost.description}
                  </span>
                  <span className="text-right font-medium text-destructive">
                    {formatCurrencyLocal(cost.amount)}
                  </span>
                  <div className="flex justify-center">
                    {onEditCost && cost.id && (
                      <button
                        onClick={() => {
                          setEditingCostId(cost.id || null);
                          setIsAddingCost(false);
                        }}
                        className="text-blue-400 hover:text-blue-600 transition-colors"
                        aria-label={`Sửa chi phí ${cost.description}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        cost.id && route.id && onDeleteCost(route.id, cost.id)
                      }
                      className="text-red-400 hover:text-red-600 transition-colors"
                      aria-label={`Xóa chi phí ${cost.description}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
