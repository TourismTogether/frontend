// AI Route Planner Service
// Uses AI to generate a complete itinerary for a trip

import { IRoute } from "@/lib/type/interface";
import { IDestination } from "@/screens/Trips/Trips";

export interface AIGeneratedRoute {
  route: IRoute;
  reasoning?: string;
}

export interface TripContext {
  destination: IDestination;
  startDate: string;
  endDate: string;
  budget?: number;
  difficulty?: number;
  existingRoutes?: IRoute[];
  preferences?: string;
}

/**
 * Generate a complete itinerary using AI
 * This function creates a full-day or multi-day itinerary based on trip context
 */
export async function generateAIItinerary(
  API_URL: string,
  context: TripContext
): Promise<AIGeneratedRoute[]> {
  try {
    // Call backend AI endpoint (if available) or use OpenAI directly
    const response = await fetch(`${API_URL}/ai/generate-itinerary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination: {
          name: context.destination.name,
          latitude: context.destination.latitude,
          longitude: context.destination.longitude,
          description: context.destination.description,
          category: context.destination.category,
          country: context.destination.country,
        },
        startDate: context.startDate,
        endDate: context.endDate,
        budget: context.budget,
        difficulty: context.difficulty,
        preferences: context.preferences,
        existingRoutes: context.existingRoutes || [],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.data || result.routes || [];
    }

    // Fallback: Generate itinerary using local AI logic if backend is not available
    return generateLocalItinerary(context);
  } catch (error) {
    console.warn("AI API not available, using local generation:", error);
    return generateLocalItinerary(context);
  }
}

/**
 * Local itinerary generation as fallback
 * Creates a reasonable itinerary based on destination and time
 */
function generateLocalItinerary(
  context: TripContext
): AIGeneratedRoute[] {
  const { destination, startDate, endDate, budget, difficulty } = context;
  
  // Calculate number of days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const routes: AIGeneratedRoute[] = [];
  const baseLat = destination.latitude;
  const baseLng = destination.longitude;

  // Activity templates based on destination category
  const getActivitiesByCategory = (category: string, timeOfDay: "morning" | "afternoon" | "evening") => {
    const activities: Record<string, Record<string, string[]>> = {
      "beach": {
        morning: ["Tắm biển", "Chụp ảnh bình minh", "Thưởng thức hải sản tươi sống"],
        afternoon: ["Tham gia hoạt động thể thao nước", "Nghỉ ngơi trên bãi biển", "Tham quan làng chài"],
        evening: ["Ngắm hoàng hôn", "Thưởng thức bữa tối hải sản", "Đi dạo bờ biển"],
      },
      "mountain": {
        morning: ["Leo núi/Đi bộ đường dài", "Ngắm cảnh quan", "Thưởng thức không khí trong lành"],
        afternoon: ["Tham quan đền chùa", "Chụp ảnh phong cảnh", "Thưởng thức đặc sản địa phương"],
        evening: ["Nghỉ ngơi tại resort", "Thưởng thức bữa tối", "Ngắm sao trời"],
      },
      "city": {
        morning: ["Tham quan bảo tàng", "Đi dạo phố cổ", "Thưởng thức cà phê địa phương"],
        afternoon: ["Mua sắm", "Tham quan công trình kiến trúc", "Thưởng thức ẩm thực đường phố"],
        evening: ["Tham quan khu vui chơi giải trí", "Thưởng thức bữa tối", "Đi dạo phố đi bộ"],
      },
      "cultural": {
        morning: ["Tham quan di tích lịch sử", "Tìm hiểu văn hóa địa phương", "Chụp ảnh kiến trúc"],
        afternoon: ["Tham quan bảo tàng", "Xem biểu diễn văn hóa", "Mua sắm đồ lưu niệm"],
        evening: ["Thưởng thức ẩm thực truyền thống", "Xem show văn hóa", "Đi dạo khu phố cổ"],
      },
    };

    const defaultActivities = {
      morning: ["Tham quan điểm nổi tiếng", "Chụp ảnh check-in", "Thưởng thức bữa sáng địa phương"],
      afternoon: ["Tham quan điểm tham quan khác", "Mua sắm đặc sản", "Thưởng thức bữa trưa"],
      evening: ["Thưởng thức bữa tối", "Tham gia hoạt động giải trí", "Nghỉ ngơi"],
    };

    return activities[category]?.[timeOfDay] || defaultActivities[timeOfDay] || defaultActivities.morning;
  };

  const category = destination.category?.toLowerCase() || "city";

  // Generate routes for each day
  for (let day = 0; day < days; day++) {
    // Morning route - start from destination center
    const morningStartLat = baseLat;
    const morningStartLng = baseLng;
    const morningEndLat = baseLat + (Math.random() - 0.3) * 0.02;
    const morningEndLng = baseLng + (Math.random() - 0.3) * 0.02;

    routes.push({
      route: {
        index: day * 2,
        trip_id: "",
        title: `Ngày ${day + 1} - Buổi sáng`,
        description: `Khám phá ${destination.name} vào buổi sáng. ${day === 0 ? "Bắt đầu hành trình với" : "Tiếp tục"} các hoạt động tham quan và thưởng thức ẩm thực địa phương.`,
        latStart: day === 0 ? baseLat : (routes[routes.length - 1]?.route.latEnd || baseLat),
        lngStart: day === 0 ? baseLng : (routes[routes.length - 1]?.route.lngEnd || baseLng),
        latEnd: morningEndLat,
        lngEnd: morningEndLng,
        details: getActivitiesByCategory(category, "morning"),
        costs: [],
        created_at: new Date(),
        updated_at: new Date(),
      },
      reasoning: `Lộ trình buổi sáng cho ngày ${day + 1}, tối ưu để bắt đầu ngày mới với năng lượng dồi dào và khám phá ${destination.name}.`,
    });

    // Afternoon/Evening route
    const eveningEndLat = baseLat + (Math.random() - 0.5) * 0.02;
    const eveningEndLng = baseLng + (Math.random() - 0.5) * 0.02;

    routes.push({
      route: {
        index: day * 2 + 1,
        trip_id: "",
        title: `Ngày ${day + 1} - Buổi chiều/Tối`,
        description: `Tiếp tục khám phá ${destination.name} vào buổi chiều và tối. Tham gia các hoạt động giải trí và thưởng thức ẩm thực địa phương.`,
        latStart: morningEndLat,
        lngStart: morningEndLng,
        latEnd: day === days - 1 ? baseLat : eveningEndLat,
        lngEnd: day === days - 1 ? baseLng : eveningEndLng,
        details: getActivitiesByCategory(category, day === days - 1 ? "evening" : "afternoon"),
        costs: [],
        created_at: new Date(),
        updated_at: new Date(),
      },
      reasoning: `Lộ trình buổi chiều/tối cho ngày ${day + 1}, cân bằng giữa tham quan và thư giãn, phù hợp với độ khó ${difficulty || 3}/5.`,
    });
  }

  return routes;
}

/**
 * Generate itinerary using OpenAI (if API key is available)
 */
export async function generateOpenAIItinerary(
  context: TripContext,
  apiKey?: string
): Promise<AIGeneratedRoute[]> {
  if (!apiKey) {
    return generateLocalItinerary(context);
  }

  try {
    const prompt = createItineraryPrompt(context);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional travel itinerary planner. Generate detailed, practical travel routes in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return generateLocalItinerary(context);
    }

    // Parse AI response and convert to routes
    return parseAIResponse(content, context);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return generateLocalItinerary(context);
  }
}

/**
 * Create a detailed prompt for AI
 */
function createItineraryPrompt(context: TripContext): string {
  const { destination, startDate, endDate, budget, difficulty, preferences } = context;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  return `Tạo một lộ trình du lịch chi tiết cho ${days} ngày tại ${destination.name}, ${destination.country}.

Thông tin điểm đến:
- Tên: ${destination.name}
- Mô tả: ${destination.description || "Không có"}
- Loại: ${destination.category || "Không xác định"}
- Tọa độ: ${destination.latitude}, ${destination.longitude}

Thông tin chuyến đi:
- Ngày bắt đầu: ${startDate}
- Ngày kết thúc: ${endDate}
- Số ngày: ${days}
${budget ? `- Ngân sách: ${budget.toLocaleString()} VND` : ""}
${difficulty ? `- Độ khó: ${difficulty}/5` : ""}
${preferences ? `- Sở thích: ${preferences}` : ""}

Yêu cầu:
1. Tạo lộ trình chi tiết cho từng ngày
2. Mỗi ngày chia thành 2-3 chặng (sáng, chiều, tối)
3. Mỗi chặng cần có:
   - Tiêu đề rõ ràng
   - Mô tả chi tiết
   - Danh sách hoạt động cụ thể
   - Tọa độ bắt đầu và kết thúc (dựa trên các điểm tham quan thực tế tại ${destination.name})
4. Lộ trình phải logic, không trùng lặp, và tối ưu về thời gian
5. Phù hợp với ngân sách và độ khó đã cho

Trả về dữ liệu dưới dạng JSON array với format:
[
  {
    "title": "Tên chặng",
    "description": "Mô tả",
    "latStart": số,
    "lngStart": số,
    "latEnd": số,
    "lngEnd": số,
    "details": ["hoạt động 1", "hoạt động 2", ...],
    "reasoning": "Lý do chọn chặng này"
  },
  ...
]`;
}

/**
 * Parse AI response and convert to routes
 */
function parseAIResponse(
  content: string,
  context: TripContext
): AIGeneratedRoute[] {
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return generateLocalItinerary(context);
    }

    const routes = JSON.parse(jsonMatch[0]);
    
    return routes.map((route: any, index: number) => ({
      route: {
        index,
        trip_id: "",
        title: route.title || `Chặng ${index + 1}`,
        description: route.description || "",
        latStart: route.latStart || context.destination.latitude,
        lngStart: route.lngStart || context.destination.longitude,
        latEnd: route.latEnd || context.destination.latitude,
        lngEnd: route.lngEnd || context.destination.longitude,
        details: Array.isArray(route.details) ? route.details : [],
        costs: [],
        created_at: new Date(),
        updated_at: new Date(),
      },
      reasoning: route.reasoning || "",
    }));
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return generateLocalItinerary(context);
  }
}

