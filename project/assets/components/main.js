// assets/js/main.js
$(function() {
  const OMDB_API_URL  = 'https://www.omdbapi.com/';
  const OMDB_API_KEY  = '375878b3';
  const YT_API_KEY    = 'AIzaSyBuOlxxyBOae6n3322Q1CCmf6t5pScyqfA'; // ← replace with your key

  // expose for other modules
  window.currentLang = 'en';

  // 1) Initialize localization
  applyTranslations(currentLang);
  $('#language-switch').on('change', function() {
    currentLang = this.value;
    applyTranslations(currentLang);
    Favorites.render(onFavoritesUpdate);
  });

  // 2) Initialize favorites
  function onFavoritesUpdate() {
    Favorites.render(onFavoritesUpdate);
  }
  Favorites.render(onFavoritesUpdate);

  // 3) Initialize modal
  MovieModal.init();

  // 4) Search binding (button + Enter key)
  $('#search-button').on('click', doSearch);
  $('#search-input').on('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });

  function doSearch() {
    const query = $('#search-input').val().trim();
    if (!query) return;

    $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, s: query })
      .done(renderResults)
      .fail(() => $('#results').html('<p>Search error</p>'));
  }

  function renderResults(data) {
    if (!data.Search) {
      $('#results').html('<p>No results found</p>');
      return;
    }

    // cache results for infobox / favorites
    localStorage.setItem('lastResults', JSON.stringify(data.Search));

    const html = data.Search.map(m =>
      `<div class="movie" data-id="${m.imdbID}">
         <span>${m.Title} (${m.Year})</span>
         <button class="add-fav">${translations[currentLang].addFavorite}</button>
       </div>`
    ).join('');

    $('#results').html(html);
  }

  // 5) Add to favorites
  $('#results').on('click', '.add-fav', function(e) {
    e.stopPropagation();
    const id    = $(this).closest('.movie').data('id');
    const last  = JSON.parse(localStorage.getItem('lastResults') || '[]');
    const movie = last.find(m => m.imdbID === id);
    Favorites.add(movie, onFavoritesUpdate);
  });

  // 6) On title click → fetch details + trailer → show modal
  $('#results').on('click', '.movie span', function() {
    const imdbID = $(this).closest('.movie').data('id');

    // Fetch full details from OMDb
    $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, i: imdbID, plot: 'full' })
      .done(movieData => {
        // Search YouTube for official trailer
        const q     = encodeURIComponent(movieData.Title + ' official trailer');
        const url   = `https://www.googleapis.com/youtube/v3/search` +
                      `?part=snippet&type=video&maxResults=1&q=${q}&key=${YT_API_KEY}`;

        $.getJSON(url).done(ytResp => {
          const item    = ytResp.items && ytResp.items[0];
          const videoId = item ? item.id.videoId : null;

          if (videoId) {
            // Check embeddable flag
            const statusUrl = `https://www.googleapis.com/youtube/v3/videos` +
                              `?part=status&id=${videoId}&key=${YT_API_KEY}`;

            $.getJSON(statusUrl).done(statResp => {
              const embeddable = statResp.items?.[0]?.status.embeddable;
              MovieModal.show(movieData, videoId, embeddable);
            });
          } else {
            // no trailer found
            MovieModal.show(movieData, null, false);
          }
        });
      });
  });
});
