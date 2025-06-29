import { reloadResults, initSearch } from "./search.js";
import { initBrowse, translateBrowseTabs } from "./browse.js";
import { initFilters, filterState, genreRev, countryMap } from "./filters.js";
import { Favorites } from "./favorites.js";
import { applyTranslations } from "./lang.js";
import { MovieModal } from "./modal.js";
import { fetchGenres, fetchCountries } from "./tmdbServices.js";
import { Results } from "./results.js";
import { buildGenreListItem, buildCountryListItem } from "./uiHelpers.js";

$(function() {
  // Initialize language
  window.currentLang = localStorage.getItem("language") || "en";
  applyTranslations(window.currentLang);

  // Load initial data
  (async function loadInitialData() {
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
  })();

  // Initialize filters
  initFilters(() => {
    filterState.page = 1;
    reloadResults();
  });

  // Category display
  function showOnlyCategory(catKey) {
    $(".category-carousel").hide();
    $(`.category-carousel[data-cat="${catKey}"]`).show();
  }
  initBrowse(showOnlyCategory);
  initSearch();

  // Favorites dropdown
  $("#favorites-button").on("click", e => {
    e.stopPropagation();
    $(".favorites-dropdown").toggleClass("open");
    if ($(".favorites-dropdown").hasClass("open")) {
      Favorites.render();
    }
  });
  
  $(document).on("click", e => {
    if (!$(e.target).closest(".favorites-dropdown").length && 
        !$(e.target).is("#favorites-button")) {
      $(".favorites-dropdown").removeClass("open");
    }
  });

  // Remove favorites
  $("#favorites-list").on("click", ".remove-fav", function(e) {
    e.stopPropagation();
    const imdbID = $(this).closest("li").data("id");
    Favorites.remove(imdbID);
  });

  // Initialize modal
  MovieModal.init();

  // Fixed language switch
  $("#language-switch").on("change", function(e) {
    e.stopPropagation();
    window.currentLang = this.value;
    localStorage.setItem("language", window.currentLang);
    applyTranslations(window.currentLang);
    translateBrowseTabs(showOnlyCategory);
    
    const activeCat = $("#popular-tabs button.active").data("cat") || "topRated";
    showOnlyCategory(activeCat);
    
    Favorites.render();
    
    if ($searchInput.val().trim()) {
      reloadResults();
    }
    
    if (MovieModal.rerender) {
      MovieModal.rerender();
    }
  });

  // Results component
  const resultsComponent = Results("#results", movieId => {
    MovieModal.showByTmdbId(movieId);
  });
  resultsComponent.init();

  // Initialize first category
  $(".category-carousel").hide();
  showOnlyCategory("topRated");

  // Movies per page selector
  $("#per-page-selector").on("change", function() {
    filterState.perPage = parseInt($(this).val());
    filterState.page = 1;
    reloadResults();
  });
});
