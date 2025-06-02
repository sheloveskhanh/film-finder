// search.js

import { searchMovies, discoverMovies, getMovieDetails } from "./tmdbServices.js";
import { renderResults, renderPager }                              from "./uiHelpers.js";
import { MovieModal }                                               from "./modal.js";
import { filterState }                                              from "./filters.js";

const OMDB_API_URL = "https://www.omdbapi.com/";
const OMDB_API_KEY = "375878b3";
const YT_API_KEY   = "AIzaSyDnDJkjOBT2Ruj9jW88J9BIZHJuwnMlI3c";

const movieDetailsCache = {};
const trailerCache      = {};

export function initSearch() {
  $("#search-button").on("click", () => {
    filterState.page = 1;
    reloadResults();
  });

  $("#search-input").on("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      filterState.page = 1;
      reloadResults();
    }
  });

  $("#search-input").on("input", function() {
    if (!$(this).val().trim()) {
      $("#results").empty();
      $("#pagination").empty();
    }
  });

  $("#pagination").on("click", "button", function() {
    const p = $(this).data("page");
    if (p) {
      filterState.page = p;
      reloadResults();
    }
  });

  $("#results").on("click", ".result-card", async function(e) {
    if ($(e.target).is(".add-fav")) return;
    const tmdbId = $(this).attr("data-tmdb-id");
results
    if (movieDetailsCache[tmdbId]) {
      detail = movieDetailsCache[tmdbId];
    } else {
      MovieModal.showLoading();
      try {
        detail = await getMovieDetails(tmdbId);
        movieDetailsCache[tmdbId] = detail;
      } catch {
        MovieModal.showError("Could not load movie details.");
        return;
      }
    }

    const imdbID = detail.external_ids?.imdb_id;
    if (!imdbID) {
      MovieModal.showTMDBOnly(detail);
      return;
    }

    MovieModal.showLoading();

    try {
      const omdbData = await fetchOMDB(imdbID);
      const { videoId, embeddable } = await fetchYouTubeTrailer(omdbData.Title);
      MovieModal.show(omdbData, videoId, embeddable);
    } catch {
      MovieModal.showError("Failed to load movie details. Please try again later.");
    }
  });
}

export async function reloadResults() {
  const q = $("#search-input").val().trim();
  const hasFilters = Boolean(
    filterState.yearFrom ||
    filterState.yearTo   ||
    filterState.sortBy   ||
    filterState.country  ||
    filterState.genres.length
  );

  $("#popular-section").toggle(!q && !hasFilters);
  $("#results").empty();
  $("#pagination").empty();

  try {
    if (q) {
      const { movies, totalPages } = await searchMovies(q, filterState.page);
      renderResults(movies);
      renderPager(filterState.page, totalPages);
      annotateTmdbDetails(movies);
    } else if (hasFilters) {
      const { movies, totalPages } = await discoverMovies(filterState, filterState.page);
      renderResults(movies);
      renderPager(filterState.page, totalPages);
      annotateTmdbDetails(movies);
    }
  } catch {
    MovieModal.showError("Couldn't load results. Please try again.");
  }
}

export function annotateTmdbDetails(movieArray) {
  movieArray.forEach(async m => {
    if (movieDetailsCache[m.id]) {
      attachDataAttributes(m.id, movieDetailsCache[m.id]);
      return;
    }
    try {
      const detail = await getMovieDetails(m.id);
      movieDetailsCache[m.id] = detail;
      attachDataAttributes(m.id, detail);
    } catch {
      // Skip on failure
    }
  });
}

function attachDataAttributes(tmdbId, detail) {
  const $card = $(`#results .result-card[data-tmdb-id="${tmdbId}"]`);
  if (!$card.length) return;

  const genres  = detail.genres.map(g => g.name).join(", ");
  const country = detail.production_countries.map(c => c.name).join(", ");

  $card
    .attr("data-genre", genres)
    .attr("data-country", country)
    .attr("data-rating", detail.vote_average)
    .attr("data-votes", detail.vote_count)
    .attr("data-imdb-id", detail.external_ids?.imdb_id || "");
}

async function fetchOMDB(imdbID) {
  return new Promise((resolve, reject) => {
    $.getJSON(
      OMDB_API_URL,
      { apikey: OMDB_API_KEY, i: imdbID, plot: "full" },
      md => resolve(md)
    ).fail((_, __, err) => reject(err));
  });
}

async function fetchYouTubeTrailer(title) {
  if (trailerCache[title]) {
    return trailerCache[title];
  }

  const query = `${title} official trailer`;
  const ytSearch = await new Promise((resolve, reject) => {
    $.getJSON(
      "https://www.googleapis.com/youtube/v3/search",
      {
        part: "snippet",
        type: "video",
        maxResults: 1,
        q: query,
        key: YT_API_KEY,
      },
      ytData => resolve(ytData)
    ).fail((_, __, err) => reject(err));
  });

  const videoId = ytSearch.items?.[0]?.id.videoId || null;
  let embeddable = false;

  if (videoId) {
    const statusData = await new Promise((resolve, reject) => {
      $.getJSON(
        "https://www.googleapis.com/youtube/v3/videos",
        { part: "status", id: videoId, key: YT_API_KEY },
        sd => resolve(sd)
      ).fail((_, __, err) => reject(err));
    });
    embeddable = statusData.items?.[0]?.status.embeddable || false;
  }

  const result = { videoId, embeddable };
  trailerCache[title] = result;
  return result;
}
