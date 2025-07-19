import { reloadResults, initSearch } from "./search.js";
import { initBrowse, translateBrowseTabs } from "./browse.js";
import { initFilters, filterState, genreRev, countryMap } from "./filters.js";
import { Favorites } from "./favorites.js";
import { applyTranslations } from "./lang.js";
import { MovieModal } from "./modal.js";
import { fetchGenres, fetchCountries } from "./tmdbServices.js";
import { Results } from "./results.js";
import { buildGenreListItem, buildCountryListItem } from "./uiHelpers.js";

$(function () {
  const $searchInput = $("#search-input");
  const $favoritesButton = $("#favorites-button");
  const $favoritesDropdown = $("#favorites-dropdown");
  const $perPageSelector = $("#per-page-selector");

  window.currentLang = localStorage.getItem("language") || "en";
  applyTranslations(window.currentLang);

  (async function loadInitialData() {
    try {
      const [genres, countries] = await Promise.all([
        fetchGenres(),
        fetchCountries(),
      ]);

      genres.forEach((g) => {
        genreRev[g.id] = g.name;
        $("#genre-list-2").append(buildGenreListItem(g));
      });

      countries.forEach((c) => {
        countryMap[c.iso_3166_1] = c.english_name;
        $("#country-list").append(buildCountryListItem(c));
      });
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
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

  $favoritesButton.on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    $favoritesDropdown.toggleClass("open");
    $("body").toggleClass("no-scroll", $favoritesDropdown.hasClass("open"));

    if ($favoritesDropdown.hasClass("open")) {
      Favorites.render();
    }
  });

  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".favorites-wrapper").length &&
      !$(e.target).is("#favorites-button")
    ) {
      $favoritesDropdown.removeClass("open");
      $("body").removeClass("no-scroll");
    }
  });

  $("#favorites-list").on("click", ".remove-fav", function (e) {
    e.stopPropagation();
    const imdbID = $(this).closest("li").data("id");
    Favorites.remove(imdbID);
  });

  MovieModal.init();

  const languageSwitcher = {
    init() {
      this.cacheElements();
      this.bindEvents();
      this.updateCurrentLanguageDisplay();
    },

    cacheElements() {
      this.$trigger = $(".language-trigger");
      this.$dropdown = $(".language-dropdown");
      this.$currentLang = $(".current-language");
      this.$languageOptions = $(".language-dropdown [data-lang]");
    },

    bindEvents() {
      this.$trigger.on("click", (e) => {
        e.stopPropagation();
        const isExpanded = this.$trigger.attr("aria-expanded") === "true";
        this.$trigger.attr("aria-expanded", !isExpanded);
        this.$dropdown.attr("aria-hidden", isExpanded);
      });

      $(document).on("click", () => {
        this.$trigger.attr("aria-expanded", "false");
        this.$dropdown.attr("aria-hidden", "true");
      });

      this.$languageOptions.on("click", (e) => {
        const lang = $(e.currentTarget).data("lang");
        this.changeLanguage(lang);
      });

      $(".language-trigger").on("click", function (e) {
        e.stopPropagation();
        $(".language-dropdown").toggleClass("open");
      });

      $("#favorites-button").on("click", function (e) {
        e.stopPropagation();
        $(".language-dropdown").removeClass("open");
        $("#favorites-dropdown").toggleClass("open");
      });

      $(document).on("click", function () {
        $(".language-dropdown").removeClass("open");
        $("#favorites-dropdown").removeClass("open");
      });
    },

    changeLanguage(lang) {
      window.currentLang = lang;
      localStorage.setItem("language", lang);
      applyTranslations(lang);
      this.updateCurrentLanguageDisplay();

      translateBrowseTabs(showOnlyCategory);
      const activeCat =
        $("#popular-tabs button.active").data("cat") || "topRated";
      showOnlyCategory(activeCat);
      Favorites.render();

      if (MovieModal.rerender) {
        MovieModal.rerender();
      }

      if ($searchInput.val().trim()) {
        reloadResults();
      }
    },

    updateCurrentLanguageDisplay() {
      const langNames = {
        en: "English",
        es: "Español",
        fr: "Français",
        de: "Deutsch",
      };
      this.$currentLang.text(langNames[window.currentLang]);
    },
  };

  languageSwitcher.init();

  const resultsComponent = Results("#results", async (movieId) => {
    try {
      const details = await getMovieDetails(movieId); 
      MovieModal.show(details);
    } catch (error) {
      console.error("Failed to load movie details:", error);
      MovieModal.showError("Couldn't load movie details");
    }
  });
  resultsComponent.init();

  $perPageSelector.on("change", function () {
    filterState.perPage = parseInt($(this).val());
    filterState.page = 1;
    reloadResults();
  });
});
