const translations = {
  en: {
    title: "Movie App",
    bannerTitle: "Find Your Next Movie Obsession",
    bannerSub:
      "From indie gems to blockbuster hits—find the stories that move you",
    searchPlaceholder: "Search for movies...",
    search: "Search",
    addFavorite: "Add to Favorites",
    yearRange: "Year Range",
    from: "From",
    to: "To",
    sortBy: "Sort by",
    country: "Country",
    genre: "Genre",
    clearFilters: "Clear Filters",
    topMovies: "Top Movies",
    incoming: "Incoming",
    trendingLabel: "Trending",
    popularAllTime: "Popular All Time",
    nowPlaying: "Now Playing",
    themeToggle: "Toggle Theme",
    filterYearRange: "Year Range",
    filterFrom: "From",
    filterDash: "–",
    filterTo: "To",
    filterSortBy: "Sort by ▾",
    filterCountry: "Country ▾",
    filterGenre: "Genre ▾",
    filterClear: "Clear Filters",
    genreLabel: "Genre",
    actorsLabel: "Actors",
    releaseDateLabel: "Release Date",
    imdbRatingLabel: "IMDb Rating",
    descriptionLabel: "Description",
     sortByLabel:        "Sort by ▾",
    sortTitleAZ:        "Title (A–Z)",
    sortHighestRated:   "Highest Rated",
    sortLowestRated:    "Lowest Rated",
  },
  es: {
    title: "Explorador de Películas",
    bannerTitle: "Encuentra tu próxima obsesión cinematográfica",
    bannerSub:
      "Desde joyas independientes hasta éxitos taquilleros—encuentra las historias que te conmueven",
    searchPlaceholder: "Buscar películas...",
    search: "Buscar",
    addFavorite: "Añadir a favoritos",
    yearRange: "Rango de Años",
    from: "Desde",
    to: "Hasta",
    sortBy: "Ordenar por",
    country: "País",
    genre: "Género",
    clearFilters: "Limpiar filtros",
    topMovies: "Mejores Películas",
    incoming: "Próximas",
    trendingLabel: "Tendencias",
    popularAllTime: "Populares de Siempre",
    nowPlaying: "En Cines",
    themeToggle: "Cambiar Tema",
    filterYearRange: "Rango de Años",
    filterFrom: "Desde",
    filterDash: "–",
    filterTo: "Hasta",
    filterSortBy: "Ordenar ▾",
    filterCountry: "País ▾",
    filterGenre: "Género ▾",
    filterClear: "Borrar filtros",
    genreLabel: "Género",
    actorsLabel: "Actores",
    releaseDateLabel: "Fecha de estreno",
    imdbRatingLabel: "Calificación IMDb",
    descriptionLabel: "Descripción",
    sortByLabel:        "Ordenar ▾",
    sortTitleAZ:        "Título (A–Z)",
    sortHighestRated:   "Calificación más alta",
    sortLowestRated:    "Calificación más baja",
  },
  fr: {
    title: "Explorateur de Films",
    bannerTitle: "Trouvez votre prochaine obsession cinématographique",
    bannerSub:
      "Des perles indépendantes aux blockbusters—trouvez les histoires qui vous émeuvent",
    searchPlaceholder: "Rechercher des films...",
    search: "Rechercher",
    themeToggle: "Changer le thème",
    filterYearRange: "Plage d'années",
    filterFrom: "De",
    filterDash: "–",
    filterTo: "À",
    filterSortBy: "Trier ▾",
    filterCountry: "Pays ▾",
    filterGenre: "Genre ▾",
    filterClear: "Effacer les filtres",
    browseTitle: "Explorer",
    topMovies: "Meilleurs films",
    incoming: "À venir",
    popularAllTime: "Populaires de tous les temps",
    nowPlaying: "En salles",
    addFavorite: "Ajouter aux favoris",
    removeFavorite: "Supprimer des favoris",
    genreLabel: "Genre",
    actorsLabel: "Acteurs",
    releaseDateLabel: "Date de sortie",
    imdbRatingLabel: "Note IMDb",
    descriptionLabel: "Description",
    sortByLabel:        "Trier ▾",
    sortTitleAZ:        "Titre (A–Z)",
    sortHighestRated:   "Mieux notés",
    sortLowestRated:    "Moins notés",
  },
  de: {
    title: "Film-Explorer",
    bannerTitle: "Finden Sie Ihre nächste Filmobession",
    bannerSub:
      "Von Indie-Perlen bis Blockbuster-Hits – finden Sie die Geschichten, die Sie berühren",
    searchPlaceholder: "Nach Filmen suchen...",
    search: "Suchen",
    themeToggle: "Thema umschalten",
    filterYearRange: "Jahresbereich",
    filterFrom: "Von",
    filterDash: "–",
    filterTo: "Bis",
    filterSortBy: "Sortieren ▾",
    filterCountry: "Land ▾",
    filterGenre: "Genre ▾",
    filterClear: "Filter zurücksetzen",
    browseTitle: "Durchsuchen",
    topMovies: "Top-Filme",
    incoming: "Demnächst",
    popularAllTime: "Beliebt aller Zeiten",
    nowPlaying: "Jetzt im Kino",
    addFavorite: "Zu Favoriten hinzufügen",
    removeFavorite: "Aus Favoriten entfernen",
    genreLabel: "Genre",
    actorsLabel: "Schauspieler",
    releaseDateLabel: "Erscheinungsdatum",
    imdbRatingLabel: "IMDb-Bewertung",
    descriptionLabel: "Beschreibung",
    sortByLabel:        "Sortieren ▾",
    sortTitleAZ:        "Titel (A–Z)",
    sortHighestRated:   "Bestbewertet",
    sortLowestRated:    "Schlecht bewertet",
  },
};

function applyTranslations(lang) {

  $("[data-i18n]").each(function () {
    const key = $(this).data("i18n");
    $(this).text(translations[lang][key] || "");
  });

  $("[data-i18n-placeholder]").each(function () {
    const key = $(this).data("i18n-placeholder");
    $(this).attr("placeholder", translations[lang][key] || "");
  });
}

function applyFilterTranslations(lang) {
  // Example: update a button’s text that wasn’t covered by data-i18n
  // If you have elements like: <button id="sort-button">Sort by ▾</button>
  // you could do:
  $("#sort-button").text(translations[lang].filterSortBy);
  $("#country-button").text(translations[lang].filterCountry);
  $("#genre-button-2").text(translations[lang].filterGenre);
  $("#clear-filters").text(translations[lang].filterClear);
}

export {
  translations,
  applyTranslations,
  applyFilterTranslations,
};
