import { Favorites } from "./features/favorites.js";
import { Filters } from "./features/filters.js";
import {
  initLangSwitch,
  applyTranslations,
  translations,
} from "./features/lang.js";
import { MovieModal } from "./features/modal.js";
import { renderPagination, Pagination } from "./features/pagination.js";
import { initPopular } from "./features/popular.js";
import { Results } from "./features/results.js";
import { Search } from "./features/search.js";

import {
  fetchSearchResults,
  fetchMovieDetails,
} from "./config/tmdbServices.js";

$(function () {
  window.currentLang = "en";

  const state = {
    page: 1,
    query: "",
    yearFrom: null,
    yearTo: null,
    sortBy: null,
    country: null,
    genres: [],
  };

  initLangSwitch("#language-switch", (newLang) => {
    window.currentLang = newLang;
    applyTranslations(newLang);
    renderBrowseTabs();
    reload();
  });

  const favorites = Favorites();

  function handleRemove(id) {
    favorites.remove(id, () => {
      favorites.render(handleRemove);
    });
  }

  $("#favorites-button").on("click", function () {
    $("#favorites-list").show();
    favorites.render(handleRemove);
  });

  Filters({
    yearFromInput: "#year-from",
    yearToInput: "#year-to",
    sortButton: "#sort-button",
    sortList: "#sort-list",
    countryButton: "#country-button",
    countryList: "#country-list",
    genreButton: "#genre-button-2",
    genreList: "#genre-list-2",
    clearButton: "#clear-filters",
    onChange: () => {
      state.page = 1;
      state.yearFrom = +$("#year-from").val() || null;
      state.yearTo = +$("#year-to").val() || null;
      state.sortBy = $("#sort-list li.active").data("sort") || null;
      state.country = $("#country-list li.active").data("code") || null;
      state.genres = $("#genre-list-2 li.active")
        .map((i, el) => $(el).data("id"))
        .get();
      reload();
    },
  });

  $(document).on("click", function (e) {
    if (
      !$(e.target).closest("#favorites-list").length &&
      !$(e.target).is("#favorites-button")
    ) {
      $("#favorites-list").hide();
    }
  });

  // Initialize Search component
  const search = Search();
  search.init();

  // Listen for search events
  $(document).on("search:changed", (e, data) => {
    state.query = data.query;
    state.page = data.page;
    reload();
  });

  const results = Results("#results", (imdbID) => {
    fetchMovieDetails(imdbID).then(({ data, trailerId, embeddable }) => {
      MovieModal.show(data, trailerId, embeddable);
    });
  });
  results.init();

  renderPagination("#pagination", state.page, 1);
  Pagination("#pagination", (newPage) => {
    state.page = newPage;
    reload();
  });

  initPopular($("#popular-tabs"), $("#popular-list"), (tmdbId) => {
    fetchMovieDetails(tmdbId).then(({ data, trailerId, embeddable }) => {
      MovieModal.show(data, trailerId, embeddable);
    });
  });

  function renderBrowseTabs() {
    const t = translations[window.currentLang];
    const tabs = [
      { key: "top_rated", label: t.topMovies },
      { key: "upcoming", label: t.incoming },
      { key: "popular", label: t.popularAllTime },
      { key: "now_playing", label: t.nowPlaying },
    ];
    $("#popular-tabs").html(
      tabs
        .map(
          (tab, i) =>
            `<button data-cat="${tab.key}"${i === 0 ? ' class="active"' : ""}>${
              tab.label
            }</button>`
        )
        .join("")
    );
  }

  function reload() {
    const hasQuery = Boolean(state.query);
    const hasFilters = Boolean(
      state.yearFrom ||
        state.yearTo ||
        state.sortBy ||
        state.country ||
        state.genres.length
    );
    $("#popular-section").toggle(!hasQuery && !hasFilters);

    if (hasQuery || hasFilters) {
      fetchSearchResults(state).then(({ movies, totalPages }) => {
        results.render(movies, state.page, totalPages);
        renderPagination("#pagination", state.page, totalPages);
      });
    } else {
      $("#results, #pagination").empty();
    }
  }

  renderBrowseTabs();
  applyTranslations(window.currentLang);
  reload();

  $(document).on("card:clicked", function (e, imdbID) {
    fetchMovieDetails(imdbID).then(({ data, trailerId, embeddable }) => {
      MovieModal(data, trailerId, embeddable);
    });
  });
});
