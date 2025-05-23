// assets/components/modal.js

const MovieModal = (function() {
  const $modal     = $('#movie-modal');
  const $container = $modal.find('.modal-content');
  let lastData = null;  // store last‐shown so we can reapply translations

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

  function render(movie, trailerId, embeddable) {
    const t = translations[window.currentLang];

    const trailerSection = buildTrailerSection(trailerId, embeddable);

    const html = `
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body">
        <img src="${movie.Poster}" alt="${movie.Title} Poster">
        <div class="details">
          <h2>${movie.Title}</h2>
          <p><strong>${t.genreLabel}:</strong> ${movie.Genre}</p>
          <p><strong>${t.actorsLabel}:</strong> ${movie.Actors}</p>
          <p><strong>${t.releaseDateLabel}:</strong> ${movie.Released}</p>
          <p><strong>${t.imdbRatingLabel}:</strong> ${movie.imdbRating}</p>
          <p><strong>${t.descriptionLabel}:</strong> ${movie.Plot}</p>
        </div>
      </div>
      ${trailerSection}
    `;

    $container.html(html);
    initHandlers();
    $modal.show();
  }

  return {
    init() {
    },
    show(movie, trailerId, embeddable) {
      lastData = { movie, trailerId, embeddable };
      render(movie, trailerId, embeddable);
    },
    rerender() {
      if (lastData) {
        const { movie, trailerId, embeddable } = lastData;
        render(movie, trailerId, embeddable);
      }
    }
  };
})();
