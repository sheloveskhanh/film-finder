// tmdbService.js
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "36b0465246018e127b54bfa7d47d965c";

const endpoints = {
  search: `${TMDB_API_URL}/search/movie`,
  discover: `${TMDB_API_URL}/discover/movie`,
  genreList: `${TMDB_API_URL}/genre/movie/list`,
  countryConfig: `${TMDB_API_URL}/configuration/countries`,
  popular: `${TMDB_API_URL}/movie/popular`,
  topRated: `${TMDB_API_URL}/movie/top_rated`,
  upcoming: `${TMDB_API_URL}/movie/upcoming`,
  nowPlaying: `${TMDB_API_URL}/movie/now_playing`,
  details: (tmdbId) => `${TMDB_API_URL}/movie/${tmdbId}`,
};

/**
 * Helper: perform a GET‐JSON request and return a Promise that resolves to parsed JSON.
 * If the TMDB call fails, it rejects.
 */
function getJSON(url, params = {}) {
  return new Promise((resolve, reject) => {
    $.getJSON(url, params)
      .done((data) => resolve(data))
      .fail((jqXhr, status, err) => {
        console.error("TMDB request failed:", status, err);
        reject(err);
      });
  });
}

export async function fetchGenres() {
  const resp = await getJSON(endpoints.genreList, { api_key: TMDB_API_KEY });
  // resp.genres = [ { id, name }, … ]
  return resp.genres;
}

export async function fetchCountries() {
  const list = await getJSON(endpoints.countryConfig, { api_key: TMDB_API_KEY });
  // list = [ { iso_3166_1, english_name }, … ]
  return list;
}

/**
 * Search TMDB by text query. Returns { results, total_pages, total_results }.
 */
export async function searchMovies(query, page = 1) {
  const params = {
    api_key: TMDB_API_KEY,
    language: "en-US",
    query: query,
    include_adult: false,
    page,
  };
  const resp = await getJSON(endpoints.search, params);
  return {
    movies: resp.results,
    totalPages: resp.total_pages,
    totalResults: resp.total_results,
  };
}

/**
 * Discover TMDB with filterState (yearFrom, yearTo, sortBy, country, genres[]) and page.
 * Returns { results, total_pages, total_results }.
 */
export async function discoverMovies(filterState, page = 1) {
  const {
    yearFrom,
    yearTo,
    sortBy,
    country,
    genres, // array of genre‐IDs
  } = filterState;

  const params = {
    api_key: TMDB_API_KEY,
    language: "en-US",
    sort_by: sortBy || "popularity.desc",
    page,
    // Only include these if they’re non-null:
    ...(yearFrom ? { "primary_release_date.gte": `${yearFrom}-01-01` } : {}),
    ...(yearTo ? { "primary_release_date.lte": `${yearTo}-12-31` } : {}),
    ...(genres.length ? { with_genres: genres.join(",") } : {}),
    ...(country ? { region: country } : {}),
  };

  const resp = await getJSON(endpoints.discover, params);
  return {
    movies: resp.results,
    totalPages: resp.total_pages,
    totalResults: resp.total_results,
  };
}

/**
 * Fetch TMDB “details” for a given TMDB ID (including external_ids).
 */
export async function getMovieDetails(tmdbId) {
  const url = endpoints.details(tmdbId);
  const params = {
    api_key: TMDB_API_KEY,
    language: "en-US",
    append_to_response: "external_ids", // so we can read imdb_id
  };
  const detail = await getJSON(url, params);
  return detail;
}

/**
 * Fetch “popular”, “top_rated”, “upcoming”, or “now_playing” list.
 * category must be one of: "popular" | "topRated" | "upcoming" | "nowPlaying".
 * Always returns the first page. Caller can slice or handle pagination if desired.
 */
export async function fetchCategory(category) {
  let url;
  switch (category) {
    case "topRated":
      url = endpoints.topRated;
      break;
    case "upcoming":
      url = endpoints.upcoming;
      break;
    case "nowPlaying":
      url = endpoints.nowPlaying;
      break;
    case "popular":
    default:
      url = endpoints.popular;
  }
  const resp = await getJSON(url, {
    api_key: TMDB_API_KEY,
    language: "en-US",
    page: 1,
  });
  // resp.results is an array of TMDB “movie summary” objects
  return resp.results;
}
