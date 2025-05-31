import { translations } from "./lang.js";

export function buildGenreListItem(genre) {
  return $(`<li data-id="${genre.id}">${genre.name}</li>`);
}

/**
 * buildCountryListItem
 *   - Given a country object { iso_3166_1, english_name }, returns <li>.
 */
export function buildCountryListItem(country) {
  return $(`<li data-code="${country.iso_3166_1}">${country.english_name}</li>`);
}

/**
 * buildSortOptionItem
 *   - Accepts { value, label } and returns <li data-sort="value">label</li>
 */
export function buildSortOptionItem(option) {
  return $(`<li data-sort="${option.value}">${option.label}</li>`);
}

/**
 * renderBrowseTabs
 *   - Given an array of tabInfo = [ { key, label }, … ], replaces "#popular-tabs" HTML.
 *   - Returns nothing; just sets .html(…).
 */
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

/**
 * renderPopularList
 *   - Given a TMDB category key (e.g. "popular", "upcoming", etc.)
 *   - and an array of TMDB movie‐summary objects (with poster_path, title, id),
 *   - sets the HTML of the matching container (e.g. "#popular-list", "#upcoming-list", …).
 */
export function renderPopularList(category, movieArray) {
  // Map TMDB category keys to container IDs:
  const containerMap = {
    popular: "#popular-list",
    upcoming: "#upcoming-list",
    nowPlaying: "#now_playing-list",
    topRated: "#top_rated-list",
  };

  const html = movieArray
    .slice(0, 12)
    .map((m) => {
      const imgUrl = m.poster_path
        ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
        : "https://via.placeholder.com/180x260?text=No+Image";
      return `
      <div class="pop-card" data-id="${m.id}">
        <img src="${imgUrl}" alt="${m.title}"/>
        <div class="card-overlay">
          <span class="info-icon">ℹ️</span>
        </div>
      </div>`;
    })
    .join("");
  $(containerMap[category]).html(html);
}

/**
 * buildResultCard
 *   - Given a TMDB “movie summary” object, returns a string of HTML for one ".result-card".
 *   - e.g. used inside renderResults() to set $results.html(…).
 */
export function buildResultCard(m) {
  const posterUrl = m.poster_path
    ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
    : "https://via.placeholder.com/180x260?text=No+Image";
  const year = m.release_date?.slice(0, 4) || "";
  return `
  <div class="result-card" data-tmdb-id="${m.id}" data-year="${year}">
    <img src="${posterUrl}" alt="${m.title} poster">
    <div class="card-overlay"><span class="info-icon">ℹ️</span></div>
    <div class="result-info">
      <div class="title">${m.title} (${year})</div>
      <button class="add-fav">${translations[currentLang].addFavorite}</button>
    </div>
  </div>`;
}

/**
 * renderResults
 *   - Given an array of TMDB “movie summary” objects, builds the HTML of all result cards.
 */
export function renderResults(movieList) {
  const html = movieList.map((m) => buildResultCard(m)).join("");
  $("#results").html(html);
}

/**
 * renderPager
 *   - Given current page and total pages, sets #pagination .html(…).
 */
export function renderPager(current, total) {
  const prevDisabled = current === 1 ? 'disabled aria-disabled="true"' : "";
  const nextDisabled = current === total ? 'disabled aria-disabled="true"' : "";
  const html = `
    <button ${prevDisabled} data-page="${current - 1}" aria-label="Previous page">Prev</button>
    <span aria-live="polite">Page ${current} of ${total}</span>
    <button ${nextDisabled} data-page="${current + 1}" aria-label="Next page">Next</button>`;
  $("#pagination").html(html);
}

/**
 * renderFavoritesDropdown
 *   - Builds the favorites list in the dropdown based on localStorage. 
 */
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
