// assets/components/main.js

import { fetchGenres, fetchCountries } from "./tmdbServices.js";
import { initFilters, filterState }     from "./filters.js";
import { Results }                      from "./results.js";
import { initSearch }                   from "./search.js";
import { initBrowse, translateBrowseTabs } from "./browse.js";
import { Favorites }                    from "./favorites.js";
import { applyTranslations }            from "./lang.js";
import { MovieModal }                   from "./modal.js";

$(function() {
  window.currentLang = "en";
  applyTranslations(window.currentLang);

  // 1) Pre‐load genres & countries for filter dropdowns:
  const genreRev   = {};
  const countryMap = {};
  (async () => {
    try {
      const genres = await fetchGenres();
      genres.forEach(g => {
        genreRev[g.id] = g.name;
        $("#genre-list-2").append(`<li data-id="${g.id}">${g.name}</li>`);
      });
      const countries = await fetchCountries();
      countries.forEach(c => {
        countryMap[c.iso_3166_1] = c.english_name;
        $("#country-list").append(`<li data-code="${c.iso_3166_1}">${c.english_name}</li>`);
      });
    } catch(err) {
      console.error("Failed to load TMDB initial data:", err);
    }
  })();

  // 2) Initialize filters (year, sort, country, genre):
  initFilters(() => {
    filterState.page = 1;
    $(document).trigger("filters:changed");
  });

  // 3) Show/hide category carousels:
  function showOnlyCategory(catKey) {
    $(".category-carousel").hide();
    $(`.category-carousel[data-cat="${catKey}"]`).show();
  }
  initBrowse(showOnlyCategory);

  // 4) Initialize Results component (the search grid):
  const resultsComponent = Results("#results", (movieID) => {
    // “More Info” callback for opening the modal
    // movieID here is the imdbID (or TMDB ID if no imdb_id)
    openMovieModalById(movieID);
  });
  resultsComponent.init();

  // 5) Initialize search logic:
  initSearch();

  // If filters changed, re‐render results (catch custom event)
  $(document).on("filters:changed", () => {
    $(document).trigger("pager:changed", filterState.page);
    // The search.js handler “pager:changed” will then call reloadResults()
  });

  // /favorites dropdown toggle & delete handlers:
  $("#favorites-button").on("click", (e) => {
    e.stopPropagation();
    $(".favorites-dropdown").toggleClass("open");
  });
  $(document).on("click", (e) => {
    if (!$(e.target).closest(".favorites-dropdown").length) {
      $(".favorites-dropdown").removeClass("open");
    }
  });
  // Delegated remove‐favorite click (inside dropdown):
  $("#favorites-list").on("click", ".remove-fav", function(e) {
    e.stopPropagation();
    const imdbID = $(this).closest("li").data("id");
    Favorites.remove(imdbID, () => {
      Favorites.render();
    });
  });

  // 6) Initialize MovieModal
  MovieModal.init();

  // 7) Language switch
  $("#language-switch").on("change", function() {
    window.currentLang = this.value;
    applyTranslations(window.currentLang);
    translateBrowseTabs(showOnlyCategory);
    const activeCat = $("#popular-tabs button.active").data("cat") || "topRated";
    showOnlyCategory(activeCat);
    Favorites.render();
    if (MovieModal.rerender) MovieModal.rerender();
  });

  // 8) Finally, load the very first set of results & show default category:
  $(document).trigger("filters:changed"); // triggers reloadResults via initSearch
  $(".category-carousel").hide();
  showOnlyCategory("topRated");
});
