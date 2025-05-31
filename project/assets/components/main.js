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
  // Cache trailer IDs: { imdbID: videoId }
  const trailerCache = {};

  const $searchInput = $("#search-input");
  const $searchButton = $("#search-button");
  const $results = $("#results");
  const $pagination = $('<div id="pagination"></div>').insertAfter($results);
  const $favButton = $("#favorites-button");
  const $favList = $("#favorites-list");
  const $clearFilters = $("#clear-filters");
  const genreRev = {};       // { genreId: genreName, … }
  const countryMap = {};     // { countryCode: english_name, … }

  //------------- 4) INITIAL LOAD: GENRES & COUNTRIES -------------
  (async function loadInitialData() {
    try {
      const genres = await fetchGenres(); // [ { id, name } … ]
      genres.forEach((g) => {
        genreRev[g.id] = g.name;
        $("#genre-list-2").append(buildGenreListItem(g));
      });

      const countries = await fetchCountries(); // [ { iso_3166_1, english_name } … ]
      countries.forEach((c) => {
        countryMap[c.iso_3166_1] = c.english_name;
        $("#country-list").append(buildCountryListItem(c));
      });
    } catch (err) {
      console.error("Failed to load initial TMDB data:", err);
      // Optionally show an error banner in the UI
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

  //------------- 6) UTILITY: CLOSE DROPDOWNS -------------
  function closeAllDropdowns() {
    $(".dropdown-menu").hide();
  }
  $(document).on("click", closeAllDropdowns);

  //------------- 7) FILTER INPUT HANDLERS -------------
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

  //------------- 8) FAVORITES LOGIC -------------
  // Simple Favorites helper object (mirrors what you had in Favorites.js)
  const Favorites = {
    add(movieObj, callback) {
      const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
      // Prevent duplicates by checking imdbID
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

  //------------- 9) LANGUAGE SWITCH -------------
  $("#language-switch").on("change", function () {
    currentLang = this.value;
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

  // Utility: returns an array like [ { key: "topRated", label: "Top Movies" }, … ]
  function getBrowseTabsConfig(lang) {
    const t = translations[lang];
    return [
      { key: "topRated", label: t.topMovies },
      { key: "upcoming", label: t.incoming },
      { key: "popular", label: t.popularAllTime },
      { key: "nowPlaying", label: t.nowPlaying },
    ];
  }

  //------------- 10) RENDERING BROWSE CAROUSELS -------------
  function setupBrowseTabs() {
    const tabs = getBrowseTabsConfig(currentLang);
    // 1) Render buttons
    renderBrowseTabs(tabs);
    // 2) Load each category into its own container
    tabs.forEach((tab) => {
      loadAndRenderCategory(tab.key);
    });
  }

  async function loadAndRenderCategory(categoryKey) {
    // categoryKey is one of "popular", "topRated", "upcoming", "nowPlaying"
    try {
      const movies = await fetchCategory(categoryKey);
      renderPopularList(categoryKey, movies);
    } catch (err) {
      console.error(`Failed to load ${categoryKey}:`, err);
      // Optionally show a small “Could not load” message in that carousel section
    }
  }

  // Tab click handler
  $("#popular-tabs").on("click", "button", function () {
    $("#popular-tabs button").removeClass("active");
    $(this).addClass("active");
    const cat = $(this).data("cat");
    loadAndRenderCategory(cat);
  });

  // Scroll controls:
  $("#popular-prev").on("click", () => {
    const $list = $("#popular-list");
    $list.animate({ scrollLeft: "-=" + $list.width() }, 400);
  });
  $("#popular-next").on("click", () => {
    const $list = $("#popular-list");
    $list.animate({ scrollLeft: "+=" + $list.width() }, 400);
  });

  //------------- 11) RELOAD SEARCH / FILTERED RESULTS -------------
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
        // Text search
        const { movies, totalPages } = await searchMovies(q, filterState.page);
        renderResults(movies);
        renderPager(filterState.page, totalPages);
        annotateTmdbDetails(movies);
      } else if (hasFilters) {
        // Discover with filters
        const { movies, totalPages } = await discoverMovies(
          filterState,
          filterState.page
        );
        renderResults(movies);
        renderPager(filterState.page, totalPages);
        annotateTmdbDetails(movies);
      }
      // else: empty results (both #results and #pagination are already cleared)
    } catch (err) {
      console.error("Error during reloadResults():", err);
      // Optionally show an error banner: “Couldn’t load search/discover results.”
    }
  }

  function annotateTmdbDetails(movieArray) {
    movieArray.forEach(async (m) => {
      // If we already have cached details for this TMDB ID, just call applyFilters()
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
    // 1. Find the <div class="result-card" data-tmdb-id="...">
    const $card = $results.find(`.result-card[data-tmdb-id="${tmdbId}"]`);
    if (!$card.length) return;

    // 2. Attach data attributes from detail:
    const genres = detail.genres.map((g) => g.name).join(", ");
    const country = detail.production_countries.map((c) => c.name).join(", ");
    $card
      .attr("data-genre", genres)
      .attr("data-country", country)
      .attr("data-rating", detail.vote_average)
      .attr("data-votes", detail.vote_count)
      .attr("data-imdb-id", detail.external_ids?.imdb_id || "");

    // 3. Now run the same filter logic you had before:
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

    // 4. Sorting: if filterState.sortBy is set, we need to re-order the visible cards
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

  //------------- 12) PAGINATION CLICK -------------
  $pagination.on("click", "button", function () {
    const p = $(this).data("page");
    if (p) {
      filterState.page = p;
      reloadResults();
    }
  });

  //------------- 13) SEARCH INPUT / BUTTON -------------
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

  //------------- 14) ADD / REMOVE FAVORITES -------------
  $results.on("click", ".add-fav", function (e) {
    e.stopPropagation();
    const $card = $(this).closest(".result-card");
    const imdbID = $card.attr("data-imdb-id");
    const title = $card.find(".title").text();
    // If detail hasn’t returned yet, imdbID might be empty:
    if (!imdbID) {
      alert("Please wait a moment for details to load before adding to favorites.");
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

  //------------- 15) CARD CLICK → OPEN MODAL -------------
  $results.on("click", ".result-card", async function (e) {
    if ($(e.target).is(".add-fav")) return; // ignore if they clicked the “Add to fav” button
    const imdbID = $(this).attr("data-imdb-id");
    if (!imdbID) {
      alert("Still loading details… please try again in a second.");
      return;
    }

    try {
      // 1) Fetch from OMDB
      const omdbData = await new Promise((resolve, reject) => {
        $.getJSON(
          OMDB_API_URL,
          { apikey: OMDB_API_KEY, i: imdbID, plot: "full" },
          (md) => resolve(md)
        ).fail((_, status, err) => reject(err));
      });

      // 2) Look for trailer: check cache first
      let vid = trailerCache[imdbID];
      let embeddable = false;
      if (!vid) {
        const query = encodeURIComponent(omdbData.Title + " official trailer");
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
            (data) => resolve(data)
          ).fail((_, status, err) => reject(err));
        });
        vid = ytSearch.items?.[0]?.id.videoId;
        if (vid) {
          trailerCache[imdbID] = vid;
          // Check embeddable
          const statusResp = await new Promise((resolve, reject) => {
            $.getJSON(
              "https://www.googleapis.com/youtube/v3/videos",
              { part: "status", id: vid, key: YT_API_KEY },
              (data) => resolve(data)
            ).fail((_, status, err) => reject(err));
          });
          embeddable = statusResp.items?.[0]?.status.embeddable;
        }
      } else {
        // We already have a cached vid, so re-check embeddable:
        const statusResp = await new Promise((resolve, reject) => {
          $.getJSON(
            "https://www.googleapis.com/youtube/v3/videos",
            { part: "status", id: vid, key: YT_API_KEY },
            (data) => resolve(data)
          ).fail((_, status, err) => reject(err));
        });
        embeddable = statusResp.items?.[0]?.status.embeddable;
      }

      MovieModal.show(omdbData, vid, embeddable);
    } catch (err) {
      console.error("Error opening modal for IMDb ID", imdbID, err);
      alert("Failed to load movie details. Please try again later.");
    }
  });

  applyTranslations(currentLang);
  setupBrowseTabs();
  Favorites.render(renderFavoritesDropdown);
  MovieModal.init();
  reloadResults();
});
