// assets/js/components/modal.js
const MovieModal = (function() {
  const $modal     = $('#movie-modal');
  const $container = $modal.find('.modal-content');

  function init() {
    $container.off('click', '.close')
              .on('click', '.close', () => $modal.hide());
    $modal.off('click', onOutside).on('click', onOutside);
  }

  function onOutside(e) {
    if (e.target === $modal[0]) $modal.hide();
  }

  // Now accepts trailerId (string|null) and embeddable (bool)
  function show(movie, trailerId, embeddable) {
    // build the trailer (or fallback) section
    let trailerSection;
    if (trailerId && embeddable) {
      trailerSection = `
        <div class="modal-trailer">
          <iframe
            src="https://www.youtube.com/embed/${trailerId}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>`;
    } else if (trailerId && !embeddable) {
      trailerSection = `
        <div class="modal-trailer" style="padding:1rem; text-align:center;">
          <p>This trailer can’t be embedded here. 
            <a href="https://youtu.be/${trailerId}" target="_blank" rel="noopener">
              Watch on YouTube
            </a>
          </p>
        </div>`;
    } else {
      trailerSection = `
        <div class="modal-trailer" style="padding:1rem; text-align:center;">
          <p>No trailer found.</p>
        </div>`;
    }

    const html = `
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body">
        <img src="${movie.Poster}" alt="${movie.Title} Poster">
        <div class="details">
          <h2>${movie.Title}</h2>
          <p><strong>Genre:</strong> ${movie.Genre}</p>
          <p><strong>Actors:</strong> ${movie.Actors}</p>
          <p><strong>Release Date:</strong> ${movie.Released}</p>
          <p><strong>IMDb Rating:</strong> ${movie.imdbRating}</p>
        </div>
      </div>
      ${trailerSection}
    `;

    $container.html(html);
    init();
    $modal.show();
  }

  return { init, show };
})();
