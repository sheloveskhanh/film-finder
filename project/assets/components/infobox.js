// assets/js/components/infobox.js
;(function() {
  // create and append the box once
  const $box = $('<div class="info-box"></div>');
  $('body').append($box);

  $('#results')
    // show on hover over the entire card (image or title)
    .on('mouseenter', '.result-card', function() {
      const id    = $(this).data('id');
      const last  = JSON.parse(localStorage.getItem('lastResults') || '[]');
      const movie = last.find(m => m.imdbID === id);
      if (!movie) return;

      // populate content
      $box.html(`
        <h4>${movie.Title}</h4>
        <p><strong>Year:</strong> ${movie.Year}</p>
        <p><strong>Type:</strong> ${movie.Type}</p>
        <p><strong>ID:</strong> ${movie.imdbID}</p>
      `);

      // position the box top-left just below the card
      const offset = $(this).offset();
      $box.css({
        top:  offset.top + $(this).outerHeight() + 8,
        left: offset.left + 8
      }).fadeIn(100);
    })
    // hide when leaving the card
    .on('mouseleave', '.result-card', function() {
      $box.fadeOut(100);
    });
})();
