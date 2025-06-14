// filters.js

import { applyFilterTranslations, translations } from "./lang.js";

// Export an object to keep track of all filter‐state.
// Other modules (e.g. search.js) may read filterState.* to know how to query TMDB.
export let filterState = {
  yearFrom: null,
  yearTo:   null,
  sortBy:   null,
  country:  null,
  genres:   [],
  page:     1,  
};

export let genreRev   = {};
export let countryMap = {};


function buildSortMenu() {
  $("#sort-button").text(translations[window.currentLang].sortByLabel);

  $("#sort-list").empty();

  const options = [
    { value: "original_title.asc", label: translations[window.currentLang].sortTitleAZ },
    { value: "vote_average.desc", label: translations[window.currentLang].sortHighestRated },
    { value: "vote_average.asc", label: translations[window.currentLang].sortLowestRated },
  ];

  options.forEach(opt => {
 
    const $li = $(`<li data-sort="${opt.value}">${opt.label}</li>`);
    $("#sort-list").append($li);
  });
}

/**
 * Whenever the user clicks on “Sort by ▾” or picks one of the <li> items,
 * we update filterState.sortBy and then invoke onFiltersChangedCallback().
 */
export function initFilters(onFiltersChangedCallback) {
  // First, populate the sort menu in the initial language:
  buildSortMenu();

  // Whenever the user clicks anywhere outside a dropdown, close all dropdown‐menus:
  function closeAllDropdowns() {
    $(".dropdown-menu").hide();
  }
  $(document).on("click", closeAllDropdowns);

  // ─────────────────────────────────────────────
  // Year‐range inputs:
  // ─────────────────────────────────────────────
  $("#year-from, #year-to").on("input", () => {
    filterState.yearFrom = parseInt($("#year-from").val()) || null;
    filterState.yearTo   = parseInt($("#year-to").val())   || null;
    filterState.page     = 1;
    onFiltersChangedCallback();
  });

  // ─────────────────────────────────────────────
  // Sort‐by button & list clicks
  // ─────────────────────────────────────────────
  $("#sort-button").on("click", e => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#sort-list").toggle();
  });

  $("#sort-list").on("click", "li", function() {
    filterState.sortBy = $(this).data("sort");
    $("#sort-button").text(`Sort: ${$(this).text()} ▾`);
    filterState.page = 1;
    onFiltersChangedCallback();
  });

  $("#country-button").on("click", e => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#country-list").toggle();
  });
  $("#country-list").on("click", "li", function() {
    $("#country-list li").removeClass("active");
    $(this).addClass("active");
    filterState.country = $(this).data("code");
    $("#country-button").text(`Country: ${$(this).text()} ▾`);
    filterState.page = 1;
    onFiltersChangedCallback();
  });

  $("#genre-button-2").on("click", e => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#genre-list-2").toggle();
  });
  $("#genre-list-2").on("click", "li", function() {
    $(this).toggleClass("active");
    filterState.genres = $("#genre-list-2 li.active")
      .map((i, el) => $(el).data("id"))
      .get();

    const names = filterState.genres.map(id => genreRev[id]);
    let label;
    if (names.length === 0) {
      label = "Genre ▾";
    } else if (names.length <= 2) {
      label = `Genre: ${names.join(", ")} ▾`;
    } else {
      const firstTwo = names.slice(0, 2).join(", ");
      label = `Genre: ${firstTwo} +${names.length - 2} more ▾`;
    }
    $("#genre-button-2").text(label);

    filterState.page = 1;
    onFiltersChangedCallback();
  });

  $("#clear-filters").on("click", () => {
    filterState = {
      yearFrom: null,
      yearTo:   null,
      sortBy:   null,
      country:  null,
      genres:   [],
      page:     1,
    };
    $("#year-from, #year-to").val("");
    $("#sort-button").text(translations[window.currentLang].sortByLabel);
    $("#sort-list li").removeClass("active");
    $("#country-button").text("Country ▾");
    $("#country-list li").removeClass("active");
    $("#genre-button-2").text("Genre ▾");
    $("#genre-list-2 li").removeClass("active");
    onFiltersChangedCallback();
  });
}


export function translateFilters() {
  buildSortMenu();

  if (typeof applyFilterTranslations === "function") {
    applyFilterTranslations(window.currentLang);
  }
}
