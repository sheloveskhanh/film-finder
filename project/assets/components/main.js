// assets/components/main.js
$(function() {
  const OMDB_API_URL  = 'https://www.omdbapi.com/';
  const OMDB_API_KEY  = '375878b3';
  const TMDB_API_URL  = 'https://api.themoviedb.org/3';
  const TMDB_API_KEY  = '36b0465246018e127b54bfa7d47d965c';
  const TMDB_SEARCH   = `${TMDB_API_URL}/search/movie`;
  const TMDB_DISCOVER = `${TMDB_API_URL}/discover/movie`;
  const YT_API_KEY    = 'AIzaSyBuOlxxyBOae6n3322Q1CCmf6t5pScyqfA';

  // Internationalization, favorites & modal setup
  window.currentLang = 'en';
  applyTranslations(currentLang);
  $('#language-switch').on('change', function() {
    currentLang = this.value;
    applyTranslations(currentLang);
    renderFavoritesDropdown();
  });
  Favorites.render(renderFavoritesDropdown);
  MovieModal.init();

  // DOM caching
  const $searchInput  = $('#search-input');
  const $searchButton = $('#search-button');
  const $results      = $('#results');
  const $pagination   = $('<div id="pagination"></div>').insertAfter($results);
  const $favButton    = $('#favorites-button');
  const $favList      = $('#favorites-list');
  const $clearFilters = $('#clear-filters');

  // Filter state
  let filterState = {
    yearFrom: null,
    yearTo:   null,
    sortBy:   null,
    country:  null,
    genres:   [],
    page:     1
  };

  // Load genres
  const genreRev = {};
  $.getJSON(`${TMDB_API_URL}/genre/movie/list`, { api_key: TMDB_API_KEY })
    .done(resp => resp.genres.forEach(g => {
      genreRev[g.id] = g.name;
      $('#genre-list-2').append(`<li data-id="${g.id}">${g.name}</li>`);
    }));

  // Load countries
  const countryMap = {};
  $.getJSON(`${TMDB_API_URL}/configuration/countries`, { api_key: TMDB_API_KEY })
    .done(list => list.forEach(c => {
      countryMap[c.iso_3166_1] = c.english_name;
      $('#country-list').append(`<li data-code="${c.iso_3166_1}">${c.english_name}</li>`);
    }));

  // Populate sort options
  const sortOptions = [
    { value: 'original_title.asc', label: 'Title (A–Z)'    },
    { value: 'vote_average.desc',  label: 'Highest Rated'  },
    { value: 'vote_average.asc',   label: 'Lowest Rated'   },
    { value: 'vote_count.desc',    label: 'Most Rated'     }
  ];
  sortOptions.forEach(o =>
    $('#sort-list').append(`<li data-sort="${o.value}">${o.label}</li>`)
  );

  // Close any open dropdown
  function closeAllDropdowns() { $('.dropdown-menu').hide(); }
  $(document).on('click', closeAllDropdowns);

  // Year range inputs
  $('#year-from, #year-to').on('input', () => {
    filterState.yearFrom = parseInt($('#year-from').val()) || null;
    filterState.yearTo   = parseInt($('#year-to').val())   || null;
    filterState.page = 1;
    reload();
  });

  // Sort button
  $('#sort-button').on('click', e => { e.stopPropagation(); closeAllDropdowns(); $('#sort-list').toggle(); });
  $('#sort-list').on('click', 'li', function() {
    filterState.sortBy = $(this).data('sort');
    $('#sort-button').text(`Sort: ${$(this).text()} ▾`);
    filterState.page = 1;
    reload();
  });

  // Country filter
  $('#country-button').on('click', e => { e.stopPropagation(); closeAllDropdowns(); $('#country-list').toggle(); });
  $('#country-list').on('click', 'li', function() {
    $('#country-list li').removeClass('active');
    $(this).addClass('active');
    filterState.country = $(this).data('code');
    $('#country-button').text(`Country: ${$(this).text()} ▾`);
    filterState.page = 1;
    reload();
  });

  // Genre filter
  $('#genre-button-2').on('click', e => { e.stopPropagation(); closeAllDropdowns(); $('#genre-list-2').toggle(); });
  $('#genre-list-2').on('click', 'li', function() {
    $(this).toggleClass('active');
    filterState.genres = $('#genre-list-2 li.active').map((i,el) => $(el).data('id')).get();
    const names = filterState.genres.map(id => genreRev[id]);
    $('#genre-button-2').text(`Genre: ${names.join(', ') || 'Select'} ▾`);
    filterState.page = 1;
    reload();
  });

  // Clear Filters button
  $clearFilters.on('click', () => {
    filterState = { yearFrom: null, yearTo: null, sortBy: null, country: null, genres: [], page: 1 };
    // Reset UI
    $('#year-from, #year-to').val('');
    $('#sort-button').text('Sort by ▾');
    $('#sort-list li').removeClass('active');
    $('#country-button').text('Country ▾');
    $('#country-list li').removeClass('active');
    $('#genre-button-2').text('Genre ▾');
    $('#genre-list-2 li').removeClass('active');
    reload();
  });

  // Favorites dropdown
  function renderFavoritesDropdown() {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favs.length) {
      $favList.html('<li>(no favorites yet)</li>');
    } else {
      $favList.html(favs.map(m =>
        `<li data-id="${m.imdbID}"><span>${m.Title}</span>` +
        '<button class="remove-fav">&times;</button></li>'
      ).join(''));
    }
  }
  $favButton.on('click', e => { e.stopPropagation(); $favList.toggle(); });
  $favList.on('click', '.remove-fav', function(e) {
    e.stopPropagation();
    Favorites.remove($(this).closest('li').data('id'), renderFavoritesDropdown);
  });
  renderFavoritesDropdown();

  // Search button & Enter key
  $searchButton.on('click', () => { filterState.page = 1; reload(); });
  $searchInput.on('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); filterState.page = 1; reload(); } });

  // Helper: fetch 50 items per user-page
  function fetch50(url, params, userPage, onDone) {
    const perUser = 50, perTmdb = 20;
    const startIndex = (userPage - 1) * perUser;
    const endIndex   = userPage * perUser - 1;
    const startPage  = Math.floor(startIndex / perTmdb) + 1;
    const endPage    = Math.floor(endIndex   / perTmdb) + 1;
    const requests = [];
    for (let p = startPage; p <= endPage; p++) {
      requests.push($.getJSON(url, { ...params, page: p }));
    }
    Promise.all(requests).then(resList => {
      const all = resList.flatMap(r => r.results);
      const totalResults = resList[0].total_results;
      const totalUserPages = Math.ceil(totalResults / perUser);
      const offset = startIndex - (startPage - 1) * perTmdb;
      const pageItems = all.slice(offset, offset + perUser);
      onDone(pageItems, userPage, totalUserPages);
    });
  }

  // Reload logic: title search or discover or clear
  function reload() {
    const q = $searchInput.val().trim();
    if (q) {
      fetch50(TMDB_SEARCH, { api_key: TMDB_API_KEY, language: 'en-US', query: q, include_adult: false },
        filterState.page,
        (movies, page, total) => { renderResults(movies); renderPager(page, total); annotateTmdbDetails(movies); }
      );
    } else if (
      filterState.yearFrom || filterState.yearTo || filterState.sortBy ||
      filterState.country  || filterState.genres.length
    ) {
      fetch50(TMDB_DISCOVER, {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        sort_by: filterState.sortBy || 'popularity.desc',
        'primary_release_date.gte': filterState.yearFrom ? `${filterState.yearFrom}-01-01` : undefined,
        'primary_release_date.lte': filterState.yearTo   ? `${filterState.yearTo}-12-31`   : undefined,
        with_genres: filterState.genres.length ? filterState.genres.join(',') : undefined,
        region: filterState.country || undefined
      }, filterState.page, (movies, page, total) => {
        renderResults(movies); renderPager(page, total); annotateTmdbDetails(movies); }
      );
    } else {
      $results.empty();
      $pagination.empty();
    }
  }

  // Render movie cards
  function renderResults(list) {
    const html = list.map(m => {
      const poster = m.poster_path
        ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
        : 'https://via.placeholder.com/180x260?text=No+Image';
      return `
        <div class="result-card" data-id="${m.id}" data-year="${m.release_date?.slice(0,4)||''}">
          <img src="${poster}" alt="">
          <div class="result-info">
            <div class="title">${m.title} (${m.release_date?.slice(0,4)||''})</div>
            <button class="add-fav">${translations[currentLang].addFavorite}</button>
          </div>
        </div>`;
    }).join('');
    $results.html(html);
  }

  // Render pagination controls
  function renderPager(current, total) {
    const prevDisabled = current === 1 ? 'disabled' : '';
    const nextDisabled = current === total ? 'disabled' : '';
    const html = `
      <button ${prevDisabled} data-page="${current-1}">Prev</button>
      <span>Page ${current} of ${total}</span>
      <button ${nextDisabled} data-page="${current+1}">Next</button>`;
    $pagination.html(html);
  }
  $pagination.on('click', 'button', function() {
    const p = $(this).data('page');
    if (p) { filterState.page = p; reload(); }
  });

  // Apply filters to visible cards
  function applyFilters() {
    const { yearFrom, yearTo, sortBy, country, genres } = filterState;
    const $cards = $results.find('.result-card');

    $cards.each(function() {
      const $c = $(this);
      let ok = true;
      const year = parseInt($c.attr('data-year'), 10);

      if (yearFrom && year < yearFrom) ok = false;
      if (yearTo   && year > yearTo)   ok = false;

      if (country) {
        const movieCountries = ($c.attr('data-country') || '').split(',').map(s => s.trim());
        if (!movieCountries.includes(countryMap[country])) ok = false;
      }

      if (genres.length) {
        const movieGenres = ($c.attr('data-genre') || '').split(',').map(s => s.trim());
        const required = genres.map(id => genreRev[id]);
        if (!required.every(g => movieGenres.includes(g))) ok = false;
      }

      $c.toggle(ok);
    });

    // Resort visible cards if sorting selected
    if (sortBy) {
      const visible = $results.find('.result-card:visible').toArray();
      visible.sort((a, b) => {
        const A = $(a), B = $(b);
        switch (sortBy) {
          case 'original_title.asc':
            return A.find('.title').text().localeCompare(B.find('.title').text());
          case 'vote_average.desc':
            return parseFloat(B.attr('data-rating')) - parseFloat(A.attr('data-rating'));
          case 'vote_average.asc':
            return parseFloat(A.attr('data-rating')) - parseFloat(B.attr('data-rating'));
          case 'vote_count.desc':
            return parseInt(B.attr('data-votes'),10) - parseInt(A.attr('data-votes'),10);
          default:
            return 0;
        }
      });
      $results.append(visible);
    }
  }

  // Fetch full details for annotate & modal
  function annotateTmdbDetails(list) {
    list.forEach(movie => {
      $.getJSON(`${TMDB_API_URL}/movie/${movie.id}`, {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'external_ids'
      }).done(detail => {
        const $card = $results.find(`.result-card[data-id="${movie.id}"]`);
        const genreNames   = detail.genres.map(g => g.name).join(', ');
        const countryNames = detail.production_countries.map(c => c.name).join(', ');
        $card
          .attr('data-genre',   genreNames)
          .attr('data-country', countryNames)
          .attr('data-rating',  detail.vote_average)
          .attr('data-votes',   detail.vote_count);
        if (detail.external_ids?.imdb_id) {
          $card.attr('data-id', detail.external_ids.imdb_id);
        }
        applyFilters();
      });
    });
  }

  // Favorites button inside cards
  $results.on('click', '.add-fav', function(e) {
    e.stopPropagation();
    const id    = $(this).closest('.result-card').data('id');
    const title = $(this).siblings('.title').text();
    Favorites.add({ imdbID: id, Title: title }, renderFavoritesDropdown);
  });

  // Card click opens modal
  $results.on('click', '.result-card', function(e) {
    if ($(e.target).is('.add-fav')) return;
    const imdbID = $(this).data('id');
    $.getJSON(OMDB_API_URL, { apikey: OMDB_API_KEY, i: imdbID, plot: 'full' })
      .done(md => {
        const q = encodeURIComponent(md.Title + ' official trailer');
        $.getJSON(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${q}&key=${YT_API_KEY}`
        ).done(yt => {
          const vid = yt.items?.[0]?.id.videoId;
          if (vid) {
            $.getJSON(
              `https://www.googleapis.com/youtube/v3/videos?part=status&id=${vid}&key=${YT_API_KEY}`
            ).done(st => {
              MovieModal.show(md, vid, st.items?.[0]?.status.embeddable);
            });
          } else {
            MovieModal.show(md, null, false);
          }
        });
      });
  });

  // Initial load
  reload();
});
