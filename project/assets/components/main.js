import { Filters } from "./features/filters.js";
import { Favorites } from "./features/favorites.js";
import { Results } from "./features/results.js";
import { MovieModal } from "./features/modal.js";
import { Search } from "./features/search.js";
import { applyTranslations } from "./features/lang.js";
import { fetchSearchResults, fetchMovieDetails } from "./features/tmdbServices.js";
import { initPopular } from "./features/popular.js";

$(function () {
  window.currentLang = "en";
  applyTranslations(window.currentLang);

  // State
  let filterState = {
    yearFrom: null,
    yearTo: null,
    sortBy: null,
    country: null,
    genres: [],
    page: 1,
    query: "",
  };

  const genreRev = {};
  const countryMap = {};

  $.getJSON("https://api.themoviedb.org/3/genre/movie/list", { api_key: "36b0465246018e127b54bfa7d47d965c" }).done(
    (resp) => {
      resp.genres.forEach((g) => {
        genreRev[g.id] = g.name;
        $("#genre-list-2").append(`<li data-id="${g.id}">${g.name}</li>`);
      });

      $.getJSON("https://api.themoviedb.org/3/configuration/countries", {
        api_key: "36b0465246018e127b54bfa7d47d965c",
      }).done((list) => {
        list.forEach((c) => {
          countryMap[c.iso_3166_1] = c.english_name;
          $("#country-list").append(
            `<li data-code="${c.iso_3166_1}">${c.english_name}</li>`
          );
        });

        // Initialize components
        const movieModal = MovieModal;
        Favorites(filterState, reload);

        const results = Results("#results", imdbID => {
          fetchMovieDetails(imdbID).then(({ data, trailerId, embeddable }) => {
            movieModal.show(data, trailerId, embeddable);
          });
        });
        results.init();

        Filters({ filterState, genreRev, countryMap, reload });

        const search = Search("#search-input", "#search-button", query => {
          filterState.query = query;
          filterState.page = 1;
          reload();
        });
        search.init();

        // Language switch
        $("#language-switch").on("change", function () {
          window.currentLang = this.value;
          applyTranslations(window.currentLang);
          reload();
        });

        // Main reload function
        function reload() {
          fetchSearchResults(filterState).then(({ movies, totalPages }) => {
            results.render(movies, filterState.page, totalPages);
            // Optionally, update favorites or other UI here
          });
        }

        reload();

        initPopular($("#popular-tabs"), $("#popular-list"), (tmdbId) => {
          fetchMovieDetails(tmdbId).then(({ data, trailerId, embeddable }) => {
            movieModal.show(data, trailerId, embeddable);
          });
        });
      });
    }
  );
});
