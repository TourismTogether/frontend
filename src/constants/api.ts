/**
 * API Constants
 * Centralized API endpoints configuration
 */

/**
 * In development, if the app is opened via a LAN host (e.g. 192.168.56.1) but
 * NEXT_PUBLIC_API_URL still points at localhost, cookies won't be sent cross-host
 * and login appears to "fail". Align API host to the page host when using default local API.
 */
function getApiBaseUrl(): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"
  )
    .replace(/\s+/g, "")
    .replace(/\/$/, "");

  if (typeof window === "undefined") {
    return fromEnv;
  }

  if (process.env.NODE_ENV !== "development") {
    return fromEnv;
  }

  try {
    const pageHost = window.location.hostname;
    if (pageHost === "localhost" || pageHost === "127.0.0.1") {
      return fromEnv;
    }

    const u = new URL(fromEnv);
    if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
      return fromEnv;
    }

    u.hostname = pageHost;
    return u.origin;
  } catch {
    return fromEnv;
  }
}

const API_BASE_URL = getApiBaseUrl();

/** Python FastAPI semantic search + recommendations (ai-service) */
export const AI_SERVICE_BASE_URL = (
  process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://127.0.0.1:8080"
).replace(/\s+/g, "").replace(/\/$/, "");

export const AI_SERVICE = {
  HEALTH: `${AI_SERVICE_BASE_URL}/health`,
  SEARCH_DESTINATIONS: `${AI_SERVICE_BASE_URL}/search/destinations`,
  SEARCH_TRIPS: `${AI_SERVICE_BASE_URL}/search/trips`,
  SEARCH_ROUTES: `${AI_SERVICE_BASE_URL}/search/routes`,
  RECOMMEND_DESTINATIONS: `${AI_SERVICE_BASE_URL}/recommend/destinations`,
  RECOMMEND_TRIPS: `${AI_SERVICE_BASE_URL}/recommend/trips`,
  RECOMMEND_ROUTES: `${AI_SERVICE_BASE_URL}/recommend/routes`,
} as const;

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/signin`,
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/user`,
  },

  // Users
  USERS: {
    BASE: `${API_BASE_URL}/users`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/users/${id}`,
    UPDATE: (id: string | number) => `${API_BASE_URL}/users/${id}`,
  },

  // Trips
  TRIPS: {
    BASE: `${API_BASE_URL}/trips`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/trips/${id}`,
    CREATE: `${API_BASE_URL}/trips`,
    UPDATE: (id: string | number) => `${API_BASE_URL}/trips/${id}`,
    DELETE: (id: string | number) => `${API_BASE_URL}/trips/${id}`,
    JOIN: (id: string | number) => `${API_BASE_URL}/trips/${id}/join`,
    LEAVE: (id: string | number) => `${API_BASE_URL}/trips/${id}/leave`,
    ROUTES: (id: string | number) => `${API_BASE_URL}/trips/${id}/routes`,
    COSTS: (id: string | number) => `${API_BASE_URL}/trips/${id}/costs`,
  },

  // Routes
  ROUTES: {
    BASE: `${API_BASE_URL}/routes`,
    BY_ID: (id: number) => `${API_BASE_URL}/routes/${id}`,
    CREATE: `${API_BASE_URL}/routes`,
    UPDATE: (id: number) => `${API_BASE_URL}/routes/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/routes/${id}`,
  },

  // Destinations
  DESTINATIONS: {
    BASE: `${API_BASE_URL}/destinations`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/destinations/${id}`,
    CREATE: `${API_BASE_URL}/destinations`,
    UPDATE: (id: string | number) => `${API_BASE_URL}/destinations/${id}`,
    DELETE: (id: string | number) => `${API_BASE_URL}/destinations/${id}`,
    REVIEWS: (id: string | number) => `${API_BASE_URL}/destinations/${id}/reviews`,
    POSTS: (id: string | number) => `${API_BASE_URL}/destinations/${id}/posts`,
  },

  // Reviews (Assessments)
  REVIEWS: {
    BASE: `${API_BASE_URL}/api/assess-destination`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/api/assess-destination/${id}`,
    BY_DESTINATION: (destinationId: string | number) => `${API_BASE_URL}/api/assess-destination/destination/${destinationId}`,
    CREATE: `${API_BASE_URL}/api/assess-destination`,
    UPDATE: `${API_BASE_URL}/api/assess-destination`,
    DELETE: `${API_BASE_URL}/api/assess-destination`,
  },

  // Forum
  FORUM: {
    POSTS: {
      BASE: `${API_BASE_URL}/posts`,
      BY_ID: (id: string | number) => `${API_BASE_URL}/posts/${id}`,
      CREATE: `${API_BASE_URL}/posts`,
      UPDATE: (id: string | number) => `${API_BASE_URL}/posts/${id}`,
      DELETE: (id: string | number) => `${API_BASE_URL}/posts/${id}`,
    },
    REPLIES: {
      BASE: `${API_BASE_URL}/post-replies`,
      BY_ID: (id: string | number) => `${API_BASE_URL}/post-replies/${id}`,
      CREATE: `${API_BASE_URL}/post-replies`,
      UPDATE: (id: string | number) => `${API_BASE_URL}/post-replies/${id}`,
      DELETE: (id: string | number) => `${API_BASE_URL}/post-replies/${id}`,
    },
    CATEGORIES: `${API_BASE_URL}/forum-categories`,
  },

  // Diaries
  DIARIES: {
    BASE: `${API_BASE_URL}/diaries`,
    BY_ID: (id: number) => `${API_BASE_URL}/diaries/${id}`,
    CREATE: `${API_BASE_URL}/diaries`,
    UPDATE: (id: number) => `${API_BASE_URL}/diaries/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/diaries/${id}`,
  },

  // Regions
  REGIONS: {
    BASE: `${API_BASE_URL}/regions`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/regions/${id}`,
    CREATE: `${API_BASE_URL}/regions`,
    UPDATE: (id: string | number) => `${API_BASE_URL}/regions/${id}`,
    DELETE: (id: string | number) => `${API_BASE_URL}/regions/${id}`,
  },

  // Supporters
  SUPPORTERS: {
    BASE: `${API_BASE_URL}/supporters`,
    BY_ID: (userId: string | number) => `${API_BASE_URL}/supporters/${userId}`,
    CREATE: `${API_BASE_URL}/supporters`,
    UPDATE: (userId: string | number) => `${API_BASE_URL}/supporters/${userId}`,
    DELETE: (userId: string | number) => `${API_BASE_URL}/supporters/${userId}`,
    WITH_USER_INFO: `${API_BASE_URL}/supporters/with-user-info`,
  },

  // Travellers
  TRAVELLERS: {
    BASE: `${API_BASE_URL}/travellers`,
    BY_ID: (userId: string | number) => `${API_BASE_URL}/travellers/${userId}`,
    SOS_ALL: `${API_BASE_URL}/travellers/sos/all`,
    SOS_BY_SUPPORTER: (supporterId: string | number) => `${API_BASE_URL}/travellers/sos/supporter/${supporterId}`,
    UPDATE: (userId: string | number) => `${API_BASE_URL}/travellers/${userId}`,
    CREATE: `${API_BASE_URL}/travellers`,
  },

  // Accounts
  ACCOUNTS: {
    BASE: `${API_BASE_URL}/accounts`,
    BY_ID: (id: number) => `${API_BASE_URL}/accounts/${id}`,
    UPDATE: (id: number) => `${API_BASE_URL}/accounts/${id}`,
  },

  // Costs
  COSTS: {
    BASE: `${API_BASE_URL}/costs`,
    BY_ID: (id: number) => `${API_BASE_URL}/costs/${id}`,
    CREATE: `${API_BASE_URL}/costs`,
    UPDATE: (id: number) => `${API_BASE_URL}/costs/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/costs/${id}`,
  },

  // AI Route Planner
  AI_ROUTE: {
    PLAN: `${API_BASE_URL}/ai-route-planner/plan`,
    RECOMMEND: `${API_BASE_URL}/ai-route-planner/recommend`,
  },
} as const;

// External APIs for images
export const EXTERNAL_APIS = {
  UNSPLASH: {
    BASE: "https://api.unsplash.com",
    SEARCH: "https://api.unsplash.com/search/photos",
    RANDOM: "https://api.unsplash.com/photos/random",
  },
  PEXELS: {
    BASE: "https://api.pexels.com/v1",
    SEARCH: "https://api.pexels.com/v1/search",
    CURATED: "https://api.pexels.com/v1/curated",
  },
} as const;

// Fallback images from Picsum (always works)
const getFallbackImage = (seed: number, width: number, height: number): string => {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

// Helper function to get travel image with fallback
export const getTravelImageUrl = (
  keyword: string,
  width: number = 800,
  height: number = 600
): string => {
  // Create a seed from keyword for consistent fallback
  const seed = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Try Unsplash first, but use Picsum as reliable fallback
  const query = encodeURIComponent(keyword);
  // Using Picsum as primary since Unsplash Source API is unreliable
  return getFallbackImage(seed, width, height);
};

// Helper function to get destination image with fallback
export const getDestinationImageUrl = (
  destinationName: string,
  width: number = 800,
  height: number = 600
): string => {
  // Create a seed from destination name for consistent fallback
  const seed = destinationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return getFallbackImage(seed, width, height);
};

// Helper to get a random travel-themed image
export const getRandomTravelImage = (width: number = 800, height: number = 600): string => {
  const seeds = ['travel', 'adventure', 'nature', 'landscape', 'mountain', 'beach', 'city', 'culture'];
  const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
  const seed = randomSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return getFallbackImage(seed, width, height);
};
