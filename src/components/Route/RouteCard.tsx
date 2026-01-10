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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ICost, IRoute } from "@/lib/type/interface";
import { COLORS } from "@/constants/colors";

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
    <div className={`${COLORS.BACKGROUND.CARD} p-4 rounded-lg shadow-inner ${COLORS.BORDER.DEFAULT} border mt-2 transition-colors duration-200`}>
      <h4 className={`text-sm font-bold mb-3 ${COLORS.TEXT.PRIMARY} transition-colors duration-200`}>
        {initialData ? "Sửa Chi Phí" : "Thêm Chi Phí"}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề (vd: Vé vào cửa, Bữa trưa)"
          required
          className={`w-full rounded-md ${COLORS.BORDER.DEFAULT} border ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT} p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors duration-200`}
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả chi tiết (tùy chọn)"
          className={`w-full rounded-md ${COLORS.BORDER.DEFAULT} border ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT} p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors duration-200`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`w-full rounded-md ${COLORS.BORDER.DEFAULT} border ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT} p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors duration-200`}
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
            className={`flex-1 rounded-md ${COLORS.BORDER.DEFAULT} border ${COLORS.BACKGROUND.DEFAULT} ${COLORS.TEXT.DEFAULT} p-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors duration-200`}
          />
          <button
            type="submit"
            className={`flex items-center text-xs px-3 py-2 ${COLORS.PRIMARY.DEFAULT} text-white rounded-md ${COLORS.PRIMARY.HOVER} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!title.trim() || !amount || amount <= 0}
          >
            <Check className="w-4 h-4 mr-1" />
            <span>{initialData ? "Cập nhật" : "Thêm"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`flex items-center text-xs px-3 py-2 ${COLORS.BORDER.DEFAULT} border ${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} rounded-md ${COLORS.BACKGROUND.MUTED_HOVER_OPACITY} transition-colors duration-200`}
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
  const [isCardOpen, setIsCardOpen] = useState(false); // Default is closed
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
    <div className={`${COLORS.BACKGROUND.CARD} p-5 rounded-xl shadow-md ${COLORS.BORDER.DEFAULT} border transition-all hover:shadow-lg relative duration-200`}>
      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className={`absolute inset-0 ${COLORS.BACKGROUND.DESTRUCTIVE}/10 border-2 ${COLORS.BORDER.DESTRUCTIVE} rounded-xl flex items-center justify-center z-20 backdrop-blur-sm transition-colors duration-200`}>
          <div className="text-center p-4">
            <AlertCircle className={`h-8 w-8 ${COLORS.TEXT.DESTRUCTIVE} mx-auto mb-2 transition-colors duration-200`} />
            <p className={`text-sm font-semibold ${COLORS.TEXT.DESTRUCTIVE} mb-1 transition-colors duration-200`}>
              Delete this route?
            </p>
            <p className={`text-xs ${COLORS.TEXT.DESTRUCTIVE}/80 mb-3 transition-colors duration-200`}>
              This will also delete all associated costs.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleDeleteClick}
                className={`px-4 py-1.5 ${COLORS.BACKGROUND.DESTRUCTIVE} text-white text-xs font-semibold rounded-lg ${COLORS.BACKGROUND.DESTRUCTIVE}/90 hover:opacity-90 transition-colors duration-200`}
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-1.5 ${COLORS.BACKGROUND.MUTED} ${COLORS.TEXT.DEFAULT} text-xs font-semibold rounded-lg ${COLORS.BACKGROUND.MUTED_HOVER_OPACITY} transition-colors duration-200`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header và Title */}
      <div className={`flex justify-between items-start mb-2 ${COLORS.BORDER.DEFAULT} border-b pb-2 border-dashed transition-colors duration-200`}>
        <div className="flex-1 flex items-center gap-2">
          <button
            onClick={() => setIsCardOpen(!isCardOpen)}
            className={`p-1 ${COLORS.BACKGROUND.MUTED_HOVER} rounded transition-colors duration-200`}
            title={isCardOpen ? "Thu gọn" : "Mở rộng"}
            aria-label={isCardOpen ? "Thu gọn" : "Mở rộng"}
          >
            {isCardOpen ? (
              <ChevronUp className={`w-4 h-4 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${COLORS.TEXT.MUTED} transition-colors duration-200`} />
            )}
          </button>
          <h3 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
            <Route className={`inline w-5 h-5 mr-2 ${COLORS.ENTITY.TRAVELLER}`} />
            {route.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLORS.ENTITY.TRIP}/10 ${COLORS.ENTITY.TRIP} transition-colors duration-200`}>
            Stop {(route.index ?? 0) + 1}
          </span>
          {onEditRoute && route.id && (
            <button
              onClick={() => onEditRoute(route)}
              className={`p-1.5 ${COLORS.TEXT.PRIMARY} ${COLORS.TEXT.PRIMARY_HOVER} ${COLORS.BACKGROUND.MUTED_HOVER} rounded-lg transition-colors duration-200`}
              title="Edit route"
              aria-label="Edit route"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDeleteRoute && route.id && (
            <button
              onClick={handleDeleteClick}
              className={`p-1.5 ${COLORS.TEXT.DESTRUCTIVE} ${COLORS.DESTRUCTIVE.TEXT_HOVER} ${COLORS.DESTRUCTIVE.BACKGROUND_HOVER} rounded-lg transition-colors duration-200`}
              title="Delete route"
              aria-label="Delete route"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      {isCardOpen && (
        <>
          <p className={`text-sm ${COLORS.TEXT.MUTED} mb-3 transition-colors duration-200`}>{route.description}</p>

          {/* Tọa độ */}
          <div className={`text-sm ${COLORS.TEXT.MUTED} mb-3 p-3 ${COLORS.BACKGROUND.MUTED} rounded-md ${COLORS.BORDER.DEFAULT} border transition-colors duration-200`}>
            <h4 className={`font-semibold ${COLORS.TEXT.DEFAULT} mb-1 flex items-center transition-colors duration-200`}>
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
          <h4 className={`font-semibold text-sm ${COLORS.TEXT.MUTED} mb-1 transition-colors duration-200`}>
            Hoạt động:
          </h4>
          <ul className={`list-disc list-inside ${COLORS.TEXT.MUTED} text-sm space-y-1 ml-4 mb-4 transition-colors duration-200`}>
            {route.details.map((detail: string, i: number) => (
              <li key={i}>{detail}</li>
            ))}
          </ul>

          {/* Chi phí (Cost Management) */}
          <div className={`${COLORS.BORDER.DEFAULT} border-t pt-4 mt-4 transition-colors duration-200`}>
        <div className="flex justify-between items-center mb-3">
          <h4 className={`font-bold text-base ${COLORS.TEXT.DEFAULT} flex items-center transition-colors duration-200`}>
            <DollarSign className={`w-4 h-4 mr-1 ${COLORS.DESTRUCTIVE.TEXT} transition-colors duration-200`} /> Tổng Chi phí
            Chặng:{" "}
            <span className={`ml-2 ${COLORS.DESTRUCTIVE.TEXT} transition-colors duration-200`}>
              {formatCurrencyLocal(totalRouteCost)}
            </span>
          </h4>
          <button
            onClick={() => setIsAddingCost(!isAddingCost)}
            className={`flex items-center text-xs ${COLORS.DESTRUCTIVE.TEXT} ${COLORS.DESTRUCTIVE.TEXT_HOVER} transition-colors font-medium ${COLORS.DESTRUCTIVE.BORDER} border rounded-full px-2 py-1 transition-colors duration-200`}
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
            <p className={`text-xs ${COLORS.TEXT.MUTED} italic p-2 ${COLORS.BACKGROUND.MUTED} rounded-md transition-colors duration-200`}>
              Chưa có chi phí nào được ghi nhận cho chặng này.
            </p>
          ) : (
            <div className={`text-xs ${COLORS.BORDER.DEFAULT} border rounded-lg overflow-hidden transition-colors duration-200`}>
              <div className={`grid grid-cols-5 font-semibold ${COLORS.BACKGROUND.MUTED} p-2 ${COLORS.TEXT.MUTED} ${COLORS.BORDER.DEFAULT} border-b transition-colors duration-200`}>
                <span className="col-span-2">Mô tả</span>
                <span className="text-right">Số tiền</span>
                <span className="text-center">Sửa</span>
                <span className="text-center">Xóa</span>
              </div>
              {route.costs.map((cost) => (
                <div
                  key={cost.id}
                  className={`grid grid-cols-5 items-center p-2 hover:${COLORS.BACKGROUND.MUTED} ${COLORS.BORDER.DEFAULT} border-b last:border-b-0 transition-colors duration-200`}
                >
                  <span className={`col-span-2 truncate ${COLORS.TEXT.DEFAULT} transition-colors duration-200`}>
                    {cost.description}
                  </span>
                  <span className={`text-right font-medium ${COLORS.TEXT.DESTRUCTIVE} transition-colors duration-200`}>
                    {formatCurrencyLocal(cost.amount)}
                  </span>
                  <div className="flex justify-center">
                    {onEditCost && cost.id && (
                      <button
                        onClick={() => {
                          setEditingCostId(cost.id || null);
                          setIsAddingCost(false);
                        }}
                        className={`${COLORS.TEXT.PRIMARY} ${COLORS.TEXT.PRIMARY_HOVER} transition-colors duration-200`}
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
                      className={`${COLORS.TEXT.DESTRUCTIVE} ${COLORS.DESTRUCTIVE.TEXT_HOVER} transition-colors duration-200`}
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
        </>
      )}
    </div>
  );
};
