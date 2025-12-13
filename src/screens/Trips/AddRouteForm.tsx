import React, { useState } from "react";
import { X, Save, MapPin, Clock } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho state Form
interface RouteFormValues {
  index: number; // Thay thế cho day
  title: string;
  description: string; // Mới
  lngStart: number;
  latStart: number;
  lngEnd: number;
  latEnd: number;
  details: string; // Tạm thời dùng string (multi-line), sau đó split thành string[]
}

// Định nghĩa Props cho Component
interface AddRouteFormProps {
  onClose: () => void;
  onSubmit: (route: {
    index: number; // Đã sửa
    title: string;
    description: string; // Đã thêm
    lngStart: number;
    latStart: number;
    lngEnd: number;
    latEnd: number;
    details: string[];
  }) => void;
  currentMaxIndex: number; // Đã sửa
}

export const AddRouteForm: React.FC<AddRouteFormProps> = ({
  onClose,
  onSubmit,
  currentMaxIndex,
}) => {
  // State khởi tạo giá trị cho form
  const [formData, setFormData] = useState<RouteFormValues>({
    index: currentMaxIndex + 1, // Mặc định là index tiếp theo
    title: "",
    description: "",
    lngStart: 0,
    latStart: 0,
    lngEnd: 0,
    latEnd: 0,
    details: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Chuyển đổi các trường tọa độ và index sang kiểu số
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("lng") || name.includes("lat") || name === "index"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Xử lý trường 'details': tách nội dung textarea thành mảng các hoạt động
    const detailsArray = formData.details
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (!formData.title || !detailsArray.length) {
      alert("Vui lòng nhập Tiêu đề và ít nhất một Hoạt động!");
      return;
    }

    // Gửi dữ liệu đã format qua prop onSubmit
    onSubmit({
      index: formData.index,
      title: formData.title,
      description: formData.description, // Truyền description
      lngStart: formData.lngStart,
      latStart: formData.latStart,
      lngEnd: formData.lngEnd,
      latEnd: formData.latEnd,
      details: detailsArray,
    });
  };

  // Tạo mảng Index cho Select
  const indexOptions = [...Array(currentMaxIndex + 3)].map((_, i) => i + 1);

  return (
    // Khung Modal/Form chính
    <div className="bg-card p-8 rounded-xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
      >
        <X className="w-5 h-5" />
      </button>
      <h2 className="text-2xl font-bold mb-6 text-trip border-b pb-2">
        Thêm Chặng Lịch Trình Mới
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Index (Chặng) */}
        <div>
          <label className="text-sm font-medium flex items-center mb-1">
            <Clock className="w-4 h-4 mr-1 text-traveller" /> Index Chặng:
          </label>
          <select
            name="index"
            value={formData.index}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-input text-foreground"
          >
            {indexOptions.map((indexNumber: number) => (
              <option key={indexNumber} value={indexNumber}>
                Chặng {indexNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Tiêu đề */}
        <div>
          <label htmlFor="title" className="text-sm font-medium mb-1 block">
            Tiêu đề Chặng:
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-input text-foreground"
            placeholder="Ví dụ: Di chuyển từ Đà Lạt về TP.HCM"
            required
          />
        </div>

        {/* Mô tả (Description) */}
        <div>
          <label
            htmlFor="description"
            className="text-sm font-medium mb-1 block"
          >
            Mô tả ngắn:
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full p-2 border rounded-md bg-input text-foreground"
            placeholder="Tóm tắt chặng đường này."
            required
          />
        </div>

        {/* Chi tiết hoạt động */}
        <div>
          <label htmlFor="details" className="text-sm font-medium mb-1 block">
            Hoạt động (Mỗi hoạt động một dòng):
          </label>
          <textarea
            id="details"
            name="details"
            value={formData.details}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border rounded-md bg-input text-foreground"
            placeholder="Ví dụ: \n1. Mua sắm đặc sản\n2. Ăn trưa tại nhà hàng X"
            required
          />
        </div>

        {/* Tọa độ (4 trường) */}
        <fieldset className="border p-4 rounded-md space-y-3">
          <legend className="text-sm font-semibold text-trip px-1 flex items-center">
            <MapPin className="w-4 h-4 mr-1" /> Tọa độ Tuyến đường
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {/* Start Location */}
            <div>
              <label
                htmlFor="latStart"
                className="text-xs block text-muted-foreground"
              >
                Vĩ độ Bắt đầu (Lat)
              </label>
              <input
                type="number"
                step="any"
                name="latStart"
                value={formData.latStart}
                onChange={handleChange}
                className="w-full p-1 border rounded-md bg-input text-foreground text-sm"
                placeholder="Lat Start"
                required
              />
            </div>
            <div>
              <label
                htmlFor="lngStart"
                className="text-xs block text-muted-foreground"
              >
                Kinh độ Bắt đầu (Lng)
              </label>
              <input
                type="number"
                step="any"
                name="lngStart"
                value={formData.lngStart}
                onChange={handleChange}
                className="w-full p-1 border rounded-md bg-input text-foreground text-sm"
                placeholder="Lng Start"
                required
              />
            </div>
            {/* End Location */}
            <div>
              <label
                htmlFor="latEnd"
                className="text-xs block text-muted-foreground"
              >
                Vĩ độ Kết thúc (Lat)
              </label>
              <input
                type="number"
                step="any"
                name="latEnd"
                value={formData.latEnd}
                onChange={handleChange}
                className="w-full p-1 border rounded-md bg-input text-foreground text-sm"
                placeholder="Lat End"
                required
              />
            </div>
            <div>
              <label
                htmlFor="lngEnd"
                className="text-xs block text-muted-foreground"
              >
                Kinh độ Kết thúc (Lng)
              </label>
              <input
                type="number"
                step="any"
                name="lngEnd"
                value={formData.lngEnd}
                onChange={handleChange}
                className="w-full p-1 border rounded-md bg-input text-foreground text-sm"
                placeholder="Lng End"
                required
              />
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full bg-trip text-white p-2 rounded-md hover:bg-trip-dark transition-colors flex items-center justify-center font-bold mt-6"
        >
          <Save className="w-5 h-5 mr-2" /> Lưu Lịch trình
        </button>
      </form>
    </div>
  );
};
