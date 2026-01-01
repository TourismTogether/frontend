import React, { useState } from "react";
import { X, Save, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import LocationPicker to avoid SSR issues
const LocationPicker = dynamic(
  () => import("@/components/Map/LocationPicker").then((mod) => ({ default: mod.LocationPicker })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center" style={{ height: '250px' }}>
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    ),
  }
);

// Định nghĩa kiểu dữ liệu cho state Form
interface RouteFormValues {
  title: string;
  description: string;
  lngStart: number;
  latStart: number;
  lngEnd: number;
  latEnd: number;
  details: string; // Tạm thời dùng string (multi-line)
}

// Định nghĩa Props cho Component (ĐÃ SỬA: Loại bỏ index và currentMaxIndex)
interface AddRouteFormProps {
  onClose: () => void;
  // onSubmit chỉ gửi dữ liệu cơ bản, KHÔNG GỬI INDEX (để component cha tự tính)
  onSubmit: (route: {
    title: string;
    description: string;
    lngStart: number;
    latStart: number;
    lngEnd: number;
    latEnd: number;
    details: string[];
  }) => void;
  // Bỏ currentMaxIndex vì nó được tính ở component cha
  // Default start coordinates from previous route's end
  defaultStartLat?: number;
  defaultStartLng?: number;
}

export const AddRouteForm: React.FC<AddRouteFormProps> = ({
  onClose,
  onSubmit,
  defaultStartLat,
  defaultStartLng,
  // Bỏ currentMaxIndex
}) => {
  // State khởi tạo giá trị cho form (ĐÃ SỬA: Bỏ index)
  // Use default start coordinates from previous route if provided
  const [formData, setFormData] = useState<RouteFormValues>({
    title: "",
    description: "",
    lngStart: defaultStartLng || 0,
    latStart: defaultStartLat || 0,
    lngEnd: 0,
    latEnd: 0,
    details: "",
  });

  // Update form data when default coordinates change
  React.useEffect(() => {
    if (defaultStartLat && defaultStartLng) {
      setFormData(prev => ({
        ...prev,
        latStart: defaultStartLat,
        lngStart: defaultStartLng,
      }));
    }
  }, [defaultStartLat, defaultStartLng]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Chuyển đổi các trường tọa độ sang kiểu số (ĐÃ SỬA: Bỏ kiểm tra name === "index")
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("lng") || name.includes("lat") ? Number(value) : value,
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

    // Gửi dữ liệu đã format qua prop onSubmit (ĐÃ SỬA: Bỏ index)
    onSubmit({
      title: formData.title,
      description: formData.description,
      lngStart: formData.lngStart,
      latStart: formData.latStart,
      lngEnd: formData.lngEnd,
      latEnd: formData.latEnd,
      details: detailsArray,
    });
  };

  return (
    // Khung Modal/Form chính
    <div className="bg-card p-8 rounded-xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
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
        {/* Index (Chặng) - ĐÃ BỎ SELECT VÌ INDEX ĐƯỢC TÍNH Ở COMPONENT CHA */}
        <div className="p-2 border border-dashed rounded-md bg-gray-50 text-sm text-gray-600">
          *Lưu ý: Số chặng sẽ được tự động tính toán tiếp theo.
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

        {/* Tọa độ với Map Picker */}
        <fieldset className="border p-4 rounded-md space-y-3">
          <legend className="text-sm font-semibold text-trip px-1 flex items-center">
            <MapPin className="w-4 h-4 mr-1" /> Tọa độ Tuyến đường
          </legend>
          
          {/* Start Location Picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Điểm Bắt đầu - Click trên bản đồ để chọn
            </label>
            {defaultStartLat && defaultStartLng && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
                <span className="font-semibold">ℹ️ Tự động:</span> Điểm bắt đầu được đặt tại điểm kết thúc của chặng trước đó. Bạn có thể thay đổi bằng cách click trên bản đồ.
              </div>
            )}
            <LocationPicker
              onLocationSelect={(lat, lng) => {
                setFormData(prev => ({ ...prev, latStart: lat, lngStart: lng }));
              }}
              initialLat={formData.latStart || defaultStartLat || 10.7769}
              initialLng={formData.lngStart || defaultStartLng || 106.7009}
              height="250px"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                type="number"
                step="any"
                name="latStart"
                value={formData.latStart}
                onChange={handleChange}
                className="w-full p-1 border rounded-md bg-input text-foreground text-xs"
                placeholder="Lat Start"
                required
              />
              <input
                type="number"
                step="any"
                name="lngStart"
                value={formData.lngStart}
                onChange={handleChange}
                className="w-full p-1 border rounded-md bg-input text-foreground text-xs"
                placeholder="Lng Start"
                required
              />
            </div>
          </div>

          {/* End Location Picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Điểm Kết thúc - Click trên bản đồ để chọn
            </label>
            <LocationPicker
              onLocationSelect={(lat, lng) => {
                setFormData(prev => ({ ...prev, latEnd: lat, lngEnd: lng }));
              }}
              initialLat={formData.latEnd || 10.7769}
              initialLng={formData.lngEnd || 106.7009}
              height="250px"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                type="number"
                step="any"
                name="latEnd"
                value={formData.latEnd}
                onChange={handleChange}
                className="w-full p-1 border rounded-md bg-input text-foreground text-xs"
                placeholder="Lat End"
                required
              />
              <input
                type="number"
                step="any"
                name="lngEnd"
                value={formData.lngEnd}
                onChange={handleChange}
                className="w-full p-1 border rounded-md bg-input text-foreground text-xs"
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
