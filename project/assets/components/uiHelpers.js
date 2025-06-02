import { translations } from "./lang.js";

export function buildGenreListItem(genre) {
  return $(`<li data-id="${genre.id}">${genre.name}</li>`);
}

export function buildCountryListItem(country) {
  return $(`<li data-code="${country.iso_3166_1}">${country.english_name}</li>`);
}

export function buildSortOptionItem(option) {
  return $(`<li data-sort="${option.value}">${option.label}</li>`);
}

export function renderBrowseTabs(tabs) {
  const html = tabs
    .map(
      (tab, i) =>
        `<button data-cat="${tab.key}"${i === 0 ? ' class="active"' : ""}>${
          tab.label
        }</button>`
    )
    .join("");
  $("#popular-tabs").html(html);
}

export function renderPopularList(category, movieArray) {
  const containerMap = {
    topRated:   "#topRated-list",
    upcoming:   "#upcoming-list",
    nowPlaying: "#nowPlaying-list",
    trending:   "#trending-list"
  };

  const html = movieArray
    .slice(0, 12)
    .map(m => {
      const imgUrl = m.poster_path
        ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
        : "https://via.placeholder.com/180x260?text=No+Image";
      return `
        <div class="pop-card" data-id="${m.id}">
          <img src="${imgUrl}" alt="${m.title}" />
          <div class="card-overlay"><span class="info-icon">ℹ️</span></div>
        </div>`;
    })
    .join("");

  $(containerMap[category]).html(html);
}


export function buildResultCard(m) {
  const posterUrl = m.poster_path
    ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
    : "assets/image/no-image.jpg";

  const year = m.release_date?.slice(0, 4) || "";
  return `
    <div class="result-card" data-tmdb-id="${m.id}" data-year="${year}">
      <img
        src="${posterUrl}"
        alt="${m.title} poster"
        onerror="this.onerror=null; this.src='assets/image/no-image.jpg';"
      >
      <div class="card-overlay"><span class="info-icon">ℹ️</span></div>
      <div class="result-info">
        <div class="title">${m.title} (${year})</div>
        <button class="add-fav">${translations[currentLang].addFavorite}</button>
      </div>
    </div>`;
}

export function renderResults(movieList) {
  const html = movieList.map((m) => buildResultCard(m)).join("");
  $("#results").html(html);
}

export function renderPager(current, total) {
  const prevDisabled = current === 1 ? 'disabled aria-disabled="true"' : "";
  const nextDisabled = current === total ? 'disabled aria-disabled="true"' : "";
  const html = `
    <button ${prevDisabled} data-page="${current - 1}" aria-label="Previous page">Prev</button>
    <span aria-live="polite">Page ${current} of ${total}</span>
    <button ${nextDisabled} data-page="${current + 1}" aria-label="Next page">Next</button>`;
  $("#pagination").html(html);
}

export function renderFavoritesDropdown() {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!favs.length) {
    $("#favorites-list").html("<li>(no favorites yet)</li>");
  } else {
    const html = favs
      .map(
        (m) =>
          `<li data-id="${m.imdbID}"><span>${m.Title}</span>` +
          `<button class="remove-fav">&times;</button></li>`
      )
      .join("");
    $("#favorites-list").html(html);
  }
}
