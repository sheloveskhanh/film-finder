import { translations } from "./lang.js";

export function Results(selector, onCardClick) {
  let $results;
  let $pagination;
  let currentPage = 1;
  let totalPages = 1;

  function init() {
    $results = $(selector);
    $pagination = $('<div id="pagination"></div>').insertAfter($results);

    // Pagination button clicks
    $pagination.on('click', 'button', function() {
      const page = $(this).data('page');
      if (page) {
        $(document).trigger('pager:changed', page);
      }
    });

    // Info icon click
    $results.on('click', '.info-icon', function(e) {
      e.stopPropagation();
      const id = $(this).closest('.result-card').data('id');
      if (typeof onCardClick === 'function') {
        onCardClick(id);
      }
    });

    // Add favorite click (optional, if you want to handle here)
    // $results.on('click', '.add-fav', function(e) { ... });
  }

  function render(movies = [], page = 1, total = 1) {
    currentPage = page;
    totalPages = total;

    const html = movies.map(movie => {
      const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
        : 'https://placehold.co/180x260?text=No+Image';

      return `
        <div class="result-card" data-id="${movie.imdb_id || movie.id}">
          <div class="poster-container">
            <img src="${posterUrl}" alt="${movie.title} Poster">
          </div>
          <div class="card-details">
            <h3 class="title">${movie.title} (${(movie.release_date||'').slice(0,4)})</h3>
            <button class="add-fav">${translations[window.currentLang].addFavorite || "Add to Favorites"}</button>
            <button class="info-icon">${translations[window.currentLang].moreInfo || "More Info"}</button>
          </div>
        </div>
      `;
    }).join('');

    $results.html(html);

    let pagerHtml = '';
    for (let i = 1; i <= totalPages; i++) {
      pagerHtml += `<button data-page="${i}"${i === currentPage ? ' class="active"' : ''}>${i}</button>`;
    }
    $pagination.html(pagerHtml);
  }

  return { init, render };
}
