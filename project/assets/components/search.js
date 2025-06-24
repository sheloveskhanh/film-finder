// assets/components/search.js

import {
  searchMovies,
  discoverMovies,
  getMovieDetails
} from "./tmdbServices.js";
import { renderResults, renderPager } from "./uiHelpers.js";
import { MovieModal }            from "./modal.js";
import { Favorites }             from "./favorites.js";
import { filterState, genreRev, countryMap } from "./filters.js";

const OMDB_API_URL = "https://www.omdbapi.com/";
const OMDB_API_KEY = "375878b3";
const YT_API_KEY   = "AIzaSyDnDJkjOBT2Ruj9jW88J9BIZHJuwnMlI3c";
const $searchInput = $("#search-input");

let lastMovies = [];    
const movieCache   = {};
const trailerCache = {};

export function initSearch() {
  // Search button
  $("#search-button").on("click", () => {
    filterState.page = 1;
    reloadResults();
  });

  // Enter key in input
  $searchInput.on("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      filterState.page = 1;
      reloadResults();
    }
  });

  $searchInput.on("input", () => {
    if (!$searchInput.val().trim()) {
      $("#results, #pagination").empty();
      lastMovies = [];
    }
  });

  $("#pagination").on("click", "button", function() {
    if ($(this).is(":disabled")) return;
    const p = $(this).data("page");
    if (typeof p === "number") {
      filterState.page = p;
      reloadResults();
    }
  });

  $("#results").on("click", ".result-card", async function(e) {
    if ($(e.target).is(".add-fav")) return;

    const tmdbId = $(this).data("id");
    let detail = movieCache[tmdbId];
    if (!detail) {
      MovieModal.showLoading();
      try {
        detail = await getMovieDetails(tmdbId);
        movieCache[tmdbId] = detail;
      } catch (err) {
        console.error("TMDB detail fetch failed:", err);
        return MovieModal.showError("Could not load movie details.");
      }
    }

    const imdbID = detail.external_ids?.imdb_id;
    if (!imdbID) {
      return (MovieModal.showTMDBOnly || MovieModal.showError).call(MovieModal, detail);
    }

    MovieModal.showLoading();
    try {
      const omdbData = await fetchOMDB(imdbID);
      const { videoId, embeddable } = await fetchYouTubeTrailer(omdbData.Title);
      MovieModal.show(omdbData, videoId, embeddable);
    } catch (err) {
      console.error("OMDB/YouTube fetch failed:", err);
      MovieModal.showError("Failed to load movie details.");
    }
  });
}

export async function reloadResults() {
  const q = $searchInput.val().trim();
  const hasFilters = Boolean(
    filterState.yearFrom ||
    filterState.yearTo   ||
    filterState.sortBy   ||
    filterState.country  ||
    filterState.genres.length
  );

  $("#popular-section").toggle(!q && !hasFilters);
  $("#results, #pagination").empty();

  try {
    let pageMovies = [], totalPages = 1;

    if (hasFilters) {
      // discover mode
      const resp = await discoverMovies(filterState, filterState.page, filterState.perPage);
      pageMovies = resp.movies;
      totalPages = resp.totalPages;
    }
    else if (q) {
      const resp = await searchMovies(q, filterState.page, filterState.perPage);
      pageMovies = resp.movies.filter(m =>
        m.title.toLowerCase().includes(q.toLowerCase())
      );
      totalPages = resp.totalPages;
    }

    // store for “Add to Favorites”
    lastMovies = pageMovies;

    // render
    renderResults(pageMovies);
    renderPager(filterState.page, totalPages);
    annotateTmdbDetails(pageMovies);

  } catch (err) {
    console.error("Error during reloadResults():", err);
    MovieModal.showError("Couldn't load results. Please try again.");
  }
}

export function annotateTmdbDetails(arr) {
  arr.forEach(async m => {
    if (movieCache[m.id]) {
      applyFiltersToCard(m.id, movieCache[m.id]);
    } else {
      try {
        const detail = await getMovieDetails(m.id);
        movieCache[m.id] = detail;
        applyFiltersToCard(m.id, detail);
      } catch (e) {
        console.error(`TMDB detail failed for ${m.id}:`, e);
      }
    }
  });
}

function applyFiltersToCard(tmdbId, detail) {
  const $c = $(`#results .result-card[data-id="${tmdbId}"]`);
  if (!$c.length) return;

  // attach data-attrs for filtering & sorting
  $c
    .attr("data-genre", detail.genres.map(g => g.name).join(","))
    .attr("data-country", detail.production_countries.map(c => c.name).join(","))
    .attr("data-rating", detail.vote_average)
    .attr("data-votes", detail.vote_count);

  // filter logic
  const { yearFrom, yearTo, country: cCode, genres: reqIds } = filterState;
  let ok = true;
  const y = parseInt($c.attr("data-year"), 10);
  if (yearFrom && y < yearFrom) ok = false;
  if (yearTo   && y > yearTo)   ok = false;

  if (cCode) {
    const list = ($c.attr("data-country")||"").split(",");
    if (!list.includes(countryMap[cCode])) ok = false;
  }

  if (reqIds.length) {
    const have = ($c.attr("data-genre")||"").split(",");
    const want = reqIds.map(i => genreRev[i]);
    if (!want.every(g => have.includes(g))) ok = false;
  }

  $c.toggle(ok);

  // re-sort if needed
  if (filterState.sortBy) {
    const visible = $("#results .result-card:visible").toArray();
    visible.sort((a,b) => {
      const A = $(a), B = $(b);
      switch (filterState.sortBy) {
        case "original_title.asc":
          return A.find(".title").text().localeCompare(B.find(".title").text());
        case "vote_average.desc":
          return +B.attr("data-rating") - +A.attr("data-rating");
        case "vote_average.asc":
          return +A.attr("data-rating") - +B.attr("data-rating");
        case "vote_count.desc":
          return +B.attr("data-votes") - +A.attr("data-votes");
        default:
          return 0;
      }
    });
    $("#results").append(visible);
  }
}

function fetchOMDB(imdbID) {
  return $.getJSON(OMDB_API_URL, {
    apikey: OMDB_API_KEY,
    i: imdbID,
    plot: "full"
  });
}

async function fetchYouTubeTrailer(title) {
  if (trailerCache[title]) return trailerCache[title];

  // Replace & with "and" to avoid API issues
  const safeTitle = title.replace(/&/g, "and");
  const yt = await $.getJSON(
    "https://www.googleapis.com/youtube/v3/search",
    { part:"snippet", type:"video", maxResults:1, q:`${safeTitle} official trailer`, key:YT_API_KEY }
  );
  const vid = yt.items?.[0]?.id.videoId || null;
  let emb = false;
  if (vid) {
    const st = await $.getJSON(
      "https://www.googleapis.com/youtube/v3/videos",
      { part:"status", id:vid, key:YT_API_KEY }
    );
    emb = st.items?.[0]?.status.embeddable||false;
  }
  trailerCache[title] = { videoId: vid, embeddable: emb };
  return trailerCache[title];
}
