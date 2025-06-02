import { translations } from "./lang.js";
import { Favorites } from "./favorites.js";

export function Results(selector, onCardClick) {
  let $results;
  let $pagination;
  let currentPage = 1;
  let totalPages = 1;

  function init() {
    $results = $(selector);

    $results.on("click", ".info-icon", function (e) {
      e.stopPropagation();
      const id = $(this).closest(".result-card").data("id");
      if (typeof onCardClick === "function") {
        onCardClick(id);
      }
    });

    $results.on("click", ".add-fav", function (e) {
      e.stopPropagation();
      const $card = $(this).closest(".result-card");
      const imdbID = $card.data("id");
      const title = $card.data("title");

      if (!imdbID || !title) {
        alert("Unable to add to favorites right now. Please try again.");
        return;
      }

      Favorites.add({ imdbID, Title: title }, () => {
        Favorites.render();
      });
    });

    $pagination = $("#pagination");
  }

  function render(movies = [], page = 1, total = 1) {
    currentPage = page;
    totalPages = total;

    const html = movies
      .map((movie) => {
        const movieID = movie.imdb_id || movie.id;
        const posterUrl = movie.poster_path
          ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
          : "https://placehold.co/180x260?text=No+Image";

        const year = movie.release_date ? movie.release_date.slice(0, 4) : "";

        const addFavLabel =
          translations[window.currentLang]?.addFavorite || "Add to Favorites";
        const infoLabel =
          translations[window.currentLang]?.moreInfo || "More Info";

        return `
          <div 
            class="result-card" 
            data-id="${movieID}" 
            data-title="${movie.title.replace(/"/g, "&quot;")}"
            data-year="${year}"
          >
            <div class="poster-container">
              <img src="${posterUrl}" alt="${movie.title} Poster"
                   onerror="this.onerror=null; this.src='https://placehold.co/180x260?text=No+Image';" />
            </div>
            <div class="card-details">
              <h3 class="title">${movie.title} ${year ? `(${year})` : ""}</h3>
              <button class="add-fav">${addFavLabel}</button>
              <button class="info-icon">${infoLabel}</button>
            </div>
          </div>
        `;
      })
      .join("");

    $results.html(html);
    let pagerHtml = "";
    for (let i = 1; i <= totalPages; i++) {
      pagerHtml += `
    <button 
      data-page="${i}" 
      ${i === currentPage ? 'class="active"' : ""}
    >
      ${i}
    </button>`;
    }
    $pagination.html(pagerHtml);
  }

  return { init, render };
}
