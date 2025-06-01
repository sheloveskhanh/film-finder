// project/assets/components/tmdbService.js

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "36b0465246018e127b54bfa7d47d965c";
const PAGES_PER_UI_PAGE = 3;

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
  return resp.genres;
}

export async function fetchCountries() {
  const list = await getJSON(endpoints.countryConfig, { api_key: TMDB_API_KEY });
  return list;
}

export async function searchMovies(query, uiPage = 1) {
  // 1. First, fetch page=1 briefly to get total_pages
  const initial = await getJSON(endpoints.search, {
    api_key: TMDB_API_KEY,
    language: "en-US",
    query: query,
    include_adult: false,
    page: 1,
  });
  const totalTmdPages = initial.total_pages;

  const totalUIPages = Math.ceil(totalTmdPages / PAGES_PER_UI_PAGE);

  const currentUi = Math.min(Math.max(uiPage, 1), totalUIPages);

  const startTmdb = (currentUi - 1) * PAGES_PER_UI_PAGE + 1;
  const endTmdb = Math.min(startTmdb + PAGES_PER_UI_PAGE - 1, totalTmdPages);

  const fetchPromises = [];
  for (let p = startTmdb; p <= endTmdb; p++) {
    fetchPromises.push(
      fetch(
        `${endpoints.search}?` +
          new URLSearchParams({
            api_key: TMDB_API_KEY,
            language: "en-US",
            query: query,
            include_adult: "false",
            page: p,
          }).toString()
      ).then((res) => {
        if (!res.ok) throw new Error(`TMDB search (page ${p}) failed: ${res.status}`);
        return res.json();
      })
    );
  }

  const resultsArr = await Promise.all(fetchPromises);

  let combined = [];
  for (const pageResp of resultsArr) {
    combined = combined.concat(pageResp.results);
  }
  return {
    movies: combined,            
    totalPages: totalUIPages,   
    totalResults: initial.total_results,
  };
}



export async function discoverMovies(filterState, uiPage = 1) {
  const baseParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: "en-US",
    sort_by: filterState.sortBy || "popularity.desc",
    include_adult: "false",
  });

  if (filterState.yearFrom) {
    baseParams.set("primary_release_date.gte", `${filterState.yearFrom}-01-01`);
  }
  if (filterState.yearTo) {
    baseParams.set("primary_release_date.lte", `${filterState.yearTo}-12-31`);
  }
  if (filterState.genres.length) {
    baseParams.set("with_genres", filterState.genres.join(","));
  }
  if (filterState.country) {
    baseParams.set("region", filterState.country);
  }

  baseParams.set("page", 1);
  const initial = await getJSON(`${endpoints.discover}?${baseParams.toString()}`);
  const totalTmdPages = initial.total_pages;
  const totalUIPages = Math.ceil(totalTmdPages / PAGES_PER_UI_PAGE);
  const currentUi = Math.min(Math.max(uiPage, 1), totalUIPages);
  const startTmdb = (currentUi - 1) * PAGES_PER_UI_PAGE + 1;
  const endTmdb = Math.min(startTmdb + PAGES_PER_UI_PAGE - 1, totalTmdPages);

  const fetchPromises = [];
  for (let p = startTmdb; p <= endTmdb; p++) {
    baseParams.set("page", p);
    const url = `${endpoints.discover}?${baseParams.toString()}`;
    fetchPromises.push(
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(`TMDB discover (page ${p}) failed: ${res.status}`);
        return res.json();
      })
    );
  }

  const resultsArr = await Promise.all(fetchPromises);

  let combined = [];
  for (const pageResp of resultsArr) {
    combined = combined.concat(pageResp.results);
  }

  return {
    movies: combined,
    totalPages: totalUIPages,
    totalResults: initial.total_results,
  };
}

export async function getMovieDetails(tmdbId) {
  const url = endpoints.details(tmdbId);
  const params = {
    api_key: TMDB_API_KEY,
    language: "en-US",
    append_to_response: "external_ids",
  };
  const detail = await getJSON(url, params);
  return detail;
}

export async function fetchTrending() {
  const url = `${TMDB_API_URL}/trending/movie/day`;
  const response = await fetch(`${url}?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
  if (!response.ok) {
    throw new Error(`TMDB trending fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}

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
  return resp.results;
}