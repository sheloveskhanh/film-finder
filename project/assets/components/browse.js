// assets/components/browse.js

import { fetchCategory, fetchTrending } from "./tmdbServices.js";
import { renderBrowseTabs, renderPopularList } from "./uiHelpers.js";
import { translations } from "./lang.js";


const TAB_KEYS = [
  "topRated",    
  "upcoming",    
  "nowPlaying", 
  "trending"    
];

function buildTabsConfig(lang) {
  const t = translations[lang] || {};

  return [
    {
      key: "topRated",
      label: "Top Rated"
    },
    {
      key: "upcoming",
      label: t.incoming || "Upcoming"
    },
    {
      key: "nowPlaying",
      label: t.nowPlaying || "Now Playing"
    },
    {
      key: "trending",
      label: t.trendingLabel || "Trending"
    }
  ];
}

export function initBrowse(showCallback) {
  const tabs = buildTabsConfig(window.currentLang);

  renderBrowseTabs(tabs);

  $("#popular-tabs button").removeClass("active");
  $(`#popular-tabs button[data-cat="topRated"]`).addClass("active");
  showCallback("topRated");
  loadAndRenderCategory("topRated");

  $("#popular-tabs").on("click", "button", function () {
    $("#popular-tabs button").removeClass("active");
    $(this).addClass("active");

    const catKey = $(this).data("cat");
    showCallback(catKey);
    loadAndRenderCategory(catKey);
  });

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

export function translateBrowseTabs(showCallback) {
  const activeKey = $("#popular-tabs button.active").data("cat") || "topRated";

  const tabs = buildTabsConfig(window.currentLang);
  renderBrowseTabs(tabs);

  $("#popular-tabs button").removeClass("active");
  $(`#popular-tabs button[data-cat="${activeKey}"]`).addClass("active");

  showCallback(activeKey);
  loadAndRenderCategory(activeKey);

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

async function loadAndRenderCategory(categoryKey) {
  try {
    let moviesArray;

    if (categoryKey === "trending") {
      moviesArray = await fetchTrending();
    } else {
      moviesArray = await fetchCategory(categoryKey);
    }

    renderPopularList(categoryKey, moviesArray);
  }
  catch (err) {
    console.error(`Failed to load category "${categoryKey}":`, err);
  }
}
