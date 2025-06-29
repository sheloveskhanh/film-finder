import { translations } from "./lang.js";

// Constants
const PLACEHOLDER_IMAGE = "assets/image/no-image.jpg";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p";
const currentLang = window.currentLang || 'en';

// Image sizes for responsive loading (adjust as needed)
const IMAGE_SIZES = {
  small: 'w185',
  medium: 'w342',
  large: 'w500'
};

// Skeleton loader HTML templates
const SKELETON_TEMPLATES = {
  card: `
    <div class="result-card skeleton">
      <div class="skeleton-img"></div>
      <div class="skeleton-overlay"></div>
      <div class="skeleton-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  `,
  popularCard: `
    <div class="pop-card skeleton">
      <div class="skeleton-img"></div>
      <div class="skeleton-overlay"></div>
    </div>
  `
};

// Helper functions
function getPosterUrl(path, size = 'medium') {
  if (!path) return PLACEHOLDER_IMAGE;
  return `${POSTER_BASE_URL}/${IMAGE_SIZES[size]}${path}`;
}

function handleImageError(img) {
  img.onerror = null;
  img.src = PLACEHOLDER_IMAGE;
  img.loading = 'eager'; // No need for lazy loading if we're using placeholder
}

function renderSkeletons(container, count, type = 'card') {
  const skeletons = Array(count).fill(SKELETON_TEMPLATES[type]).join('');
  $(container).html(skeletons);
}

// List builders
export function buildGenreListItem(genre) {
  return $(`<li data-id="${genre.id}">${genre.name}</li>`);
}

export function buildCountryListItem(country) {
  return $(`<li data-code="${country.iso_3166_1}">${country.english_name}</li>`);
}

export function buildSortOptionItem(option) {
  return $(`<li data-sort="${option.value}">${option.label}</li>`);
}

// Tab rendering
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

// Popular lists
export function renderPopularList(category, movieArray) {
  const containerMap = {
    topRated: "#topRated-list",
    upcoming: "#upcoming-list",
    nowPlaying: "#nowPlaying-list",
    trending: "#trending-list",
  };

  const container = containerMap[category];
  const count = Math.min(12, movieArray.length);
  
  // Show skeletons while loading
  renderSkeletons(container, count, 'popularCard');

  // Load real content after a brief delay (simulating network request)
  setTimeout(() => {
    const html = movieArray
      .slice(0, 12)
      .map((m) => {
        const imgUrl = m.poster_path 
          ? getPosterUrl(m.poster_path, 'small')
          : PLACEHOLDER_IMAGE;
        
        return `
          <div class="pop-card" data-id="${m.id}">
            <img 
              src="${imgUrl}" 
              alt="${m.title}"
              loading="lazy"
              onerror="handleImageError(this)"
              srcset="
                ${getPosterUrl(m.poster_path, 'small')} 185w,
                ${getPosterUrl(m.poster_path, 'medium')} 342w,
                ${getPosterUrl(m.poster_path, 'large')} 500w
              "
              sizes="(max-width: 600px) 185px, 342px"
            >
            <div class="card-overlay">
              <button class="info-icon" aria-label="More info">ℹ️</button>
            </div>
          </div>`;
      })
      .join("");

    $(container).html(html);
  }, 300); // Simulate network delay
}

// Result cards
export function buildResultCard(m) {
  const year = m.release_date?.slice(0, 4) || "";
  const imgUrl = m.poster_path 
    ? getPosterUrl(m.poster_path)
    : PLACEHOLDER_IMAGE;

  return `
    <div class="result-card" data-id="${m.id}" data-year="${year}">
      <img
        src="${imgUrl}"
        alt="${m.title} poster"
        loading="lazy"
        onerror="handleImageError(this)"
        srcset="
          ${getPosterUrl(m.poster_path, 'small')} 185w,
          ${getPosterUrl(m.poster_path, 'medium')} 342w,
          ${getPosterUrl(m.poster_path, 'large')} 500w
        "
        sizes="(max-width: 600px) 185px, 342px"
      >
      <div class="card-overlay">
        <button class="info-icon" aria-label="More info">ℹ️</button>
      </div>
      <div class="result-info">
        <div class="title">${m.title} (${year})</div>
        <button class="add-fav">${translations[currentLang].addFavorite}</button>
      </div>
    </div>`;
}

// Results rendering
export function renderResults(movieList) {
  // Show skeletons while loading
  renderSkeletons('#results', movieList.length);
  
  // Load real content after a brief delay
  setTimeout(() => {
    const fragment = document.createDocumentFragment();
    
    movieList.forEach(m => {
      if (!m.id || !m.title) return; // Skip invalid entries
      
      const card = $(buildResultCard(m))[0];
      fragment.appendChild(card);
    });
    
    $("#results").empty().append(fragment);
  }, 300); // Simulate network delay
}

// Pagination
export function renderPager(current, total) {
  let html = '';

  // Previous button
  html += current > 1
    ? `<button data-page="${current - 1}" aria-label="Previous page">Prev</button>`
    : `<button disabled aria-hidden="true">Prev</button>`;

  // Page numbers with ellipsis
  const delta = 2;
  const pages = [];
  
  for (let i = 1; i <= total; i++) {
    if (i <= 2 || i > total - 2 || (i >= current - delta && i <= current + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  // Render page numbers
  pages.forEach(p => {
    if (p === "...") {
      html += `<span class="ellipsis" aria-hidden="true">…</span>`;
    } else if (p === current) {
      html += `<button class="active" disabled aria-current="page">${p}</button>`;
    } else {
      html += `<button data-page="${p}" aria-label="Page ${p}">${p}</button>`;
    }
  });

  // Next button
  html += current < total
    ? `<button data-page="${current + 1}" aria-label="Next page">Next</button>`
    : `<button disabled aria-hidden="true">Next</button>`;

  $("#pagination").html(html);
}

export function renderFavoritesDropdown(favs = []) {
  try {
    const $list = $("#favorites-list");
    
    if (!favs.length) {
      $list.html(`<li>${translations[currentLang].noFavorites}</li>`);
      return;
    }

    const fragment = document.createDocumentFragment();
    
    favs.forEach(movie => {
      // Skip invalid entries
      if (!movie || (!movie.imdbID && !movie.id)) return;
      
      const li = document.createElement('li');
      li.dataset.id = movie.imdbID || movie.id;
      
      // Use the standardized properties
      li.innerHTML = `
        <img src="${movie.Poster || PLACEHOLDER_IMAGE}" 
             alt="${movie.Title}" 
             loading="lazy"
             onerror="handleImageError(this)">
        <span>${movie.Title}${movie.Year ? ` (${movie.Year})` : ''}</span>
        <button class="remove-fav" aria-label="Remove favorite">&times;</button>
      `;
      
      fragment.appendChild(li);
    });

    $list.empty().append(fragment);
    
    // Update favorites count if the element exists
    const $count = $("#favorites-count");
    if ($count.length) {
      $count.text(favs.length);
    }
    
  } catch (e) {
    console.error("Error rendering favorites:", e);
    $("#favorites-list").html(`<li class="error">${translations[currentLang].favoritesError}</li>`);
  }
}