// project/components/main.js

import {
  fetchGenres,
  fetchCountries,
  searchMovies,
  discoverMovies,
  getMovieDetails,
  fetchCategory,
} from "./tmdbService.js";

import { MovieModal } from "./modal.js";

import {
  buildGenreListItem,
  buildCountryListItem,
  buildSortOptionItem,
  renderBrowseTabs,
  renderPopularList,
  renderResults,
  renderPager,
  renderFavoritesDropdown,
} from "./uiHelpers.js";

import {
  translations,
  applyTranslations,
  applyFilterTranslations,
} from "./lang.js";

$(function () {
  const OMDB_API_URL = "https://www.omdbapi.com/";
  const OMDB_API_KEY = "375878b3";
  const YT_API_KEY = "AIzaSyBuOlxxyBOae6n3322Q1CCmf6t5pScyqA";

  let filterState = {
    yearFrom: null,
    yearTo: null,
    sortBy: null,
    country: null,
    genres: [],
    page: 1,
  };

  window.currentLang = "en";
  applyTranslations(currentLang);

  const movieDetailsCache = {};
  const trailerCache = {};

  const $searchInput = $("#search-input");
  const $searchButton = $("#search-button");
  const $results = $("#results");
  const $pagination = $('<div id="pagination"></div>').insertAfter($results);
  const $favButton = $("#favorites-button");
  const $favList = $("#favorites-list");
  const $clearFilters = $("#clear-filters");

  const genreRev = {};
  const countryMap = {};

  (async function loadInitialData() {
    try {
      const genres = await fetchGenres();
      genres.forEach((g) => {
        genreRev[g.id] = g.name;
        $("#genre-list-2").append(buildGenreListItem(g));
      });

      const countries = await fetchCountries();
      countries.forEach((c) => {
        countryMap[c.iso_3166_1] = c.english_name;
        $("#country-list").append(buildCountryListItem(c));
      });
    } catch (err) {
      console.error("Failed to load initial TMDB data:", err);
    }
  })();

  const sortOptions = [
    { value: "original_title.asc", label: "Title (A–Z)" },
    { value: "vote_average.desc", label: "Highest Rated" },
    { value: "vote_average.asc", label: "Lowest Rated" },
  ];
  sortOptions.forEach((o) => {
    $("#sort-list").append(buildSortOptionItem(o));
  });

  function closeAllDropdowns() {
    $(".dropdown-menu").hide();
  }
  $(document).on("click", closeAllDropdowns);

  //------------- 4) FILTER INPUT HANDLERS -------------
  $("#year-from, #year-to").on("input", () => {
    filterState.yearFrom = parseInt($("#year-from").val()) || null;
    filterState.yearTo = parseInt($("#year-to").val()) || null;
    filterState.page = 1;
    reloadResults();
  });

  $("#sort-button").on("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#sort-list").toggle();
  });
  $("#sort-list").on("click", "li", function () {
    filterState.sortBy = $(this).data("sort");
    $("#sort-button").text(`Sort: ${$(this).text()} ▾`);
    filterState.page = 1;
    reloadResults();
  });

  $("#country-button").on("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#country-list").toggle();
  });
  $("#country-list").on("click", "li", function () {
    $("#country-list li").removeClass("active");
    $(this).addClass("active");
    filterState.country = $(this).data("code");
    $("#country-button").text(`Country: ${$(this).text()} ▾`);
    filterState.page = 1;
    reloadResults();
  });

  $("#genre-button-2").on("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#genre-list-2").toggle();
  });
  $("#genre-list-2").on("click", "li", function () {
    $(this).toggleClass("active");
    filterState.genres = $("#genre-list-2 li.active")
      .map((i, el) => $(el).data("id"))
      .get();

    const names = filterState.genres.map((id) => genreRev[id]);
    let label;
    if (names.length === 0) label = "Genre ▾";
    else if (names.length <= 2) label = `Genre: ${names.join(", ")} ▾`;
    else {
      const firstTwo = names.slice(0, 2).join(", ");
      label = `Genre: ${firstTwo} +${names.length - 2} more ▾`;
    }
    $("#genre-button-2").text(label);
    filterState.page = 1;
    reloadResults();
  });

  $clearFilters.on("click", () => {
    filterState = {
      yearFrom: null,
      yearTo: null,
      sortBy: null,
      country: null,
      genres: [],
      page: 1,
    };
    $("#year-from,#year-to").val("");
    $("#sort-button").text("Sort by ▾");
    $("#sort-list li").removeClass("active");
    $("#country-button").text("Country ▾");
    $("#country-list li").removeClass("active");
    $("#genre-button-2").text("Genre ▾");
    $("#genre-list-2 li").removeClass("active");
    reloadResults();
  });

  //------------- 5) FAVORITES LOGIC -------------
  const Favorites = {
    add(movieObj, callback) {
      const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
      if (!favs.some((m) => m.imdbID === movieObj.imdbID)) {
        favs.push(movieObj);
        localStorage.setItem("favorites", JSON.stringify(favs));
      }
      if (typeof callback === "function") callback();
    },
    remove(imdbID, callback) {
      let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
      favs = favs.filter((m) => m.imdbID !== imdbID);
      localStorage.setItem("favorites", JSON.stringify(favs));
      if (typeof callback === "function") callback();
    },
    render: renderFavoritesDropdown,
  };

  //------------- 6) LANGUAGE SWITCH -------------
  $("#language-switch").on("change", function () {
    window.currentLang = this.value;
    applyTranslations(currentLang);
    if (typeof applyFilterTranslations === "function") {
      applyFilterTranslations(currentLang);
    }
    renderBrowseTabs(getBrowseTabsConfig(currentLang));
    const activeCat = $("#popular-tabs button.active").data("cat");
    loadAndRenderCategory(activeCat);
    renderFavoritesDropdown();
    if (MovieModal.rerender) MovieModal.rerender();
  });

  function getBrowseTabsConfig(lang) {
    const t = translations[lang];
    return [
      { key: "topRated", label: t.topMovies },
      { key: "upcoming", label: t.incoming },
      { key: "popular", label: t.popularAllTime },
      { key: "nowPlaying", label: t.nowPlaying },
    ];
  }

  function setupBrowseTabs() {
    const tabs = getBrowseTabsConfig(currentLang);
    renderBrowseTabs(tabs);
    tabs.forEach((tab) => {
      loadAndRenderCategory(tab.key);
    });
  }

  async function loadAndRenderCategory(categoryKey) {
    try {
      const movies = await fetchCategory(categoryKey);
      renderPopularList(categoryKey, movies);
    } catch (err) {
      console.error(`Failed to load ${categoryKey}:`, err);
      // Optionally show a small “Could not load” message in that carousel
    }
  }

  $("#popular-tabs").on("click", "button", function () {
    $("#popular-tabs button").removeClass("active");
    $(this).addClass("active");
    const cat = $(this).data("cat");
    loadAndRenderCategory(cat);
  });
  $("#popular-prev").on("click", () => {
    const $list = $("#popular-list");
    $list.animate({ scrollLeft: "-=" + $list.width() }, 400);
  });
  $("#popular-next").on("click", () => {
    const $list = $("#popular-list");
    $list.animate({ scrollLeft: "+=" + $list.width() }, 400);
  });

  async function reloadResults() {
    const q = $searchInput.val().trim();
    const hasFilters = Boolean(
      filterState.yearFrom ||
        filterState.yearTo ||
        filterState.sortBy ||
        filterState.country ||
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
        const { movies, totalPages } = await discoverMovies(
          filterState,
          filterState.page
        );
        renderResults(movies);
        renderPager(filterState.page, totalPages);
        annotateTmdbDetails(movies);
      }
    } catch (err) {
      console.error("Error during reloadResults():", err);
    }
  }

  function annotateTmdbDetails(movieArray) {
    movieArray.forEach(async (m) => {
      if (movieDetailsCache[m.id]) {
        applyFiltersToCard(m.id, movieDetailsCache[m.id]);
        return;
      }
      try {
        const detail = await getMovieDetails(m.id);
        movieDetailsCache[m.id] = detail;
        applyFiltersToCard(m.id, detail);
      } catch (err) {
        console.error(`Could not fetch details for TMDB ID ${m.id}:`, err);
      }
    });
  }

  function applyFiltersToCard(tmdbId, detail) {
    const $card = $results.find(`.result-card[data-tmdb-id="${tmdbId}"]`);
    if (!$card.length) return;

    const genres = detail.genres.map((g) => g.name).join(", ");
    const country = detail.production_countries.map((c) => c.name).join(", ");
    $card
      .attr("data-genre", genres)
      .attr("data-country", country)
      .attr("data-rating", detail.vote_average)
      .attr("data-votes", detail.vote_count)
      .attr("data-imdb-id", detail.external_ids?.imdb_id || "");

    const yearFrom = filterState.yearFrom,
      yearTo = filterState.yearTo,
      countryCode = filterState.country,
      reqGenres = filterState.genres.map((id) => genreRev[id]);

    let ok = true;
    const cardYear = parseInt($card.attr("data-year"), 10);
    if (yearFrom && cardYear < yearFrom) ok = false;
    if (yearTo && cardYear > yearTo) ok = false;

    if (countryCode) {
      const mc = ($card.attr("data-country") || "")
        .split(",")
        .map((s) => s.trim());
      if (!mc.includes(countryMap[countryCode])) ok = false;
    }

    if (reqGenres.length) {
      const mg = ($card.attr("data-genre") || "")
        .split(",")
        .map((s) => s.trim());
      if (!reqGenres.every((g) => mg.includes(g))) ok = false;
    }

    $card.toggle(ok);

    if (filterState.sortBy) {
      const visible = $results.find(".result-card:visible").toArray();
      visible.sort((a, b) => {
        const $A = $(a),
          $B = $(b);
        switch (filterState.sortBy) {
          case "original_title.asc":
            return $A
              .find(".title")
              .text()
              .localeCompare($B.find(".title").text());
          case "vote_average.desc":
            return (
              parseFloat($B.attr("data-rating")) -
              parseFloat($A.attr("data-rating"))
            );
          case "vote_average.asc":
            return (
              parseFloat($A.attr("data-rating")) -
              parseFloat($B.attr("data-rating"))
            );
          case "vote_count.desc":
            return (
              parseInt($B.attr("data-votes"), 10) -
              parseInt($A.attr("data-votes"), 10)
            );
          default:
            return 0;
        }
      });
      $results.append(visible);
    }
  }

  $pagination.on("click", "button", function () {
    const p = $(this).data("page");
    if (p) {
      filterState.page = p;
      reloadResults();
    }
  });

  $searchButton.on("click", () => {
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
  $searchInput.on("input", function () {
    const q = $(this).val().trim();
    if (!q) {
      $results.empty();
      $pagination.empty();
    }
  });

  $results.on("click", ".add-fav", function (e) {
    e.stopPropagation();
    const $card = $(this).closest(".result-card");
    const imdbID = $card.attr("data-imdb-id");
    const title = $card.find(".title").text();
    if (!imdbID) {
      alert(
        "Please wait a moment for details to load before adding to favorites."
      );
      return;
    }
    Favorites.add({ imdbID, Title: title }, renderFavoritesDropdown);
  });

  $favButton.on("click", (e) => {
    e.stopPropagation();
    $(".favorites-dropdown").toggleClass("open");
  });
  $(document).on("click", (e) => {
    if (!$(e.target).closest(".favorites-dropdown").length) {
      $(".favorites-dropdown").removeClass("open");
    }
  });

  $favList.on("click", ".remove-fav", function (e) {
    e.stopPropagation();
    const id = $(this).closest("li").data("id");
    Favorites.remove(id, renderFavoritesDropdown);
  });

  $results.on("click", ".result-card", async function (e) {
    if ($(e.target).is(".add-fav")) return;

    const $card = $(this);
    const tmdbId = $card.attr("data-tmdb-id");

    // 1) Fetch TMDB detail if not cached
    let detail;
    if (movieDetailsCache[tmdbId]) {
      detail = movieDetailsCache[tmdbId];
    } else {
      MovieModal.showLoading();
      try {
        detail = await getMovieDetails(tmdbId);
        movieDetailsCache[tmdbId] = detail;
      } catch (err) {
        console.error("TMDB detail fetch failed:", err);
        MovieModal.showError("Could not load movie details.");
        return;
      }
    }

    // 2) Check IMDb ID
    const imdbID = detail.external_ids?.imdb_id;
    if (!imdbID) {
      MovieModal.showTMDBOnly(detail);
      return;
    }

    // 3) Show loading while calling OMDB + YouTube
    MovieModal.showLoading();

    try {
      // 4) Fetch OMDB data
      const omdbData = await new Promise((resolve, reject) => {
        $.getJSON(
          "https://www.omdbapi.com/",
          { apikey: OMDB_API_KEY, i: imdbID, plot: "full" },
          (md) => resolve(md)
        ).fail((_, status, err) => reject(err));
      });

      // 5) Fetch YouTube trailer (pass raw string to q:)
      const rawQuery = omdbData.Title + " official trailer";
      const ytSearch = await new Promise((resolve, reject) => {
        $.getJSON(
          "https://www.googleapis.com/youtube/v3/search",
          {
            part: "snippet",
            type: "video",
            maxResults: 1,
            q: rawQuery, // no encodeURIComponent
            key: YT_API_KEY,
          },
          (ytData) => resolve(ytData)
        ).fail((_, status, err) => reject(err));
      });

      const videoId = ytSearch.items?.[0]?.id.videoId || null;
      let embeddable = false;
      if (videoId) {
        const statusData = await new Promise((resolve, reject) => {
          $.getJSON(
            "https://www.googleapis.com/youtube/v3/videos",
            { part: "status", id: videoId, key: YT_API_KEY },
            (sd) => resolve(sd)
          ).fail((_, status, err) => reject(err));
        });
        embeddable = statusData.items?.[0]?.status.embeddable || false;
      }

      // 6) Finally show full modal
      MovieModal.show(omdbData, videoId, embeddable);
    } catch (err) {
      console.error("OMDB or YouTube fetch failed:", err);
      MovieModal.showError(
        "Failed to load movie details. Please try again later."
      );
    }
  });

  $("#popular-list").on("click", ".pop-card", async function (e) {
    const $card = $(this);
    const tmdbId = $card.attr("data-id");

    // 1) Fetch TMDB detail if not cached
    let detail;
    if (movieDetailsCache[tmdbId]) {
      detail = movieDetailsCache[tmdbId];
    } else {
      MovieModal.showLoading();
      try {
        detail = await getMovieDetails(tmdbId);
        movieDetailsCache[tmdbId] = detail;
      } catch (err) {
        console.error("TMDB detail fetch failed:", err);
        MovieModal.showError("Could not load movie details.");
        return;
      }
    }

    // 2) Check IMDb ID
    const imdbID = detail.external_ids?.imdb_id;
    if (!imdbID) {
      MovieModal.showTMDBOnly(detail);
      return;
    }

    // 3) Show loading while calling OMDB + YouTube
    MovieModal.showLoading();

    try {
      // 4) Fetch OMDB data
      const omdbData = await new Promise((resolve, reject) => {
        $.getJSON(
          OMDB_API_URL,
          { apikey: OMDB_API_KEY, i: imdbID, plot: "full" },
          (md) => resolve(md)
        ).fail((_, status, err) => reject(err));
      });

      // 5) Fetch YouTube trailer (PASS RAW STRING, no encodeURIComponent)
      const rawQuery = omdbData.Title + " official trailer";
      const ytSearch = await new Promise((resolve, reject) => {
        $.getJSON(
          "https://www.googleapis.com/youtube/v3/search",
          {
            part: "snippet",
            type: "video",
            maxResults: 1,
            q: rawQuery, // jQuery will encode this once
            key: YT_API_KEY,
          },
          (ytData) => resolve(ytData)
        ).fail((_, status, err) => reject(err));
      });

      const videoId = ytSearch.items?.[0]?.id.videoId || null;
      let embeddable = false;
      if (videoId) {
        const statusData = await new Promise((resolve, reject) => {
          $.getJSON(
            "https://www.googleapis.com/youtube/v3/videos",
            { part: "status", id: videoId, key: YT_API_KEY },
            (sd) => resolve(sd)
          ).fail((_, status, err) => reject(err));
        });
        embeddable = statusData.items?.[0]?.status.embeddable || false;
      }

      // 6) Finally show full modal
      MovieModal.show(omdbData, videoId, embeddable);
    } catch (err) {
      console.error("OMDB or YouTube fetch failed:", err);
      MovieModal.showError(
        "Failed to load movie details. Please try again later."
      );
    }
  });

  applyTranslations(currentLang);
  setupBrowseTabs();
  Favorites.render(renderFavoritesDropdown);
  MovieModal.init();
  reloadResults();
});
