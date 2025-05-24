import {
  TMDB_SEARCH,
  TMDB_DISCOVER,
  TMDB_API_KEY,
  OMDB_API_URL,
  OMDB_API_KEY,
  YT_API_KEY
} from '../config/tmdb.js';

export async function fetchSearchResults(state) {
  const { query, page, yearFrom, yearTo, sortBy, country, genres } = state;
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: "en-US",
    page,
    include_adult: "false",
    ...(query ? { query } : {
      sort_by: sortBy || "popularity.desc",
      ...(yearFrom && { "primary_release_date.gte": `${yearFrom}-01-01` }),
      ...(yearTo   && { "primary_release_date.lte": `${yearTo}-12-31` }),
      ...(genres.length && { with_genres: genres.join(',') }),
      ...(country && { with_origin_country: country })
    })
  });
  const url = (query ? TMDB_SEARCH : TMDB_DISCOVER) + "?" + params;
  const resp = await fetch(url);
  const data = await resp.json();
  return { movies: data.results, totalPages: data.total_pages };
}

export async function fetchMovieDetails(imdbID) {
  // 1) OMDB details
  const omdbRes = await fetch(OMDB_API_URL + "?" + new URLSearchParams({
    apikey: OMDB_API_KEY,
    i: imdbID,
    plot: "full"
  }));
  const omdbData = await omdbRes.json();

  // 2) YouTube trailer search
  const q = encodeURIComponent(omdbData.Title + " official trailer");
  const ytSearch = await (await fetch("https://www.googleapis.com/youtube/v3/search?" + new URLSearchParams({
    part: "snippet", q, type: "video", maxResults: "1", key: YT_API_KEY
  }))).json();
  const trailerId = ytSearch.items?.[0]?.id.videoId;

  // 3) Check embeddable
  let embeddable = false;
  if (trailerId) {
    const status = await (await fetch("https://www.googleapis.com/youtube/v3/videos?" + new URLSearchParams({
      part: "status", id: trailerId, key: YT_API_KEY
    }))).json();
    embeddable = status.items?.[0]?.status.embeddable;
  }

  return { data: omdbData, trailerId, embeddable };
}
