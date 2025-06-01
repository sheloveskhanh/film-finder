// assets/components/browse.js

import { fetchCategory, fetchTrending } from "./tmdbServices.js";
import { renderBrowseTabs, renderPopularList } from "./uiHelpers.js";
import { translations } from "./lang.js";

//───────────────────────────────────────────────────────────────────────────────
// 1) TOP‐LEVEL: just the four keys. We don’t touch `translations[...]` here yet.
//───────────────────────────────────────────────────────────────────────────────
const TAB_KEYS = [
  "topRated",    // “Top Rated”
  "upcoming",    // “Upcoming”
  "nowPlaying",  // “Now Playing”
  "trending"     // “Trending”
];

/**
 * buildTabsConfig(lang)
 *   - Given a language code (e.g. "en", "es", "fr", etc.), return an array of
 *     { key, label } objects in exactly the order TAB_KEYS lists them.
 */
function buildTabsConfig(lang) {
  // Grab the translation table for this lang. (If missing, use an empty object.)
  const t = translations[lang] || {};

  return [
    {
      key: "topRated",
      // We have no built‐in translation for “Top Rated” in lang.js, so hard‐code it:
      label: "Top Rated"
    },
    {
      key: "upcoming",
      // If translations[lang].incoming exists, use it; otherwise “Upcoming”:
      label: t.incoming || "Upcoming"
    },
    {
      key: "nowPlaying",
      label: t.nowPlaying || "Now Playing"
    },
    {
      key: "trending",
      // If your lang.js has “trendingLabel”, use that; otherwise “Trending”:
      label: t.trendingLabel || "Trending"
    }
  ];
}

/**
 * initBrowse(showCallback)
 *
 *   showCallback(catKey):
 *     – should hide _all_ .category-carousel wrappers,
 *       then do something like
 *         $(`.category-carousel[data-cat="${catKey}"]`).show()
 *
 *   This function:
 *     1) Builds the array of { key, label } via buildTabsConfig(window.currentLang)
 *        and calls renderBrowseTabs(…).
 *     2) Hooks up a delegated click handler on #popular-tabs, so that when you click
 *        a tab, it runs showCallback(catKey) and then loads+renders that category.
 *     3) On startup, it automatically “clicks” the first tab (“topRated”) so that
 *        carousel is visible by default.
 *     4) Attaches scroll arrows (Prev/Next) for each actual “.category-carousel”.
 */
export function initBrowse(showCallback) {
  // 1) Build a fresh tab config using the current language:
  const tabs = buildTabsConfig(window.currentLang);

  // 2) Render those tab buttons into #popular-tabs:
  renderBrowseTabs(tabs);

  // 3) Activate the first tab by default (the “topRated” tab)
  $("#popular-tabs button").removeClass("active");
  $(`#popular-tabs button[data-cat="topRated"]`).addClass("active");
  showCallback("topRated");
  loadAndRenderCategory("topRated");

  // 4) When the user clicks any tab:
  $("#popular-tabs").on("click", "button", function () {
    $("#popular-tabs button").removeClass("active");
    $(this).addClass("active");

    const catKey = $(this).data("cat");
    showCallback(catKey);
    loadAndRenderCategory(catKey);
  });

  // 5) Wire up the Prev/Next arrows for each of the four carousels:
  TAB_KEYS.forEach(catKey => {
    const prevBtn = `#${catKey}-prev`;
    const nextBtn = `#${catKey}-next`;
    const listId  = `#${catKey}-list`;

    $(prevBtn).off("click").on("click", () => {
      $(listId).animate({ scrollLeft: "-=" + $(listId).width() }, 400);
    });
    $(nextBtn).off("click").on("click", () => {
      $(listId).animate({ scrollLeft: "+=" + $(listId).width() }, 400);
    });
  });
}

/**
 * translateBrowseTabs(showCallback)
 *
 *   Call this whenever the language changes (i.e. user picks a different <select>).
 *   It rebuilds the { key, label } array under the new translations, re‐renders the tabs,
 *   and rebinds click‐handlers. Finally, it re‐activates whichever carousel was active.
 */
export function translateBrowseTabs(showCallback) {
  // Grab the currently active tab’s key before we nuke the buttons:
  const activeKey = $("#popular-tabs button.active").data("cat") || "topRated";

  // Rebuild the array under the new language, then render and reinitialize.
  const tabs = buildTabsConfig(window.currentLang);
  renderBrowseTabs(tabs);

  // Re‐apply “active” class to whichever was active previously (or default to topRated)
  $("#popular-tabs button").removeClass("active");
  $(`#popular-tabs button[data-cat="${activeKey}"]`).addClass("active");

  // Show / load that category again:
  showCallback(activeKey);
  loadAndRenderCategory(activeKey);

  // Re‐hook Prev/Next buttons (because we re‐rendered the tab buttons)
  TAB_KEYS.forEach(catKey => {
    const prevBtn = `#${catKey}-prev`;
    const nextBtn = `#${catKey}-next`;
    const listId  = `#${catKey}-list`;

    $(prevBtn).off("click").on("click", () => {
      $(listId).animate({ scrollLeft: "-=" + $(listId).width() }, 400);
    });
    $(nextBtn).off("click").on("click", () => {
      $(listId).animate({ scrollLeft: "+=" + $(listId).width() }, 400);
    });
  });
}

/**
 * loadAndRenderCategory(catKey)
 *   – If catKey === "trending", call fetchTrending() → array of movies.
 *   – Otherwise call fetchCategory(catKey) → array of movies.
 *   – Then pass that array + catKey into renderPopularList(catKey, movies).
 */
async function loadAndRenderCategory(categoryKey) {
  try {
    let moviesArray;

    if (categoryKey === "trending") {
      moviesArray = await fetchTrending();
    } else {
      moviesArray = await fetchCategory(categoryKey);
    }

    // Finally, render into the correct “#…-list” container via uiHelpers:
    renderPopularList(categoryKey, moviesArray);
  }
  catch (err) {
    console.error(`Failed to load category "${categoryKey}":`, err);
  }
}
