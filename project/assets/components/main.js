import MovieModal from './components/modal.js';
import { initLangSwitch } from './features/lang.js';
import { initFavorites } from './features/favorites.js';
import { initFilters, applyFilterTranslations } from './features/filters.js';
import { initSearch } from './features/search.js';
import { initResults } from './features/results.js';
import { initPagination } from './features/pagination.js';
import { initPopular } from './features/popular.js';

// TMDB / OMDB back-end
import { fetchMovieDetails, fetchTrailerInfo } from './components/config/tmdb.js';

$(function() {
  // --- global state --------------------------------------------------------
  window.currentLang = 'en';
  let state = { page: 1, query: '', yearFrom: null, yearTo: null, sortBy: null, country: null, genres: [] };

  // --- initialize all components ------------------------------------------

  // 1) modal (no DOM selectors needed here)
  MovieModal.init();

  // 2) language switcher
  initLangSwitch('#language-switch', newLang => {
    window.currentLang = newLang;
    applyFilterTranslations(newLang);
    applyTranslations(newLang);
    // re-render everything in the new language
    renderBrowseTabs();
    reload();
    MovieModal.rerender();
  });

  // 3) favorites dropdown
  initFavorites('#favorites-button', '#favorites-list');

  // 4) filters (year / sort / country / genre / clear)
  initFilters({
    yearFromInput: '#year-from',
    yearToInput:   '#year-to',
    sortButton:    '#sort-button',
    sortList:      '#sort-list',
    countryButton: '#country-button',
    countryList:   '#country-list',
    genreButton:   '#genre-button-2',
    genreList:     '#genre-list-2',
    clearButton:   '#clear-filters',
    onChange:      () => { state.page = 1; reload(); }
  });

  // 5) search bar
  initSearch('#search-input', '#search-button', q => {
    state.query = q;
    state.page = 1;
    reload();
  });

  // 6) results grid + “ℹ️” click handler
  initResults('#results', imdbID => showMovieModal(imdbID));

  // 7) pagination controls
  initPagination('#pagination', page => {
    state.page = page;
    reload();
  });

  initPopular(
    $('#popular-tabs'),
    $('#popular-list'),
    tmdbId => {
      // lookup imdbID then show modal
      fetchMovieDetails(tmdbId).then(({ omdbData, trailerId, embeddable }) => {
        showMovieModal(omdbData.imdbID, omdbData, trailerId, embeddable);
      });
    }
  );



  function reload() {
    const hasQuery   = Boolean(state.query);
    const hasFilters = Boolean(state.yearFrom || state.yearTo || state.sortBy || state.country || state.genres.length);

    $('#popular-section').toggle(!hasQuery && !hasFilters);

    if (hasQuery || hasFilters) {
      // unified “discover / search” fetch
      fetchSearchResults(state).then(({ movies, totalPages }) => {
        initResults.render(movies);
        initPagination.render(state.page, totalPages);
      });
    }
  }

  function showMovieModal(imdbID, omdbData = null, trailerId = null, embeddable = false) {
    const promise = omdbData
      ? Promise.resolve({ data: omdbData, trailerId, embeddable })
      : fetchMovieDetails(imdbID);

    promise.then(({ data, trailerId, embeddable }) => {
      MovieModal.show(data, trailerId, embeddable);
    });
  }

  function renderBrowseTabs() {
    const t = translations[window.currentLang];
    const tabs = [
      { key: 'top_rated',    label: t.topMovies },
      { key: 'upcoming',     label: t.incoming },
      { key: 'popular',      label: t.popularAllTime },
      { key: 'now_playing',  label: t.nowPlaying },
    ];
    $('#popular-tabs').html(
      tabs.map((tab,i) =>
        `<button data-cat="${tab.key}"${i===0?' class="active"':''}>${tab.label}</button>`
      ).join('')
    );
  }

  // first-time render
  applyFilterTranslations(window.currentLang);
  applyTranslations(window.currentLang);
  renderBrowseTabs();
  reload();
});
