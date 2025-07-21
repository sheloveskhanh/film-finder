import {
  searchMovies,
  discoverMovies,
  getMovieDetails,
} from "./tmdbServices.js";
import { renderPager } from "./uiHelpers.js";
import { MovieModal } from "./modal.js";
import { Favorites } from "./favorites.js";
import { filterState, genreRev, countryMap } from "./filters.js";

const OMDB_API_URL = "https://www.omdbapi.com/";
const OMDB_API_KEY = "375878b3";
const YT_API_KEY = "AIzaSyDnDJkjOBT2Ruj9jW88J9BIZHJuwnMlI3c";
const $searchInput = $("#search-input");

let lastMovies = [];
const movieCache = {};
const trailerCache = {};

// Notification helper function
function showNotification(message, isError = false) {
  const notification = document.createElement("div");
  notification.className = `notification ${isError ? "error" : ""}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

export function initSearch() {
  $("#search-button").on("click", () => {
    filterState.page = 1;
    reloadResults();
  });

  $searchInput.on("keydown", (e) => {
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

  $("#pagination").on("click", "button", function () {
    if ($(this).is(":disabled")) return;
    const p = $(this).data("page");
    if (typeof p === "number") {
      filterState.page = p;
      reloadResults();
    }
  });

  // Favorites button handler
  $("#results").on("click", ".add-fav:not(.added)", async function (e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const $button = $(this);
    const tmdbId = $button.data("movie-id");
    const movie = lastMovies.find((m) => String(m.id) === String(tmdbId));

    if (!movie) {
      showNotification("Movie not found in current results", true);
      return;
    }

    try {
      if (!movie.poster_path || !movie.title) {
        const details = await getMovieDetails(tmdbId);
        Object.assign(movie, details);
      }

      const movieToAdd = {
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        poster_path: movie.poster_path,
        imdbID: movie.imdb_id,
        Title: movie.title,
        Year: movie.release_date?.slice(0, 4),
        Poster: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "./assets/image/no-image.jpg",
      };

      const added = Favorites.add(movieToAdd);

      if (added) {
        $button.text("✓ Added").addClass("added").prop("disabled", true);
        showNotification(`${movie.title} added to favorites!`);
      } else {
        showNotification(`${movie.title} is already in your favorites!`, true);
        $button.text("✓ Added").addClass("added").prop("disabled", true);
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      showNotification("Failed to add to favorites", true);
    }
  });

  $("#results").on("click", ".result-card, .info-icon", async function (e) {
    if ($(e.target).closest(".add-fav").length > 0) return;

    const $card = $(this).closest(".result-card");
    const tmdbId = $card.data("id");
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
      return MovieModal.showTMDBOnly(detail);
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

  Favorites.render();

  // Favorite dropdown handlers
  $("#favorites-button").on("click", function (e) {
    e.stopPropagation();
    const $dropdown = $("#favorites-dropdown");
    const wasVisible = $dropdown.is(":visible");
    $dropdown.toggle();
    $("body").toggleClass("favorites-open", !wasVisible);
    if (!wasVisible) Favorites.render();
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest("#favorites-button, #favorites-dropdown").length) {
      $("#favorites-dropdown").hide();
      $("body").removeClass("favorites-open");
      document.body.style.overflow = "";
    }
  });

  $("#favorites-dropdown").on("click", function (e) {
    e.stopPropagation();
  });

  $("#favorites-list").on("click", ".remove-fav", function (e) {
    e.stopPropagation();
    const movieId = $(this).closest("li").data("id");
    Favorites.remove(movieId);
  });
}

export async function reloadResults() {
  const q = $searchInput.val().trim();
  const hasFilters = Boolean(
    filterState.yearFrom ||
    filterState.yearTo ||
    filterState.sortBy ||
    filterState.country ||
    filterState.genres.length
  );

  $("#popular-section").toggle(!q && !hasFilters);
  $("#results, #pagination").empty();

  try {
    let pageMovies = [], totalPages = 1;

    if (hasFilters) {
      const resp = await discoverMovies(
        filterState,
        filterState.page,
        filterState.perPage // This is now being used
      );
      pageMovies = resp.movies;
      totalPages = Math.ceil(resp.totalPages); // Removed artificial limit
    } else if (q) {
      const resp = await searchMovies(
        q, 
        filterState.page, 
        filterState.perPage // This is now being used
      );
      pageMovies = resp.movies;
      totalPages = Math.ceil(resp.totalPages); // Removed artificial limit
    }

    lastMovies = pageMovies;
    renderResults(pageMovies);

    // Pagination controls
    if (totalPages > 1) {
      renderPager(filterState.page, totalPages);
    } else {
      $("#pagination").empty();
    }

    annotateTmdbDetails(pageMovies);
  } catch (err) {
    console.error("Search error:", err);
    showNotification("Couldn't load results. Please try again.", true);
  }
}

export function annotateTmdbDetails(arr) {
  arr.forEach(async (m) => {
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

  $c.attr("data-genre", detail.genres.map((g) => g.name).join(","))
    .attr(
      "data-country",
      detail.production_countries.map((c) => c.name).join(",")
    )
    .attr("data-rating", detail.vote_average)
    .attr("data-votes", detail.vote_count);

  const { yearFrom, yearTo, country: cCode, genres: reqIds } = filterState;
  let ok = true;
  const y = parseInt($c.attr("data-year"), 10);
  if (yearFrom && y < yearFrom) ok = false;
  if (yearTo && y > yearTo) ok = false;

  if (cCode) {
    const list = ($c.attr("data-country") || "").split(",");
    if (!list.includes(countryMap[cCode])) ok = false;
  }

  if (reqIds.length) {
    const have = ($c.attr("data-genre") || "").split(",");
    const want = reqIds.map((i) => genreRev[i]);
    if (!want.every((g) => have.includes(g))) ok = false;
  }

  $c.toggle(ok);

  if (filterState.sortBy) {
    const visible = $("#results .result-card:visible").toArray();
    visible.sort((a, b) => {
      const A = $(a),
        B = $(b);
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

function renderResults(movies) {
  $("#results").empty();

  if (!movies || movies.length === 0) {
    $("#results").html('<div class="no-results">No movies found</div>');
    return;
  }

  const favorites = Favorites.get(); // Changed from getAll()

  const movieCards = movies.map((movie) => {
    const releaseYear = movie.release_date?.substring(0, 4) || "N/A";
    const posterPath = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "./assets/image/no-image.jpg";

    const isFavorited = favorites.some(
      (fav) =>
        (fav.id && fav.id === movie.id) ||
        (fav.imdbID && fav.imdbID === movie.id)
    );

    return `
      <div class="result-card" data-id="${movie.id}" data-year="${releaseYear}">
        <img src="${posterPath}" 
             alt="${movie.title}" 
             class="movie-poster"
             onerror="this.onerror=null;this.src='./assets/image/no-image.jpg'"
             loading="lazy">
        <div class="movie-info">
          <h3 class="title">${movie.title}</h3>
          <div class="details">
            <span class="year">${releaseYear}</span>
            <span class="rating">⭐ ${
              movie.vote_average?.toFixed(1) || "N/A"
            }</span>
          </div>
          <button class="add-fav ${isFavorited ? "added" : ""}" 
                  data-movie-id="${movie.id}"
                  ${isFavorited ? "disabled" : ""}>
            ${isFavorited ? "✓ Added" : "❤ Add to Favorites"}
          </button>
        </div>
      </div>
    `;
  });

  $("#results").append(movieCards);
}

function fetchOMDB(imdbID) {
  return $.getJSON(OMDB_API_URL, {
    apikey: OMDB_API_KEY,
    i: imdbID,
    plot: "full",
  });
}

async function fetchYouTubeTrailer(title) {
  if (trailerCache[title]) return trailerCache[title];

  const yt = await $.getJSON("https://www.googleapis.com/youtube/v3/search", {
    part: "snippet",
    type: "video",
    maxResults: 1,
    q: `${title} official trailer`,
    key: YT_API_KEY,
  });

  const vid = yt.items?.[0]?.id.videoId || null;
  let emb = false;

  if (vid) {
    const st = await $.getJSON("https://www.googleapis.com/youtube/v3/videos", {
      part: "status",
      id: vid,
      key: YT_API_KEY,
    });
    emb = st.items?.[0]?.status.embeddable || false;
  }

  trailerCache[title] = { videoId: vid, embeddable: emb };
  return trailerCache[title];
}
