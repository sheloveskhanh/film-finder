import { renderFavoritesDropdown } from "./uiHelpers.js";

export const Favorites = {
  get() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  },

  add(movieObj) {
    const favs = this.get();
    const PLACEHOLDER_IMAGE = "https://via.placeholder.com/92x138?text=No+Image+Available";

    // Convert IDs to strings for reliable comparison
    const exists = favs.some(m => 
      (m.imdbID && String(m.imdbID) === String(movieObj.imdbID)) || 
      (m.id && String(m.id) === String(movieObj.id))
    );
    
    if (exists) {
      return false; // Indicate duplicate
    }
    
    const standardizedMovie = {
      imdbID: movieObj.imdbID || movieObj.id,
      Title: movieObj.Title || movieObj.title,
      Year: movieObj.Year || movieObj.release_date?.slice(0, 4),
      Poster: movieObj.Poster || 
        (movieObj.poster_path ? `https://image.tmdb.org/t/p/w92${movieObj.poster_path}` : PLACEHOLDER_IMAGE),
      // Add TMDB-specific fields
      id: movieObj.id,
      title: movieObj.title || movieObj.Title,
      release_date: movieObj.release_date,
      poster_path: movieObj.poster_path
    };
    
    favs.push(standardizedMovie);
    localStorage.setItem("favorites", JSON.stringify(favs));
    this.render();
    return true; // Indicate success
  },

  remove(id) {
    let favs = this.get();
    favs = favs.filter(m => String(m.imdbID) !== String(id) && String(m.id) !== String(id));
    localStorage.setItem("favorites", JSON.stringify(favs));
    this.render();
  },

  render() {
    renderFavoritesDropdown(this.get());
  }
};