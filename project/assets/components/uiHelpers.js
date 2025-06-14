import { translations } from "./lang.js";

export function buildGenreListItem(genre) {
  return $(`<li data-id="${genre.id}">${genre.name}</li>`);
}

export function buildCountryListItem(country) {
  return $(
    `<li data-code="${country.iso_3166_1}">${country.english_name}</li>`
  );
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
    topRated: "#topRated-list",
    upcoming: "#upcoming-list",
    nowPlaying: "#nowPlaying-list",
    trending: "#trending-list",
  };

  const html = movieArray
    .slice(0, 12)
    .map((m) => {
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
   <div class="result-card" data-id="${m.id}" data-year="${year}">
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

// in uiHelpers.js
export function renderPager(current, total) {
  let html = "";

  // Prev
  html += current > 1
    ? `<button data-page="${current - 1}">Prev</button>`
    : `<button disabled>Prev</button>`;

  // Build a reduced list of page numbers + "…"
  const delta = 2;
  const pages = [];
  for (let i = 1; i <= total; i++) {
    // always show first 2 or last 2 pages
    if (i <= 2 || i > total - 2 ||
        // or within current±delta
        (i >= current - delta && i <= current + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  // Render those
  pages.forEach(p => {
    if (p === "...") {
      html += `<span class="ellipsis">…</span>`;
    } else if (p === current) {
      html += `<button class="active" disabled>${p}</button>`;
    } else {
      html += `<button data-page="${p}">${p}</button>`;
    }
  });

  // Next
  html += current < total
    ? `<button data-page="${current + 1}">Next</button>`
    : `<button disabled>Next</button>`;

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
