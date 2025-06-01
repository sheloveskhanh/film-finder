
import { translations } from "./lang.js";

export const MovieModal = (function() {
  const $modal     = $('#movie-modal');
  const $container = $modal.find('.modal-content');
  let lastData = null;  

  function stopVideo() {
    $container.find('iframe').each(function() {
      const $iframe = $(this);
      $iframe.attr('src', $iframe.attr('src'));
    });
  }

  function onClose() {
    stopVideo();
    $modal.hide();
  }

  function onOutsideClick(e) {
    if (e.target === $modal[0]) onClose();
  }

  function initHandlers() {
    $container
      .off('click', '.close')
      .on('click', '.close', onClose);

    $modal
      .off('click', onOutsideClick)
      .on('click', onOutsideClick);
  }

  function buildTrailerSection(trailerId, embeddable) {
    if (trailerId && embeddable) {
      return `
        <div class="modal-trailer">
          <iframe
            src="https://www.youtube.com/embed/${trailerId}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>`;
    } else if (trailerId) {
      return `
        <div class="modal-trailer" style="padding:1rem; text-align:center;">
          <p>This trailer can’t be embedded here.
            <a href="https://youtu.be/${trailerId}" target="_blank" rel="noopener">
              Watch on YouTube
            </a>
          </p>
        </div>`;
    } else {
      return `
        <div class="modal-trailer" style="padding:1rem; text-align:center;">
          <p>No trailer found.</p>
        </div>`;
    }
  }

  function renderContents(movie, trailerId, embeddable) {
    const t = translations[window.currentLang] || {};

    const posterSrc = movie.Poster && movie.Poster !== 'N/A'
      ? movie.Poster
      : '../assets/no-image.png';

    const trailerSection = buildTrailerSection(trailerId, embeddable);

    const html = `
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body" style="display:flex; gap:1rem;">
        <div class="modal-poster" style="flex-shrink:0;">
          <img
            src="${posterSrc}"
            alt="${movie.Title} Poster"
            onerror="this.onerror=null; this.src='../assets/no-image.png';"
            style="width:160px; object-fit:cover;"
          >
        </div>
        <div class="details" style="flex-grow:1;">
          <h2>${movie.Title}</h2>
          <p><strong>${t.genreLabel || 'Genre'}:</strong> ${movie.Genre}</p>
          <p><strong>${t.actorsLabel || 'Actors'}:</strong> ${movie.Actors}</p>
          <p><strong>${t.releaseDateLabel || 'Release Date'}:</strong> ${movie.Released}</p>
          <p><strong>${t.imdbRatingLabel || 'IMDb Rating'}:</strong> ${movie.imdbRating}</p>
          <p><strong>${t.descriptionLabel || 'Description'}:</strong> ${movie.Plot}</p>
        </div>
      </div>
      ${trailerSection}
    `;
    $container.html(html);
    initHandlers();
    $modal.show();
  }

  function showLoading() {
    const t = translations[window.currentLang] || {};
    const loadingText = t.loadingText || 'Loading movie details…';

    const html = `
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body" style="text-align:center; padding:2rem;">
        <p>${loadingText}</p>
      </div>
    `;
    $container.html(html);
    initHandlers();
    $modal.show();
  }

  function showError(message) {
    const t = translations[window.currentLang] || {};
    const closeLabel = t.closeLabel || 'Close';

    const html = `
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body" style="text-align:center; padding:2rem;">
        <p>${message}</p>
        <button class="close" style="margin-top:1rem;">${closeLabel}</button>
      </div>
    `;
    $container.html(html);
    initHandlers();
    $modal.show();
  }

  function showTMDBOnly(detail) {
    const t = translations[window.currentLang] || {};
    const posterSrc = detail.poster_path
      ? `https://image.tmdb.org/t/p/w342${detail.poster_path}`
      : "../assets/no-image.png";

    const html = `
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body" style="display:flex; gap:1rem;">
        <div class="modal-poster" style="flex-shrink:0;">
          <img
            src="${posterSrc}"
            alt="${detail.title} Poster"
            onerror="this.onerror=null;this.src='../assets/no-image.png';"
            style="width:160px; object-fit:cover;"
          >
        </div>
        <div class="details" style="flex-grow:1;">
          <h2>${detail.title}</h2>
          <p><strong>${t.genreLabel   || 'Genre'}:</strong> ${detail.genres.map(g => g.name).join(", ")}</p>
          <p><strong>${t.releaseDateLabel || 'Release Date'}:</strong> ${detail.release_date}</p>
          <p><strong>${t.imdbRatingLabel || 'TMDB Rating'}:</strong> ${detail.vote_average}</p>
          <p><strong>${t.descriptionLabel  || 'Overview'}:</strong> ${detail.overview}</p>
        </div>
      </div>
      <div class="modal-trailer" style="padding:1rem; text-align:center;">
        <p>${t.noTrailerText || "Trailer not available."}</p>
      </div>
    `;
    $container.html(html);
    initHandlers();
    $modal.show();
  }

  return {
    init() {
      initHandlers();
    },
    showLoading,
    showError,
    show(movie, trailerId, embeddable) {
      lastData = { movie, trailerId, embeddable };
      renderContents(movie, trailerId, embeddable);
    },
    showTMDBOnly(detail) {
      lastData = { movie: detail, trailerId: null, embeddable: false };
      showTMDBOnly(detail);
    },
    rerender() {
      if (lastData) {
        const { movie, trailerId, embeddable } = lastData;
        renderContents(movie, trailerId, embeddable);
      }
    }
  };
})();
