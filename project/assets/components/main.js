// assets/js/main.js
$(function() {
  const OMDB_API_URL  = 'https://www.omdbapi.com/';
  const OMDB_API_KEY  = '375878b3';
  const YT_API_KEY    = 'AIzaSyBuOlxxyBOae6n3322Q1CCmf6t5pScyqfA'; // your YouTube key

  // expose for other modules
  window.currentLang = 'en';

  // 1) Localization
  applyTranslations(currentLang);
  $('#language-switch').on('change', function() {
    currentLang = this.value;
    applyTranslations(currentLang);
    Favorites.render(onFavoritesUpdate);
  });

  // 2) Favorites
  function onFavoritesUpdate() {
    Favorites.render(onFavoritesUpdate);
  }
  Favorites.render(onFavoritesUpdate);

  // 3) Modal
  MovieModal.init();

  // cache selectors
  const $searchInput  = $('#search-input');
  const $searchButton = $('#search-button');
  const $results      = $('#results');
  const $suggestions  = $('<ul id="suggestions" class="suggestions"></ul>')
                          .insertAfter($searchInput);

  let suggestTimeout;

  // 4) Bind search
  $searchButton.on('click', doSearch);
  $searchInput.on('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $suggestions.hide();
      doSearch();
    }
  });

  // 5) Input validation & live suggestions
  $searchInput.on('input', function() {
    // allow only letters, numbers, spaces
    this.value = this.value.replace(/[^a-zA-Z0-9 ]/g, '');
    const q = this.value.trim();
    clearTimeout(suggestTimeout);
    if (q.length < 2) {
      $suggestions.empty().hide();
      return;
    }

    suggestTimeout = setTimeout(() => {
      $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, s: q })
        .done(data => {
          if (!data.Search) {
            $suggestions.empty().hide();
            return;
          }
          // build up to 5 suggestions
          const items = data.Search.slice(0,5).map(m =>
            `<li
               data-id="${m.imdbID}"
               data-title="${m.Title}">
               ${m.Title} (${m.Year})
             </li>`
          ).join('');
          $suggestions.html(items).show();
        });
    }, 300);
  });

  // 6) Clicking a suggestion
  $suggestions.on('click', 'li', function() {
    const title = $(this).data('title');
    $searchInput.val(title);
    $suggestions.empty().hide();
    doSearch();
  });

  // hide suggestions clicking elsewhere
  $(document).on('click', e => {
    if (!$(e.target).closest('#suggestions, #search-input').length) {
      $suggestions.hide();
    }
  });

  // 7) Actual search
  function doSearch() {
    const query = $searchInput.val().trim();
    if (!query) return;
    $suggestions.hide();

    $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, s: query })
      .done(renderResults)
      .fail(() => $results.html('<p>Search error</p>'));
  }

  function renderResults(data) {
    if (!data.Search) {
      $results.html('<p>No results found</p>');
      return;
    }
    localStorage.setItem('lastResults', JSON.stringify(data.Search));
    const html = data.Search.map(m => {
      const poster = (m.Poster && m.Poster!=='N/A')
        ? m.Poster
        : 'https://via.placeholder.com/180x260?text=No+Image';
      return `
        <div class="result-card" data-id="${m.imdbID}">
          <img src="${poster}" alt="${m.Title} Poster">
          <div class="result-info">
            <div class="title">${m.Title} (${m.Year})</div>
            <button class="add-fav">${translations[currentLang].addFavorite}</button>
          </div>
        </div>
      `;
    }).join('');
    $results.html(html);
  }

  // 8) Add to favorites
  $results.on('click', '.add-fav', function(e) {
    e.stopPropagation();
    const id    = $(this).closest('.result-card').data('id');
    const last  = JSON.parse(localStorage.getItem('lastResults') || '[]');
    const movie = last.find(m => m.imdbID===id);
    Favorites.add(movie, onFavoritesUpdate);
  });

  // 9) Click card → show modal
  $results.on('click', '.result-card', function(e) {
    if ($(e.target).is('.add-fav')) return;
    const imdbID = $(this).data('id');

    $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, i: imdbID, plot: 'full' })
      .done(movieData => {
        const q    = encodeURIComponent(movieData.Title+' official trailer');
        const ytUrl = `https://www.googleapis.com/youtube/v3/search`
                    + `?part=snippet&type=video&maxResults=1`
                    + `&q=${q}&key=${YT_API_KEY}`;
        $.getJSON(ytUrl).done(ytResp => {
          const item    = ytResp.items && ytResp.items[0];
          const videoId = item ? item.id.videoId : null;
          if (videoId) {
            const statusUrl = `https://www.googleapis.com/youtube/v3/videos`
                            + `?part=status&id=${videoId}&key=${YT_API_KEY}`;
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
