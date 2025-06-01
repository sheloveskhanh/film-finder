export function Favorites() {
  const STORAGE_KEY = 'favorites';

  function load() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function render(onRemove = () => {}) {
    const favs = load();
    const items = favs.map(m =>
      `<li data-id="${m.imdbID}">${m.Title} <button class="remove-fav">x</button></li>`
    ).join('');
    $('#favorites-list').html(items);
    $('#favorites-list').off('click').on('click', '.remove-fav', function() {
      const id = $(this).closest('li').data('id');
      onRemove(id);
    });
  }

  function add(movie, onUpdate) {
    const favs = load();
    if (!favs.find(m => m.imdbID === movie.imdbID)) {
      favs.push(movie);
      save(favs);
      onUpdate(favs);
    }
  }

  function remove(id, onUpdate) {
    let favs = load();
    favs = favs.filter(m => m.imdbID !== id);
    save(favs);
    onUpdate(favs);
  }

  return { render, add, remove };
}
