/**
 * API Constants
 * Centralized API endpoints configuration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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
    BY_ID: (id: number) => `${API_BASE_URL}/trips/${id}`,
    CREATE: `${API_BASE_URL}/trips`,
    UPDATE: (id: number) => `${API_BASE_URL}/trips/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/trips/${id}`,
    JOIN: (id: number) => `${API_BASE_URL}/trips/${id}/join`,
    LEAVE: (id: number) => `${API_BASE_URL}/trips/${id}/leave`,
    ROUTES: (id: number) => `${API_BASE_URL}/trips/${id}/routes`,
    COSTS: (id: number) => `${API_BASE_URL}/trips/${id}/costs`,
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
    BY_ID: (id: number) => `${API_BASE_URL}/destinations/${id}`,
    CREATE: `${API_BASE_URL}/destinations`,
    UPDATE: (id: number) => `${API_BASE_URL}/destinations/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/destinations/${id}`,
    REVIEWS: (id: number) => `${API_BASE_URL}/destinations/${id}/reviews`,
    POSTS: (id: number) => `${API_BASE_URL}/destinations/${id}/posts`,
  },

  // Reviews
  REVIEWS: {
    BASE: `${API_BASE_URL}/assess-destinations`,
    BY_ID: (id: number) => `${API_BASE_URL}/assess-destinations/${id}`,
    CREATE: `${API_BASE_URL}/assess-destinations`,
    UPDATE: (id: number) => `${API_BASE_URL}/assess-destinations/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/assess-destinations/${id}`,
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
    BY_ID: (id: number) => `${API_BASE_URL}/regions/${id}`,
    CREATE: `${API_BASE_URL}/regions`,
    UPDATE: (id: number) => `${API_BASE_URL}/regions/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/regions/${id}`,
  },

  // Supporters
  SUPPORTERS: {
    BASE: `${API_BASE_URL}/supporters`,
    BY_ID: (userId: number) => `${API_BASE_URL}/supporters/${userId}`,
    CREATE: `${API_BASE_URL}/supporters`,
    UPDATE: (userId: number) => `${API_BASE_URL}/supporters/${userId}`,
    DELETE: (userId: number) => `${API_BASE_URL}/supporters/${userId}`,
    WITH_USER_INFO: `${API_BASE_URL}/supporters/with-user-info`,
  },

  // Travellers
  TRAVELLERS: {
    BASE: `${API_BASE_URL}/travellers`,
    BY_ID: (userId: number) => `${API_BASE_URL}/travellers/${userId}`,
    SOS_ALL: `${API_BASE_URL}/travellers/sos/all`,
    SOS_BY_SUPPORTER: (supporterId: number) => `${API_BASE_URL}/travellers/sos/supporter/${supporterId}`,
    UPDATE: (userId: number) => `${API_BASE_URL}/travellers/${userId}`,
    CREATE: `${API_BASE_URL}/travellers`,
  },

  // Admins
  ADMINS: {
    BASE: `${API_BASE_URL}/admins`,
    BY_ID: (userId: number) => `${API_BASE_URL}/admins/${userId}`,
    CREATE: `${API_BASE_URL}/admins`,
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

  // Admin
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    DESTINATIONS: `${API_BASE_URL}/admin/destinations`,
    REGIONS: `${API_BASE_URL}/admin/regions`,
    SUPPORT_TEAM: `${API_BASE_URL}/admin/support-team`,
    SOS: `${API_BASE_URL}/admin/sos`,
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
