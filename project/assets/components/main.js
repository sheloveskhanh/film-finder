// assets/js/main.js
$(function() {
  // --- API Keys & Endpoints ---
  const OMDB_API_URL  = 'https://www.omdbapi.com/';
  const OMDB_API_KEY  = '375878b3';
  const YT_API_KEY    = 'AIzaSyBuOlxxyBOae6n3322Q1CCmf6t5pScyqfA';
  const TMDB_API_KEY  = '36b0465246018e127b54bfa7d47d965c';

  // --- Globals & Initialization ---
  window.currentLang = 'en';
  applyTranslations(currentLang);
  $('#language-switch').on('change', function() {
    currentLang = this.value;
    applyTranslations(currentLang);
    onFavoritesUpdate();
  });

  // Initialize Favorites and Modal
  function onFavoritesUpdate() {
    Favorites.render(onFavoritesUpdate);
    renderFavoritesDropdown();
  }
  Favorites.render(onFavoritesUpdate);
  MovieModal.init();

  // --- Cache selectors ---
  const $searchInput  = $('#search-input');
  const $searchButton = $('#search-button');
  const $results      = $('#results');
  const $suggestions  = $('<ul id="suggestions" class="suggestions"></ul>').insertAfter($searchInput).hide();
  const $favButton    = $('#favorites-button');
  const $favList      = $('#favorites-list');

  // --- Populate filter-type select ---
  $('#filter-type').append(
    `<option value="">All Types</option>` +
    `<option value="movie">Movie</option>` +
    `<option value="series">Series</option>` +
    `<option value="episode">Episode</option>`
  );

  // --- Populate Genre dropdown & filter select ---
  const $genreList = $('#genre-list').hide();
  $.getJSON(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`)
    .done(resp => {
      resp.genres.forEach(g => {
        $genreList.append(`<li data-genre="${g.name}">${g.name}</li>`);
        $('#filter-genre').append(`<option value="${g.name}">${g.name}</option>`);
      });
    });

  // Toggle genre dropdown on button click
  $('#genre-button').on('click', e => {
    e.stopPropagation();
    $genreList.toggle();
  });
  $(document).on('click', e => {
    if (!$(e.target).closest('.genre-dropdown').length) {
      $genreList.hide();
    }
  });
  // Genre selection filters results
  $genreList.on('click', 'li', function() {
    const genre = $(this).data('genre');
    $genreList.find('li').removeClass('active');
    $(this).addClass('active');
    applyFilters();
    $genreList.hide();
  });

  // --- Favorites dropdown logic ---
  function renderFavoritesDropdown() {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favs.length) {
      $favList.html('<li>(no favorites yet)</li>');
    } else {
      $favList.html(favs.map(m =>
        `<li data-id="${m.imdbID}">` +
          `<span>${m.Title}</span>` +
          `<button class="remove-fav">&times;</button>` +
        `</li>`
      ).join(''));
    }
  }

  $favButton.on('click', e => {
    e.stopPropagation();
    $favList.toggle();
  });
  $(document).on('click', e => {
    if (!$(e.target).closest('.favorites-dropdown').length) {
      $favList.hide();
    }
  });
  $favList.on('click', '.remove-fav', function(e) {
    e.stopPropagation();
    const id = $(this).closest('li').data('id');
    Favorites.remove(id, onFavoritesUpdate);
  });

  // Initial favorites dropdown population
  renderFavoritesDropdown();

  // --- Search & Suggestions ---
  let suggestTimeout;
  $searchButton.on('click', doSearch);
  $searchInput.on('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $suggestions.hide();
      doSearch();
    }
  });
  $searchInput.on('input', function() {
    this.value = this.value.replace(/[^a-zA-Z0-9 ]/g, '');
    const q = this.value.trim();
    clearTimeout(suggestTimeout);
    if (q.length < 2) return $suggestions.hide().empty();
    suggestTimeout = setTimeout(() => {
      $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, s: q })
        .done(data => {
          if (!data.Search) return $suggestions.hide().empty();
          const items = data.Search.slice(0,5).map(m =>
            `<li data-id="${m.imdbID}" data-title="${m.Title}">${m.Title} (${m.Year})</li>`
          ).join('');
          $suggestions.html(items).show();
        });
    }, 300);
  });
  $suggestions.on('click', 'li', function() {
    $searchInput.val($(this).data('title'));
    $suggestions.hide().empty();
    doSearch();
  });

  // --- Perform search & render results ---
  function doSearch() {
    const query = $searchInput.val().trim();
    if (!query) return;
    $suggestions.hide();
    $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, s: query })
      .done(renderResults)
      .fail(() => $results.html('<p>Search error</p>'));
  }

  function renderResults(data) {
    if (!data.Search) return $results.html('<p>No results found</p>');
    localStorage.setItem('lastResults', JSON.stringify(data.Search));
    const html = data.Search.map(m => {
      const poster = m.Poster !== 'N/A' ? m.Poster :
        'https://via.placeholder.com/180x260?text=No+Image';
      return `
        <div class="result-card" data-id="${m.imdbID}" data-type="${m.Type}" data-genre="" data-language="">
          <img src="${poster}" alt="${m.Title} Poster">
          <div class="result-info">
            <div class="title">${m.Title} (${m.Year})</div>
            <button class="add-fav">${translations[currentLang].addFavorite}</button>
          </div>
        </div>`;
    }).join('');
    $results.html(html);
    annotateAndFilter(data.Search);
  }

  function annotateAndFilter(list) {
    list.forEach(m => {
      $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, i: m.imdbID })
        .done(detail => {
          const $card = $results.find(`.result-card[data-id="${m.imdbID}"]`);
          $card.attr('data-genre', detail.Genre || '');
          $card.attr('data-language', detail.Language || '');
          applyFilters();
        });
    });
  }

  // --- Filter handler for type, filter select, and dropdown ---
  $('#filter-type, #filter-genre').on('change', applyFilters);
  function applyFilters() {
    const typeVal = $('#filter-type').val();
    const genreVal = $('#filter-genre').val();
    const dropdownVal = $genreList.find('li.active').data('genre') || '';
    $results.find('.result-card').each(function() {
      const $c = $(this);
      let ok = true;
      if (typeVal && $c.data('type') !== typeVal) ok = false;
      if (genreVal && !$c.attr('data-genre').includes(genreVal)) ok = false;
      if (dropdownVal && !$c.attr('data-genre').includes(dropdownVal)) ok = false;
      $c.toggle(ok);
    });
  }

  // --- Add to Favorites from results ---
  $results.on('click', '.add-fav', function(e) {
    e.stopPropagation();
    const id = $(this).closest('.result-card').data('id');
    const last = JSON.parse(localStorage.getItem('lastResults') || '[]');
    const movie = last.find(m => m.imdbID === id);
    Favorites.add(movie, onFavoritesUpdate);
  });

  // --- Info Modal on result click ---
  $results.on('click', '.result-card', function(e) {
    if ($(e.target).is('.add-fav')) return;
    const imdbID = $(this).data('id');
    $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, i: imdbID, plot: 'full' })
      .done(movieData => {
        const q = encodeURIComponent(movieData.Title + ' official trailer');
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${q}&key=${YT_API_KEY}`;
        $.getJSON(ytUrl).done(ytResp => {
          const item    = ytResp.items?.[0];
          const videoId = item ? item.id.videoId : null;
          if (videoId) {
            const statusUrl = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${YT_API_KEY}`;
            $.getJSON(statusUrl).done(statResp => {
              const embeddable = statResp.items?.[0]?.status.embeddable;
              MovieModal.show(movieData, videoId, embeddable);
            });
          } else {
            MovieModal.show(movieData, null, false);
          }
        });
      });
  });
});
