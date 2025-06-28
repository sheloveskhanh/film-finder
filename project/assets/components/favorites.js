import { renderFavoritesDropdown } from "./uiHelpers.js";

export const Favorites = {
  get() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  },

  add(movieObj) {
    const favs = this.get();
    
    // Handle both TMDB and OMDB data structures
    const exists = favs.some(m => 
      (m.imdbID && m.imdbID === movieObj.imdbID) || 
      (m.id && m.id === movieObj.id)
    );
    
    if (!exists) {
      // Standardize the movie object before saving
      const standardizedMovie = {
        imdbID: movieObj.imdbID || movieObj.id,
        Title: movieObj.Title || movieObj.title,
        Year: movieObj.Year || movieObj.release_date?.slice(0, 4),
        Poster: movieObj.Poster || 
          (movieObj.poster_path ? `https://image.tmdb.org/t/p/w92${movieObj.poster_path}` : PLACEHOLDER_IMAGE)
      };
      
      favs.push(standardizedMovie);
      localStorage.setItem("favorites", JSON.stringify(favs));
    }
    this.render();
  },

  remove(id) {
    let favs = this.get();
    favs = favs.filter(m => m.imdbID !== id && m.id !== id);
    localStorage.setItem("favorites", JSON.stringify(favs));
    this.render();
  },

  render() {
    renderFavoritesDropdown(this.get());
  }
};