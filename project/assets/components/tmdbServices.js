// Constants
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "36b0465246018e127b54bfa7d47d965c"; // Should be moved to environment variables
const PAGES_PER_UI_PAGE = 3;
const DEFAULT_LANGUAGE = "en-US";
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Endpoints
const endpoints = {
  search: `${TMDB_API_URL}/search/movie`,
  discover: `${TMDB_API_URL}/discover/movie`,
  genreList: `${TMDB_API_URL}/genre/movie/list`,
  countryConfig: `${TMDB_API_URL}/configuration/countries`,
  popular: `${TMDB_API_URL}/movie/popular`,
  topRated: `${TMDB_API_URL}/movie/top_rated`,
  upcoming: `${TMDB_API_URL}/movie/upcoming`,
  nowPlaying: `${TMDB_API_URL}/movie/now_playing`,
  trending: `${TMDB_API_URL}/trending/movie/day`,
  details: (tmdbId) => `${TMDB_API_URL}/movie/${tmdbId}`,
};

// Helper function with retry logic
async function fetchWithRetry(url, params = {}, retries = MAX_RETRIES) {
  try {
    const queryString = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: DEFAULT_LANGUAGE,
      ...params
    }).toString();
    const fullUrl = `${url}?${queryString}`;

    const response = await fetch(fullUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, params, retries - 1);
    }
    throw new Error(`Failed after ${MAX_RETRIES} attempts: ${error.message}`);
  }
}

// Base API function with caching
const apiCache = new Map();
async function getJSON(url, params = {}) {
  const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const data = await fetchWithRetry(url, params);
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error("TMDB request failed:", error);
    throw error;
  }
}

// Genre and country services
export async function fetchGenres() {
  try {
    const resp = await getJSON(endpoints.genreList);
    return resp.genres || [];
  } catch (error) {
    console.error("Failed to fetch genres:", error);
    return [];
  }
}

export async function fetchCountries() {
  try {
    return await getJSON(endpoints.countryConfig);
  } catch (error) {
    console.error("Failed to fetch countries:", error);
    return [];
  }
}

// Search and discover with pagination
async function fetchPaginatedResults(endpoint, params, uiPage = 1) {
  // Get first page to determine total pages
  const firstPage = await getJSON(endpoint, { ...params, page: 1 });
  const totalTmdPages = firstPage.total_pages || 1;
  const totalUIPages = Math.ceil(totalTmdPages / PAGES_PER_UI_PAGE);
  const currentUi = Math.min(Math.max(uiPage, 1), totalUIPages);

  // Calculate page range to fetch
  const startPage = (currentUi - 1) * PAGES_PER_UI_PAGE + 1;
  const endPage = Math.min(startPage + PAGES_PER_UI_PAGE - 1, totalTmdPages);

  // Fetch pages in parallel
  const promises = [];
  for (let p = startPage; p <= endPage; p++) {
    promises.push(getJSON(endpoint, { ...params, page: p }));
  }

  const pages = await Promise.all(promises);
  const movies = pages.flatMap(pg => pg.results || []);

  return {
    movies,
    totalPages: totalUIPages,
    totalResults: firstPage.total_results || 0
  };
}

export async function searchMovies(query, uiPage = 1, perPage = 20) {
  if (!query || typeof query !== 'string') {
    throw new Error("Invalid search query");
  }

  return fetchPaginatedResults(endpoints.search, {
    query: encodeURIComponent(query.trim()),
    include_adult: false,
  }, uiPage);
}

export async function discoverMovies(filterState, uiPage = 1) {
  const baseParams = {
    sort_by: filterState.sortBy || "popularity.desc",
    include_adult: false,
    ...(filterState.yearFrom && { "primary_release_date.gte": `${filterState.yearFrom}-01-01` }),
    ...(filterState.yearTo && { "primary_release_date.lte": `${filterState.yearTo}-12-31` }),
    ...(filterState.genres?.length && { with_genres: filterState.genres.join(",") }),
    ...(filterState.country && { region: filterState.country }),
  };

  return fetchPaginatedResults(endpoints.discover, baseParams, uiPage);
}

// Movie details
export async function getMovieDetails(tmdbId) {
  if (!tmdbId || isNaN(tmdbId)) {
    throw new Error("Invalid TMDB ID");
  }

  try {
    return await getJSON(endpoints.details(tmdbId), {
      append_to_response: "external_ids,credits,videos"
    });
  } catch (error) {
    console.error(`Failed to fetch details for movie ${tmdbId}:`, error);
    throw error;
  }
}

// Category fetchers
export async function fetchTrending() {
  try {
    const resp = await getJSON(endpoints.trending);
    return resp.results || [];
  } catch (error) {
    console.error("Failed to fetch trending movies:", error);
    return [];
  }
}

export async function fetchCategory(category) {
  const endpointMap = {
    popular: endpoints.popular,
    topRated: endpoints.topRated,
    upcoming: endpoints.upcoming,
    nowPlaying: endpoints.nowPlaying
  };

  const endpoint = endpointMap[category];
  if (!endpoint) {
    throw new Error(`Invalid category: ${category}`);
  }

  try {
    const resp = await getJSON(endpoint);
    return resp.results || [];
  } catch (error) {
    console.error(`Failed to fetch ${category} movies:`, error);
    return [];
  }
}

// Cache management
export function clearCache() {
  apiCache.clear();
}

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 200ms between requests

async function rateLimitedFetch(url, options) {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  
  if (timeSinceLast < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLast)
    );
  }
  
  lastRequestTime = Date.now();
  return fetch(url, options);
}