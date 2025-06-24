const TMDB_API_URL   = "https://api.themoviedb.org/3";
const TMDB_API_KEY   = "36b0465246018e127b54bfa7d47d965c";
const TMDB_PAGE_SIZE = 20; 

const endpoints = {
  search:      `${TMDB_API_URL}/search/movie`,
  discover:    `${TMDB_API_URL}/discover/movie`,
  genreList:   `${TMDB_API_URL}/genre/movie/list`,
  countryList: `${TMDB_API_URL}/configuration/countries`,
  popular:     `${TMDB_API_URL}/movie/popular`,
  topRated:    `${TMDB_API_URL}/movie/top_rated`,
  upcoming:    `${TMDB_API_URL}/movie/upcoming`,
  nowPlaying:  `${TMDB_API_URL}/movie/now_playing`,
  details:     id => `${TMDB_API_URL}/movie/${id}`,
};

function getJSON(url, params = {}) {
  return new Promise((resolve, reject) => {
    $.getJSON(url, params)
      .done(resolve)
      .fail((_, status, err) => {
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
  return getJSON(endpoints.countryList, { api_key: TMDB_API_KEY });
}

export async function searchMovies(query, uiPage = 1, perPage = 20) {
  const pagesPerBatch = Math.ceil(perPage / TMDB_PAGE_SIZE);

  const first = await getJSON(endpoints.search, {
    api_key: TMDB_API_KEY,
    language: "en-US",
    query,
    include_adult: false,
    page: 1
  });

  const totalTmdPages = first.total_pages;
  const totalUiPages  = Math.ceil(totalTmdPages / pagesPerBatch);
  const currentUi     = Math.min(Math.max(uiPage, 1), totalUiPages);

  const startPage = (currentUi - 1) * pagesPerBatch + 1;
  const endPage   = Math.min(startPage + pagesPerBatch - 1, totalTmdPages);

  const batchPromises = [];
  for (let p = startPage; p <= endPage; p++) {
    batchPromises.push(
      getJSON(endpoints.search, {
        api_key: TMDB_API_KEY,
        language: "en-US",
        query,
        include_adult: false,
        page: p
      }).then(res => res.results)
    );
  }

  const pages = await Promise.all(batchPromises);
  const all = pages.flat().filter(m => m.poster_path && m.release_date);
  return {
    movies:     all.slice(0, perPage),
    totalPages: totalUiPages
  };
}

export async function discoverMovies(filterState, uiPage = 1, perPage = 20) {
  const pagesPerBatch = Math.ceil(perPage / TMDB_PAGE_SIZE);

  const base = {
    api_key: TMDB_API_KEY,
    language: "en-US",
    sort_by: filterState.sortBy || "popularity.desc",
    include_adult: false,
    ...(filterState.yearFrom && { "primary_release_date.gte": `${filterState.yearFrom}-01-01` }),
    ...(filterState.yearTo   && { "primary_release_date.lte": `${filterState.yearTo}-12-31` }),
    ...(filterState.genres.length && { with_genres: filterState.genres.join(",") }),
    ...(filterState.country && { region: filterState.country }),
    page: 1
  };

  const first = await getJSON(endpoints.discover, base);
  const totalTmdPages = first.total_pages;
  const totalUiPages  = Math.ceil(totalTmdPages / pagesPerBatch);
  const currentUi     = Math.min(Math.max(uiPage, 1), totalUiPages);

  const startPage = (currentUi - 1) * pagesPerBatch + 1;
  const endPage   = Math.min(startPage + pagesPerBatch - 1, totalTmdPages);

  const batchPromises = [];
  for (let p = startPage; p <= endPage; p++) {
    batchPromises.push(
      getJSON(endpoints.discover, { ...base, page: p }).then(res => res.results)
    );
  }

  const pages = await Promise.all(batchPromises);
  const all   = pages.flat().filter(m => m.poster_path && m.release_date);

  return {
    movies:     all.slice(0, perPage),
    totalPages: totalUiPages
  };
}

export function getMovieDetails(id) {
  return getJSON(endpoints.details(id), {
    api_key: TMDB_API_KEY,
    language: "en-US",
    append_to_response: "external_ids"
  });
}

export async function fetchTrending() {
  const url  = `${TMDB_API_URL}/trending/movie/day`;
  const resp = await fetch(`${url}?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
  if (!resp.ok) throw new Error(`TMDB trending failed: ${resp.status}`);
  return (await resp.json()).results;
}

export async function fetchCategory(category) {
  let url = endpoints.popular;
  if (category === "topRated")   url = endpoints.topRated;
  if (category === "upcoming")   url = endpoints.upcoming;
  if (category === "nowPlaying") url = endpoints.nowPlaying;

  const resp = await getJSON(url, {
    api_key: TMDB_API_KEY,
    language: "en-US",
    page: 1
  });
  return resp.results;
}
