import { translations } from "./lang.js";
import { Favorites } from "./favorites.js";

export function Results(selector, onCardClick) {
  let $results;
  let $pagination;
  let currentPage = 1;
  let totalPages = 1;

  function init() {
    $results = $(selector);
    $pagination = $("#pagination");

    // Info icon click handler
    $results.on("click", ".info-icon", function(e) {
      e.stopPropagation();
      const id = $(this).closest(".result-card").data("id");
      if (typeof onCardClick === "function") {
        onCardClick(id);
      }
    });

    // Favorite button click handler
    $results.on("click", ".add-fav", function(e) {
      e.stopPropagation();
      const $card = $(this).closest(".result-card");
      const imdbID = $card.data("id");
      const title = $card.data("title");

      if (!imdbID || !title) {
        alert(translations[window.currentLang]?.favoriteError || "Unable to add to favorites");
        return;
      }

      Favorites.add({ imdbID, Title: title });
    });
  }

  // Check if movie has essential data
  function isValidMovie(movie) {
    return (
      movie && // Movie exists
      (movie.id || movie.imdb_id) && // Has some ID
      movie.title && // Has title
      movie.title.trim() !== "" && // Title isn't empty
      (movie.poster_path || movie.backdrop_path) && // Has some image
      (movie.release_date || movie.first_air_date) // Has some date
    );
  }

  function render(movies = [], page = 1, total = 1) {
    currentPage = page;
    totalPages = total;

    // Filter out invalid movies first
    const validMovies = movies.filter(isValidMovie);

    // Handle no valid results
    if (validMovies.length === 0) {
      const noResultsText = translations[window.currentLang]?.noResults || 
                           "No complete movies found. Try another search.";
      $results.html(`<div class="no-results">${noResultsText}</div>`);
      $pagination.html("");
      return;
    }

    // Generate HTML for valid movies
    const html = validMovies.map(movie => {
      const movieID = movie.imdb_id || movie.id;
      const year = (movie.release_date || movie.first_air_date)?.slice(0, 4) || "";
      
      // Use backdrop if poster is missing
      const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
        : `https://image.tmdb.org/t/p/w200${movie.backdrop_path}`;

      // Get translated labels
      const addFavLabel = translations[window.currentLang]?.addFavorite || "Add to Favorites";
      const infoLabel = translations[window.currentLang]?.moreInfo || "More Info";

      return `
        <div class="result-card" 
             data-id="${movieID}"
             data-title="${movie.title.replace(/"/g, "&quot;")}"
             data-year="${year}">
          <div class="poster-container">
            <img src="${posterUrl}" 
                 alt="${movie.title}"
                 loading="lazy"
                 onerror="this.src='https://placehold.co/180x260?text=No+Image'">
          </div>
          <div class="card-details">
            <h3 class="title">${movie.title} ${year ? `(${year})` : ""}</h3>
            <button class="add-fav">${addFavLabel}</button>
            <button class="info-icon">${infoLabel}</button>
          </div>
        </div>
      `;
    }).join("");

    $results.html(html);
    renderPagination();
  }

  function renderPagination() {
    let pagerHtml = "";
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Previous button
    pagerHtml += `
      <button data-page="${Math.max(1, currentPage - 1)}" 
              ${currentPage === 1 ? 'disabled' : ''}>
        &laquo;
      </button>`;

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pagerHtml += `
        <button data-page="${i}" 
                ${i === currentPage ? 'class="active"' : ''}>
          ${i}
        </button>`;
    }

    // Next button
    pagerHtml += `
      <button data-page="${Math.min(totalPages, currentPage + 1)}" 
              ${currentPage === totalPages ? 'disabled' : ''}>
        &raquo;
      </button>`;

    $pagination.html(pagerHtml);
  }

  return { init, render };
}