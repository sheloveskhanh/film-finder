// assets/js/components/modal.js
const MovieModal = (function() {
  const $modal     = $('#movie-modal');
  const $container = $modal.find('.modal-content');

  // Stops any playing YouTube video by resetting the iframe src
  function stopVideo() {
    $container.find('iframe').each(function() {
      const $iframe = $(this);
      $iframe.attr('src', $iframe.attr('src'));
    });
  }

  function init() {
    // Close on “×” click
    $container
      .off('click', '.close')
      .on('click', '.close', () => {
        stopVideo();
        $modal.hide();
      });

    // Close when clicking outside the content box
    $modal
      .off('click', onOutsideClick)
      .on('click', onOutsideClick);
  }

  function onOutsideClick(e) {
    if (e.target === $modal[0]) {
      stopVideo();
      $modal.hide();
    }
  }

  // show(movieData, trailerId: string|null, embeddable: bool)
  function show(movie, trailerId, embeddable) {
    // Build the trailer section (or fallback link/message)
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

    // Compose full modal HTML
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
          <p><strong>Description:</strong> ${movie.Plot}</p>
        </div>
      </div>
      ${trailerSection}
    `;

    // Inject and show
    $container.html(html);
    init();
    $modal.show();
  }

  return { init, show };
})();
