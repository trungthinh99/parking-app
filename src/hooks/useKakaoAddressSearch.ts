import { useCallback, useEffect, useRef, useState } from "react";

/** Kakao Local keyword search result item */
export interface KakaoSearchResult {
  /** Unique place ID */
  id: string;
  /** Place name */
  placeName: string;
  /** Full address (road-based) */
  roadAddress: string;
  /** Jibun address (lot-based) */
  jibunAddress: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
}

/** Kakao Local API response document */
interface KakaoAddressDocument {
  address_name: string;
  address_type: "REGION" | "ROAD" | "REGION_ADDR" | "ROAD_ADDR";
  x: string;
  y: string;
  address?: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
  };
  road_address?: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    road_name: string;
    building_name: string;
  };
}

/** Kakao Local keyword search document */
interface KakaoKeywordDocument {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  category_group_code: string;
  category_group_name: string;
}

interface KakaoSearchResponse<T> {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: T[];
}

const KAKAO_REST_API_KEY =
  process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ?? "";
const DEBOUNCE_MS = 300;

/**
 * Fetch address search results from Kakao Local API.
 * Combines both address search and keyword search for comprehensive results.
 */
async function searchKakaoAddress(
  query: string,
  signal?: AbortSignal
): Promise<KakaoSearchResult[]> {
  if (!query.trim()) return [];

  const headers = {
    Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
  };

  // Run both address search and keyword search in parallel
  const [addressResults, keywordResults] = await Promise.allSettled([
    fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=10`,
      { headers, signal }
    ).then((r) => r.json() as Promise<KakaoSearchResponse<KakaoAddressDocument>>),
    fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=10`,
      { headers, signal }
    ).then((r) => r.json() as Promise<KakaoSearchResponse<KakaoKeywordDocument>>),
  ]);

  const results: KakaoSearchResult[] = [];
  const seenIds = new Set<string>();

  // Process address search results first (higher relevance for address queries)
  if (addressResults.status === "fulfilled" && addressResults.value.documents) {
    for (const doc of addressResults.value.documents) {
      const id = `addr_${doc.x}_${doc.y}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      results.push({
        id,
        placeName: doc.road_address?.building_name || "",
        roadAddress: doc.road_address?.address_name || doc.address_name,
        jibunAddress: doc.address?.address_name || doc.address_name,
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
      });
    }
  }

  // Process keyword search results
  if (keywordResults.status === "fulfilled" && keywordResults.value.documents) {
    for (const doc of keywordResults.value.documents) {
      const id = `kw_${doc.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      results.push({
        id,
        placeName: doc.place_name,
        roadAddress: doc.road_address_name || doc.address_name,
        jibunAddress: doc.address_name,
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
      });
    }
  }

  return results;
}

/** Kakao reverse-geocoding (coord2address) document */
interface KakaoCoord2AddressDocument {
  address?: {
    address_name: string;
  } | null;
  road_address?: {
    address_name: string;
  } | null;
}

/**
 * Reverse geocode a (lat, lng) pair into a Korean address using Kakao Local API.
 * Returns the road address when available, falling back to the jibun (lot) address.
 * Returns null when the API call fails or no address is found.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!KAKAO_REST_API_KEY) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  try {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as KakaoSearchResponse<KakaoCoord2AddressDocument>;
    const doc = json.documents?.[0];
    if (!doc) return null;
    return doc.road_address?.address_name || doc.address?.address_name || null;
  } catch {
    return null;
  }
}

/**
 * Hook for debounced Kakao address/keyword search.
 * Automatically searches as user types with debounce.
 */
export function useKakaoAddressSearch(query: string) {
  const [results, setResults] = useState<KakaoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort();

    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    try {
      const data = await searchKakaoAddress(searchQuery, controller.signal);
      if (!controller.signal.aborted) {
        setResults(data);
        setIsSearching(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setIsSearching(false);
        setResults([]);
      }
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { results, isSearching };
}
