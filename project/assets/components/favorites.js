// assets/components/favorites.js

import {
  renderFavoritesDropdown
} from "./uiHelpers.js";

export const Favorites = {
  add(movieObj, callback) {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (!favs.some(m => m.imdbID === movieObj.imdbID)) {
      favs.push(movieObj);
      localStorage.setItem("favorites", JSON.stringify(favs));
    }
    if (typeof callback === "function") callback();
  },
  remove(imdbID, callback) {
    let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    favs = favs.filter(m => m.imdbID !== imdbID);
    localStorage.setItem("favorites", JSON.stringify(favs));
    if (typeof callback === "function") callback();
  },
  render: renderFavoritesDropdown
};
