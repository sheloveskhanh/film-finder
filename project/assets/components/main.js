// main.js

import {
  renderResults,
  renderPager,
  renderFavoritesDropdown,
  renderBrowseTabs,
  renderPopularList,
  buildGenreListItem,
  buildCountryListItem,
  buildSortOptionItem
} from "./uiHelpers.js";

import {
  initSearch,
  reloadResults,
} from "./search.js";

import {
  fetchGenres,
  fetchCountries,
  searchMovies,
  discoverMovies,
  getMovieDetails,
  fetchCategory,
  fetchTrending
} from "./tmdbServices.js";

import {
  initBrowse,
  translateBrowseTabs
} from "./browse.js";

import {
  initFilters,
  filterState
} from "./filters.js";

import { Favorites } from "./favorites.js";

import {
  translations,
  applyTranslations,
  applyFilterTranslations
} from "./lang.js";

import { MovieModal } from "./modalHandler.js";

$(function() {
  // ───────────────────────────────────────────────────────────────
  // 1) Set default language and apply it immediately
  // ───────────────────────────────────────────────────────────────
  window.currentLang = "en";
  applyTranslations(window.currentLang);

  // ───────────────────────────────────────────────────────────────
  // 2) Declare and populate genreRev & countryMap for the filters
  // ───────────────────────────────────────────────────────────────
  const genreRev = {};   // { genreId: genreName, … }
  const countryMap = {}; // { iso_3166_1: english_name, … }

  (async function loadInitialData() {
    try {
      const genres = await fetchGenres();
      genres.forEach(g => {
        genreRev[g.id] = g.name;
        $("#genre-list-2").append(buildGenreListItem(g));
      });

      const countries = await fetchCountries();
      countries.forEach(c => {
        countryMap[c.iso_3166_1] = c.english_name;
        $("#country-list").append(buildCountryListItem(c));
      });
    } catch(err) {
      console.error("Failed to load TMDB initial data:", err);
    }
  })();

  // ───────────────────────────────────────────────────────────────
  // 3) Initialize all filters. Whenever any filter changes, we reload results.
  // ───────────────────────────────────────────────────────────────
  initFilters(() => {
    filterState.page = 1;  // Reset to page 1 whenever filters change
    reloadResults();
  });

  // ───────────────────────────────────────────────────────────────
  // 4) The “showOnlyCategory” callback hides all four carousels, then shows exactly one.
  // ───────────────────────────────────────────────────────────────
  function showOnlyCategory(catKey) {
    $(".category-carousel").hide();
    $(`.category-carousel[data-cat="${catKey}"]`).show();
  }

  // 5) Initialize the Browse/Carousel tabs (Top Rated / Upcoming / Now Playing / Trending)
  initBrowse(showOnlyCategory);

  // 6) Initialize the search area (Search button, Enter key, pagination clicks, etc.)
  initSearch();

  // ───────────────────────────────────────────────────────────────
  // 7) Favorites dropdown toggle & initial rendering
  // ───────────────────────────────────────────────────────────────
  $("#favorites-button").on("click", e => {
    e.stopPropagation();
    $(".favorites-dropdown").toggleClass("open");
  });

  $(document).on("click", e => {
    if (!$(e.target).closest(".favorites-dropdown").length) {
      $(".favorites-dropdown").removeClass("open");
    }
  });

  // Render the current list of favorites on startup
  Favorites.render();

  // ───────────────────────────────────────────────────────────────
  // 8) Initialize MovieModal
  // ───────────────────────────────────────────────────────────────
  MovieModal.init();

  // ───────────────────────────────────────────────────────────────
  // 9) Language‐switch handler:
  //    - Update window.currentLang
  //    - Re‐apply all text through applyTranslations
  //    - Re‐draw Browse tabs via translateBrowseTabs
  //    - Keep the previously active category tab visible
  //    - Re‐render favorites dropdown (in case any text changed)
  //    - Rerender modal if it’s open
  // ───────────────────────────────────────────────────────────────
  $("#language-switch").on("change", function() {
    window.currentLang = this.value;
    applyTranslations(window.currentLang);

    // Re‐render the four Browse‐tab labels under the new language
    translateBrowseTabs(showOnlyCategory);

    // Keep whichever carousel was active (fallback to "topRated" if none).
    const activeCat = $("#popular-tabs button.active").data("cat") || "topRated";
    showOnlyCategory(activeCat);
    // (Optionally, re‐fetch that category if you need to refresh its data.)

    // Re‐render favorites dropdown in the new language (if any text depends on data‐i18n)
    Favorites.render();

    // If the modal is open, rerender it so that its labels update
    if (MovieModal.rerender) MovieModal.rerender();
  });

  // ───────────────────────────────────────────────────────────────
  // 10) Finally, initial load of search results and default category
  // ───────────────────────────────────────────────────────────────
  reloadResults();

  // By default, show “Top Rated” carousel on first load:
  $(".category-carousel").hide();
  showOnlyCategory("topRated");
});
