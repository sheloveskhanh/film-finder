const API_KEY = "36b0465246018e127b54bfa7d47d965c";
const BASE_URL = "https://api.themoviedb.org/3";

export async function fetchSearchResults(state) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    query: state.query,
    page: state.page,
    ...(state.yearFrom && { 'primary_release_date.gte': `${state.yearFrom}-01-01` }),
    ...(state.yearTo && { 'primary_release_date.lte': `${state.yearTo}-12-31` }),
    ...(state.sortBy && { sort_by: state.sortBy }),
    ...(state.country && { with_original_language: state.country }),
    ...(state.genres.length && { with_genres: state.genres.join(",") }),
  });

  const url = `${BASE_URL}/search/movie?${params.toString()}`;
  const resp = await fetch(url);
  const data = await resp.json();
  return { movies: data.results || [], totalPages: data.total_pages || 1 };
}

export async function fetchMovieDetails(tmdbId) {
  const url = `${BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&append_to_response=videos`;
  const resp = await fetch(url);
  const data = await resp.json();

  // Find YouTube trailer if available
  let trailerId = null;
  let embeddable = false;
  if (data.videos && data.videos.results) {
    const trailer = data.videos.results.find(
      v => v.site === "YouTube" && v.type === "Trailer"
    );
    if (trailer) {
      trailerId = trailer.key;
      embeddable = true;
    }
  }

  return { data, trailerId, embeddable };
}