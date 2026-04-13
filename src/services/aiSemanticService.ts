import { AI_SERVICE } from "@/constants/api";

export interface SemanticDestinationHit {
  id: string;
  similarity: number;
  name: string | null;
  country: string | null;
  description: string | null;
  category: string | null;
  region_id: string | null;
}

export interface SemanticTripHit {
  id: string;
  similarity: number;
  title: string | null;
  description: string | null;
  destination_id: string | null;
  departure: string | null;
  status: string | null;
}

export interface SemanticRouteHit {
  id: string;
  similarity: number;
  title: string | null;
  description: string | null;
  trip_id: string | null;
  route_index: number | null;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `AI service ${res.status}: ${text || res.statusText || "request failed"}`
    );
  }
  return res.json() as Promise<T>;
}

function withParams(
  base: string,
  params: Record<string, string | number | undefined>
): string {
  const u = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
  }
  return u.toString();
}

export async function searchDestinationsSemantic(
  query: string,
  topK = 5
): Promise<{ query: string; results: SemanticDestinationHit[] }> {
  return getJson(
    withParams(AI_SERVICE.SEARCH_DESTINATIONS, { query, top_k: topK })
  );
}

export async function searchTripsSemantic(
  query: string,
  topK = 5
): Promise<{ query: string; results: SemanticTripHit[] }> {
  return getJson(withParams(AI_SERVICE.SEARCH_TRIPS, { query, top_k: topK }));
}

export async function searchRoutesSemantic(
  query: string,
  topK = 5
): Promise<{ query: string; results: SemanticRouteHit[] }> {
  return getJson(withParams(AI_SERVICE.SEARCH_ROUTES, { query, top_k: topK }));
}

export async function recommendDestinationsForUser(
  userId: string,
  topK = 5
): Promise<{ user_id: string; results: SemanticDestinationHit[] }> {
  return getJson(
    withParams(AI_SERVICE.RECOMMEND_DESTINATIONS, { user_id: userId, top_k: topK })
  );
}

export async function recommendTripsForUser(
  userId: string,
  topK = 5
): Promise<{ user_id: string; results: SemanticTripHit[] }> {
  return getJson(
    withParams(AI_SERVICE.RECOMMEND_TRIPS, { user_id: userId, top_k: topK })
  );
}

export async function recommendRoutesForUser(
  userId: string,
  topK = 5
): Promise<{ user_id: string; results: SemanticRouteHit[] }> {
  return getJson(
    withParams(AI_SERVICE.RECOMMEND_ROUTES, { user_id: userId, top_k: topK })
  );
}

export async function checkAiServiceHealth(): Promise<boolean> {
  try {
    const res = await fetch(AI_SERVICE.HEALTH, { method: "GET" });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === "ok";
  } catch {
    return false;
  }
}
