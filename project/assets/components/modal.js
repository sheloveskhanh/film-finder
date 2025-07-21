import { translations } from "./lang.js";

const FALLBACK_POSTER = "assets/image/no-image.jpg";

export const MovieModal = (function () {
  const $modal = $("#movie-modal");
  const $container = $modal.find(".modal-content");
  let lastData = null;

  function stopVideo() {
    $container.find("iframe").each(function () {
      const $iframe = $(this);
      $iframe.attr("src", $iframe.attr("src"));
    });
  }

  function onClose() {
    stopVideo();
    $modal.hide();
    document.body.style.overflow = "";
  }

  function onOutsideClick(e) {
    if (e.target === $modal[0]) onClose();
  }

  function initHandlers() {
    $container.off("click", ".close").on("click", ".close", onClose);

    $modal.off("click", onOutsideClick).on("click", onOutsideClick);
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
          <p>This trailer can't be embedded here.
            <a href="https://youtu.be/${trailerId}" target="_blank" rel="noopener">
              Watch on YouTube
            </a>
          </p>
        </div>`;
    }
    return `
      <div class="modal-trailer" style="padding:1rem; text-align:center;">
        <p>No trailer found.</p>
      </div>`;
  }

  function renderContents(movie, trailerId, embeddable) {
    const t = translations[window.currentLang] || {};

    const isOMDB = "Title" in movie;
    const title = isOMDB ? movie.Title : movie.title;
    const posterSrc = isOMDB
      ? movie.Poster && movie.Poster !== "N/A"
        ? movie.Poster
        : FALLBACK_POSTER
      : movie.poster_path
      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
      : FALLBACK_POSTER;

    const trailerSection = buildTrailerSection(trailerId, embeddable);

    const html = `
  <div class="modal-header">
    <span class="close">&times;</span>
  </div>
  <div class="modal-body" style="display:flex; gap:1rem; max-height:60vh; overflow-y:auto;">
    <div class="modal-poster" style="flex-shrink:0;">
      <img
        src="${posterSrc}"
        alt="${title} Poster"
        onerror="this.onerror=null;this.src= '${FALLBACK_POSTER}';"
        style="width:100%; max-width:342px; object-fit:cover;"
      >
    </div>
    <div class="modal-info" style="flex-grow:1;">
      <!-- MOVIE TITLE MOVED HERE -->
      <h2 class="movie-title">${title}</h2>
      
      <div class="details">
        ${
          isOMDB
            ? `
          <!-- REMOVED DUPLICATE TITLE FROM HERE -->
          <p><strong>${t.genreLabel || "Genre"}:</strong> ${
                movie.Genre || "N/A"
              }</p>
          <p><strong>${t.actorsLabel || "Actors"}:</strong> ${
                movie.Actors || "N/A"
              }</p>
          <p><strong>${t.releaseDateLabel || "Released"}:</strong> ${
                movie.Released || "N/A"
              }</p>
          <p><strong>${t.imdbRatingLabel || "Rating"}:</strong> ${
                movie.imdbRating || "N/A"
              }</p>
          <p><strong>${t.descriptionLabel || "Plot"}:</strong> ${
                movie.Plot || "N/A"
              }</p>
        `
            : `
          <p><strong>${t.genreLabel || "Genre"}:</strong> ${
                movie.genres?.map((g) => g.name).join(", ") || "N/A"
              }</p>
          <p><strong>${t.releaseDateLabel || "Released"}:</strong> ${
                movie.release_date || "N/A"
              }</p>
          <p><strong>${t.imdbRatingLabel || "Rating"}:</strong> ${
                movie.vote_average || "N/A"
              }</p>
          <p><strong>${t.descriptionLabel || "Overview"}:</strong> ${
                movie.overview || "N/A"
              }</p>
        `
        }
      </div>
    </div>
  </div>
  ${trailerSection}
`;

    $container.html(html);
    initHandlers();
    document.body.style.overflow = "hidden";
    $modal.show();
  }

  function showLoading() {
    const t = translations[window.currentLang] || {};
    $container.html(`
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body" style="text-align:center; padding:2rem;">
        <div class="spinner"></div>
        <p>${t.loadingText || "Loading..."}</p>
      </div>
    `);
    initHandlers();
    $modal.show();
  }

  function showError(message) {
    const t = translations[window.currentLang] || {};
    $container.html(`
      <div class="modal-header">
        <span class="close">&times;</span>
      </div>
      <div class="modal-body" style="text-align:center; padding:2rem;">
        <p style="color:red;">${message}</p>
        <button class="close-btn" style="margin-top:1rem; padding:8px 16px;">
          ${t.closeLabel || "Close"}
        </button>
      </div>
    `);
    initHandlers();
    $modal.show();
  }

  return {
    init() {
      initHandlers();
    },
    showLoading,
    showError,
    show(movie, trailerId = null, embeddable = false) {
      lastData = { movie, trailerId, embeddable };
      renderContents(movie, trailerId, embeddable);
    },
    showTMDBOnly(detail) {
      this.show(detail);
    },
    rerender() {
      if (lastData)
        this.show(lastData.movie, lastData.trailerId, lastData.embeddable);
    },
  };
})();
