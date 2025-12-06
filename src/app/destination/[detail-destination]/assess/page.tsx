import React from "react";

// Dữ liệu mẫu (thay thế bằng dữ liệu thực tế của bạn)
const mockData = {
  averageRating: 0.0,
  totalReviews: 0,
  reviewCounts: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
};

// Hàm tiện ích để vẽ ngôi sao
const Star = ({ filled = false, size = "h-5 w-5" }) => (
  <svg
    className={`inline-block align-middle ${size}`}
    fill={filled ? "#ffc107" : "none"}
    viewBox="0 0 24 24"
    stroke={filled ? "#ffc107" : "#9ca3af"} // Màu xám cho ngôi sao chưa được tô
    strokeWidth="2"
  >
    <path
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      fill={filled ? "#ffc107" : "none"}
    />
  </svg>
);

// Component chính
const RatingsReviewsPage = ({ data = mockData }) => {
  // Lấy dữ liệu rating count và tính phần trăm
  const totalReviews = data.totalReviews;
  const getPercentage = (count: any) => {
    if (totalReviews === 0) return "0%";
    return `${Math.round((count / totalReviews) * 100)}%`;
  };

  return (
    <div className="p-6 md:p-10 bg-white min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ratings & Reviews
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Share your experience with locations, routes, and services.
          </p>
        </div>
        <button className="flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Plan new trip
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-3">
        <div className="flex-grow flex items-center border border-gray-300 rounded-lg overflow-hidden w-full md:max-w-xl">
          <svg
            className="w-5 h-5 text-gray-500 ml-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search destinations"
            className="py-2 px-3 flex-grow focus:outline-none"
          />
          <button className="p-3 text-gray-500 border-l border-gray-300 hover:bg-gray-50">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 text-sm">
            Routes
          </button>
          <button className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 text-sm">
            Services
          </button>
        </div>
      </div>

      {/* RATING SUMMARY BLOCK */}
      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* CỘT TRÁI: ĐIỂM SỐ VÀ SAO */}
          <div className="flex-shrink-0 text-center md:text-left">
            <div className="text-7xl font-light text-gray-900 leading-none">
              {data.averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center md:justify-start my-2">
              {/* 5 sao rỗng */}
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size="h-8 w-8" />
              ))}
            </div>
            <p className="text-gray-500 text-sm">
              {data.totalReviews} đánh giá
            </p>
          </div>

          {/* CỘT PHẢI: CHI TIẾT SAO & PHẦN TRĂM */}
          <div className="flex-grow space-y-1">
            {Object.entries(data.reviewCounts)
              .sort(([a], [b]) => b - a) // Sắp xếp từ 5 sao -> 1 sao
              .map(([rating, count]) => (
                <div key={rating} className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 w-8">
                    {rating}
                  </span>
                  <Star filled={true} size="h-4 w-4" />{" "}
                  {/* Ngôi sao màu vàng */}
                  <div className="mx-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-400 h-2.5 rounded-full"
                      style={{ width: getPercentage(count) }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">
                    {getPercentage(count)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* REVIEW LIST & SORTING */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Tất cả đánh giá ({data.totalReviews})
        </h2>
        <div className="relative">
          <select className="appearance-none border border-gray-300 bg-white text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
            <option>Mới nhất</option>
            <option>Đánh giá cao nhất</option>
            <option>Đánh giá thấp nhất</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {data.totalReviews === 0 && (
        <div className="text-center py-10 text-gray-500 text-lg">
          Chưa có đánh giá nào
        </div>
      )}

      {/* REVIEW LIST (Ở đây là nơi bạn sẽ map qua các đánh giá thực tế) */}
      {/* {data.reviews.map(review => <ReviewItem key={review.id} review={review} />)} */}
    </div>
  );
};

export default RatingsReviewsPage;
