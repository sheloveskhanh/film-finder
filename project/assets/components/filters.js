// assets/components/filters.js

import {
  applyFilterTranslations
} from "./lang.js";

export let filterState = {
  yearFrom: null,
  yearTo:   null,
  sortBy:   null,
  country:  null,
  genres:   [],
  page:     1,   // this “UI page” gets used by search/discover
};

// `genreRev` & `countryMap` will be populated by fetchGenres/fetchCountries in main.js
export let genreRev   = {};
export let countryMap = {};

export function initFilters(onFiltersChangedCallback) {
  // onFiltersChangedCallback() should be a function that reloads search/discover results

  function closeAllDropdowns() {
    $(".dropdown-menu").hide();
  }
  $(document).on("click", closeAllDropdowns);

  // Year inputs
  $("#year-from, #year-to").on("input", () => {
    filterState.yearFrom = parseInt($("#year-from").val()) || null;
    filterState.yearTo   = parseInt($("#year-to").val())   || null;
    filterState.page     = 1;
    onFiltersChangedCallback();
  });

  // Sort‐by button
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

  // Country button
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

  // Genre button
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
    if      (names.length === 0)          label = "Genre ▾";
    else if (names.length <= 2)           label = `Genre: ${names.join(", ")} ▾`;
    else {
      const firstTwo = names.slice(0, 2).join(", ");
      label = `Genre: ${firstTwo} +${names.length-2} more ▾`;
    }
    $("#genre-button-2").text(label);

    filterState.page = 1;
    onFiltersChangedCallback();
  });

  // Clear all filters
  $("#clear-filters").on("click", () => {
    filterState = {
      yearFrom: null,
      yearTo:   null,
      sortBy:   null,
      country:  null,
      genres:   [],
      page:     1,
    };
    $("#year-from,#year-to").val("");
    $("#sort-button").text("Sort by ▾");
    $("#sort-list li").removeClass("active");
    $("#country-button").text("Country ▾");
    $("#country-list li").removeClass("active");
    $("#genre-button-2").text("Genre ▾");
    $("#genre-list-2 li").removeClass("active");
    onFiltersChangedCallback();
  });
}

// A helper to reapply translations to all filter labels/placeholders when language changes
export function translateFilters() {
  if (typeof applyFilterTranslations === "function") {
    applyFilterTranslations(window.currentLang);
  }
}
