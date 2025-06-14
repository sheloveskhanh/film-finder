import { reloadResults, initSearch }  from "./search.js";
import { initBrowse, translateBrowseTabs } from "./browse.js";
import { initFilters, filterState, genreRev, countryMap } from "./filters.js";

import { Favorites }       from "./favorites.js";
import { applyTranslations } from "./lang.js";
import { MovieModal }       from "./modal.js";
import { fetchGenres, fetchCountries } from "./tmdbServices.js";
import { Results }          from "./results.js";
import { buildGenreListItem, buildCountryListItem } from "./uiHelpers.js";

$(function() {
  window.currentLang = "en";
  applyTranslations(window.currentLang);

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

  initFilters(() => {
    filterState.page = 1;
    reloadResults();
  });

  function showOnlyCategory(catKey) {
    $(".category-carousel").hide();
    $(`.category-carousel[data-cat="${catKey}"]`).show();
  }
  initBrowse(showOnlyCategory);
  initSearch();

  $("#favorites-button").on("click", e => {
    e.stopPropagation();
    $(".favorites-dropdown").toggleClass("open");
  });
  $(document).on("click", e => {
    if (!$(e.target).closest(".favorites-dropdown").length) {
      $(".favorites-dropdown").removeClass("open");
    }
  });
  Favorites.render();
  $("#favorites-list").on("click", ".remove-fav", function(e) {
    e.stopPropagation();
    const imdbID = $(this).closest("li").data("id");
    Favorites.remove(imdbID, () => Favorites.render());
  });

  MovieModal.init();

  $("#language-switch").on("change", function() {
    window.currentLang = this.value;
    applyTranslations(window.currentLang);
    translateBrowseTabs(showOnlyCategory);
    const activeCat = $("#popular-tabs button.active").data("cat") || "topRated";
    showOnlyCategory(activeCat);
    Favorites.render();
    if (MovieModal.rerender) MovieModal.rerender();
  });

  const resultsComponent = Results("#results", movieId => {
    console.log("Card clicked with ID:", movieId);
    MovieModal.showByTmdbId(movieId);
  });
  resultsComponent.init();

  $(".category-carousel").hide();
  showOnlyCategory("topRated");
});
