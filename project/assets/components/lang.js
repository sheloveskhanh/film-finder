const translations = {
  en: {
    title: "Movie App",
    header: "Movie Explorer",
    search: "Search",
    searchPlaceholder: "Search for movies...",
    favorites: "Favorites",
    addFavorite: "Add to Favorites",
    removeFavorite: "Remove"
  },
  es: {
    title: "Aplicación de Películas",
    header: "Explorador de Películas",
    search: "Buscar",
    searchPlaceholder: "Busca películas...",
    favorites: "Favoritos",
    addFavorite: "Agregar a Favoritos",
    removeFavorite: "Eliminar"
  }
};

function applyTranslations(lang) {
  $('[data-i18n]').each(function() {
    const key = $(this).data('i18n');
    $(this).text(translations[lang][key] || '');
  });
  $('[data-i18n-placeholder]').each(function() {
    const key = $(this).data('i18n-placeholder');
    $(this).attr('placeholder', translations[lang][key] || '');
  });
}
