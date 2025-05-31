// project/assets/components/modal.js

import { translations } from "./lang.js";

export const MovieModal = (function () {
  const $modal     = $('#movie-modal');
  const $container = $modal.find('.modal-content');
  let lastData = null; // Tracks what was last shown (full OMDB or TMDB‐only)

  // ---------------------
  // 1) INIT / HANDLERS
  // ---------------------

  function initHandlers() {
    // Close button (the “×” or any button with class="close")
    $container
      .off('click', '.close')
      .on('click', '.close', onClose);

    // Click outside the modal‐content to close
    $modal
      .off('click', onOutsideClick)
      .on('click', onOutsideClick);
  }

  function onClose() {
    stopVideo();
    $modal.hide();
  }

  function onOutsideClick(e) {
    if (e.target === $modal[0]) {
      onClose();
    }
  }

  function init() {
    initHandlers();
  }

  // ---------------------
  // 2) VIDEO STOPPER
  // ---------------------

  function stopVideo() {
    // Reload each <iframe> src to stop playback
    $container.find('iframe').each(function () {
      const $iframe = $(this);
      $iframe.attr('src', $iframe.attr('src'));
    });
  }

  // ---------------------
  // 3) LOADING STATE
  // ---------------------

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
    lastData = { type: 'loading' };
  }

  // ---------------------
  // 4) ERROR STATE
  // ---------------------

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
    lastData = { type: 'error', message };
  }

  // ---------------------
  // 5) FULL OMDB + TRAILER
  // ---------------------

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
          <h2>${movie.Title} (${movie.Year || ''})</h2>
          <p><strong>${t.genreLabel || 'Genre'}:</strong> ${movie.Genre || 'N/A'}</p>
          <p><strong>${t.actorsLabel || 'Actors'}:</strong> ${movie.Actors || 'N/A'}</p>
          <p><strong>${t.releaseDateLabel || 'Release Date'}:</strong> ${movie.Released || 'N/A'}</p>
          <p><strong>${t.imdbRatingLabel || 'IMDb Rating'}:</strong> ${movie.imdbRating || 'N/A'}</p>
          <p><strong>${t.descriptionLabel || 'Description'}:</strong> ${movie.Plot || 'N/A'}</p>
        </div>
      </div>
      ${trailerSection}
    `;

    $container.html(html);
    initHandlers();
    $modal.show();
    lastData = { type: 'full', movie, trailerId, embeddable };
  }

  // ---------------------
  // 6) TMDB-ONLY FALLBACK
  // ---------------------

  function showTMDBOnly(detail) {
    const t = translations[window.currentLang] || {};

    const posterUrl = detail.poster_path
      ? `https://image.tmdb.org/t/p/w342${detail.poster_path}`
      : '../assets/no-image.png';

    const html = `
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body" style="display:flex; gap:1rem;">
        <div class="modal-poster" style="flex-shrink:0;">
          <img
            src="${posterUrl}"
            alt="${detail.title} Poster"
            onerror="this.onerror=null; this.src='../assets/no-image.png';"
            style="width:160px; object-fit:cover;"
          >
        </div>
        <div class="details" style="flex-grow:1;">
          <h2>${detail.title} (${detail.release_date ? detail.release_date.slice(0,4) : ''})</h2>
          <p><strong>${t.genreLabel || 'Genre'}:</strong>
            ${detail.genres.map(g => g.name).join(', ') || 'N/A'}
          </p>
          <p><strong>${t.descriptionLabel || 'Overview'}:</strong>
            ${detail.overview || 'N/A'}
          </p>
          <p style="margin-top:1rem; color:#888;">
            (${t.noAdditional || 'No additional details available because no IMDb ID was found.'})
          </p>
        </div>
      </div>
    `;

    $container.html(html);
    initHandlers();
    $modal.show();
    lastData = { type: 'tmdb', detail };
  }

  // ---------------------
  // 7) RERENDER FOR LANGUAGE CHANGE
  // ---------------------

  function rerender() {
    if (!lastData) return;
    switch (lastData.type) {
      case 'full':
        renderContents(lastData.movie, lastData.trailerId, lastData.embeddable);
        break;
      case 'tmdb':
        showTMDBOnly(lastData.detail);
        break;
      case 'loading':
        showLoading();
        break;
      case 'error':
        showError(lastData.message);
        break;
    }
  }

  // ---------------------
  // 8) PUBLIC API
  // ---------------------

  return {
    init,
    showLoading,
    showError,
    show(movie, trailerId, embeddable) {
      renderContents(movie, trailerId, embeddable);
    },
    showTMDBOnly,
    rerender
  };
})();
