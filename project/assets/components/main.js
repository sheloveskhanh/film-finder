$(function () {
  const OMDB_API_URL = "https://www.omdbapi.com/";
  const OMDB_API_KEY = "375878b3";
  const TMDB_API_URL = "https://api.themoviedb.org/3";
  const TMDB_API_KEY = "36b0465246018e127b54bfa7d47d965c";
  const TMDB_SEARCH = `${TMDB_API_URL}/search/movie`;
  const TMDB_DISCOVER = `${TMDB_API_URL}/discover/movie`;
  const YT_API_KEY = "AIzaSyBuOlxxyBOae6n3322Q1CCmf6t5pScyqfA";

  const POPULAR_URL = `${TMDB_API_URL}/movie/popular`;
  const TOP_RATED_URL = `${TMDB_API_URL}/movie/top_rated`;
  const UPCOMING_URL = `${TMDB_API_URL}/movie/upcoming`;
  const NOW_PLAYING_URL = `${TMDB_API_URL}/movie/now_playing`;

  window.currentLang = "en";
  applyTranslations(currentLang);
  $("#language-switch").on("change", function () {
    currentLang = this.value;
    applyTranslations(currentLang);
    renderFavoritesDropdown();
  });
  Favorites.render(renderFavoritesDropdown);
  MovieModal.init();

  const $searchInput = $("#search-input");
  const $searchButton = $("#search-button");
  const $results = $("#results");
  const $pagination = $('<div id="pagination"></div>').insertAfter($results);
  const $favButton = $("#favorites-button");
  const $favList = $("#favorites-list");
  const $clearFilters = $("#clear-filters");

  let filterState = {
    yearFrom: null,
    yearTo: null,
    sortBy: null,
    country: null,
    genres: [],
    page: 1,
  };

  const genreRev = {};
  $.getJSON(`${TMDB_API_URL}/genre/movie/list`, { api_key: TMDB_API_KEY }).done(
    (resp) =>
      resp.genres.forEach((g) => {
        genreRev[g.id] = g.name;
        $("#genre-list-2").append(`<li data-id="${g.id}">${g.name}</li>`);
      })
  );

  const countryMap = {};
  $.getJSON(`${TMDB_API_URL}/configuration/countries`, {
    api_key: TMDB_API_KEY,
  }).done((list) =>
    list.forEach((c) => {
      countryMap[c.iso_3166_1] = c.english_name;
      $("#country-list").append(
        `<li data-code="${c.iso_3166_1}">${c.english_name}</li>`
      );
    })
  );

  const sortOptions = [
    { value: "original_title.asc", label: "Title (A–Z)" },
    { value: "vote_average.desc", label: "Highest Rated" },
    { value: "vote_average.asc", label: "Lowest Rated" },
    { value: "vote_count.desc", label: "Most Rated" },
  ];
  sortOptions.forEach((o) =>
    $("#sort-list").append(`<li data-sort="${o.value}">${o.label}</li>`)
  );

  function closeAllDropdowns() {
    $(".dropdown-menu").hide();
  }
  $(document).on("click", closeAllDropdowns);

  $("#year-from, #year-to").on("input", () => {
    filterState.yearFrom = parseInt($("#year-from").val()) || null;
    filterState.yearTo = parseInt($("#year-to").val()) || null;
    filterState.page = 1;
    reload();
  });

  $("#sort-button").on("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#sort-list").toggle();
  });
  $("#sort-list").on("click", "li", function () {
    filterState.sortBy = $(this).data("sort");
    $("#sort-button").text(`Sort: ${$(this).text()} ▾`);
    filterState.page = 1;
    reload();
  });

  $("#country-button").on("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#country-list").toggle();
  });
  $("#country-list").on("click", "li", function () {
    $("#country-list li").removeClass("active");
    $(this).addClass("active");
    filterState.country = $(this).data("code");
    $("#country-button").text(`Country: ${$(this).text()} ▾`);
    filterState.page = 1;
    reload();
  });

  $("#genre-button-2").on("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    $("#genre-list-2").toggle();
  });
  $("#genre-list-2").on("click", "li", function () {
    $(this).toggleClass("active");
    filterState.genres = $("#genre-list-2 li.active")
      .map((i, el) => $(el).data("id"))
      .get();

    const names = filterState.genres.map((id) => genreRev[id]);
    let label;
    if (names.length === 0) label = "Genre ▾";
    else if (names.length <= 2) label = `Genre: ${names.join(", ")} ▾`;
    else {
      const firstTwo = names.slice(0, 2).join(", ");
      label = `Genre: ${firstTwo} +${names.length - 2} more ▾`;
    }
    $("#genre-button-2").text(label);
    filterState.page = 1;
    reload();
  });

  $clearFilters.on("click", () => {
    filterState = {
      yearFrom: null,
      yearTo: null,
      sortBy: null,
      country: null,
      genres: [],
      page: 1,
    };
    $("#year-from,#year-to").val("");
    $("#sort-button").text("Sort by ▾");
    $("#sort-list li").removeClass("active");
    $("#country-button").text("Country ▾");
    $("#country-list li").removeClass("active");
    $("#genre-button-2").text("Genre ▾");
    $("#genre-list-2 li").removeClass("active");
    reload();
  });

  function renderFavoritesDropdown() {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (!favs.length) {
      $("#favorites-list").html("<li>(no favorites yet)</li>");
    } else {
      $("#favorites-list").html(
        favs
          .map(
            (m) =>
              `<li data-id="${m.imdbID}"><span>${m.Title}</span>` +
              `<button class="remove-fav">&times;</button></li>`
          )
          .join("")
      );
    }
  }

  $favButton.on("click", (e) => {
    e.stopPropagation();
    $(".favorites-dropdown").toggleClass("open");
  });

  $(document).on("click", (e) => {
    if (!$(e.target).closest(".favorites-dropdown").length) {
      $(".favorites-dropdown").removeClass("open");
    }
  });

  renderFavoritesDropdown();

  $searchButton.on("click", () => {
    filterState.page = 1;
    reload();
  });
  $searchInput.on("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      filterState.page = 1;
      reload();
    }
  });

  function renderBrowseTabs() {
    const t = translations[currentLang];
    const tabs = [
      { key: "top_rated", label: t.topMovies },
      { key: "upcoming", label: t.incoming },
      { key: "popular", label: t.popularAllTime },
      { key: "now_playing", label: t.nowPlaying },
    ];
    $("#popular-tabs").html(
      tabs
        .map(
          (tab, i) =>
            `<button data-cat="${tab.key}"${i === 0 ? ' class="active"' : ""}>${
              tab.label
            }</button>`
        )
        .join("")
    );
  }

  function renderPopular(list) {
    const html = list
      .map((m) => {
        const img = m.poster_path
          ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
          : "https://via.placeholder.com/180x260?text=No+Image";

        return `
      <div class="pop-card" data-id="${m.id}">
        <img src="${img}" alt="${m.title}"/>
        <!-- overlay must be inside the card -->
        <div class="card-overlay">
          <span class="info-icon">ℹ️</span>
        </div>
      </div>`;
      })
      .join("");

    $("#popular-list").html(html);
  }

  function loadPopular(cat) {
    let url;
    switch (cat) {
      case "top_rated":
        url = TOP_RATED_URL;
        break;
      case "upcoming":
        url = UPCOMING_URL;
        break;
      case "now_playing":
        url = NOW_PLAYING_URL;
        break;
      default:
        url = POPULAR_URL;
    }
    $.getJSON(url, { api_key: TMDB_API_KEY, language: "en-US", page: 1 }).done(
      (resp) => renderPopular(resp.results.slice(0, 12))
    );
  }

  $("#popular-tabs").on("click", "button", function () {
    $("#popular-tabs button").removeClass("active");
    $(this).addClass("active");
    loadPopular($(this).data("cat"));
  });

  $("#popular-prev").on("click", () => {
    const $list = $("#popular-list");
    $list.animate({ scrollLeft: "-=" + $list.width() }, 400);
  });
  $("#popular-next").on("click", () => {
    const $list = $("#popular-list");
    $list.animate({ scrollLeft: "+=" + $list.width() }, 400);
  });

  function reload() {
    const q = $searchInput.val().trim();
    const hasFilters = Boolean(
      filterState.yearFrom ||
        filterState.yearTo ||
        filterState.sortBy ||
        filterState.country ||
        filterState.genres.length
    );
    $("#popular-section").toggle(!q && !hasFilters);

    if (q) {
      fetch50(
        TMDB_SEARCH,
        {
          api_key: TMDB_API_KEY,
          language: "en-US",
          query: q,
          include_adult: false,
        },
        filterState.page,
        (movies, page, total) => {
          renderResults(movies);
          renderPager(page, total);
          annotateTmdbDetails(movies);
        }
      );
    } else if (hasFilters) {
      fetch50(
        TMDB_DISCOVER,
        {
          api_key: TMDB_API_KEY,
          language: "en-US",
          sort_by: filterState.sortBy || "popularity.desc",
          "primary_release_date.gte": filterState.yearFrom
            ? `${filterState.yearFrom}-01-01`
            : undefined,
          "primary_release_date.lte": filterState.yearTo
            ? `${filterState.yearTo}-12-31`
            : undefined,
          with_genres: filterState.genres.length
            ? filterState.genres.join(",")
            : undefined,
          region: filterState.country || undefined,
        },
        filterState.page,
        (movies, page, total) => {
          renderResults(movies);
          renderPager(page, total);
          annotateTmdbDetails(movies);
        }
      );
    } else {
      $results.empty();
      $pagination.empty();
    }
  }

  function fetch50(url, params, userPage, onDone) {
    const perUser = 50,
      perTmdb = 20;
    const startIndex = (userPage - 1) * perUser;
    const endIndex = userPage * perUser - 1;
    const startPage = Math.floor(startIndex / perTmdb) + 1;
    const endPage = Math.floor(endIndex / perTmdb) + 1;
    const requests = [];
    for (let p = startPage; p <= endPage; p++) {
      requests.push($.getJSON(url, { ...params, page: p }));
    }
    Promise.all(requests).then((resList) => {
      const all = resList.flatMap((r) => r.results);
      const totalResults = resList[0].total_results;
      const totalUserPages = Math.ceil(totalResults / perUser);
      const offset = startIndex - (startPage - 1) * perTmdb;
      const pageItems = all.slice(offset, offset + perUser);
      onDone(pageItems, userPage, totalUserPages);
    });
  }

  function renderResults(list) {
    const html = list
      .map((m) => {
        const poster = m.poster_path
          ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
          : "https://via.placeholder.com/180x260?text=No+Image";
        return `
        <div class="result-card" data-id="${m.id}" data-year="${
          m.release_date?.slice(0, 4) || ""
        }">
          <img src="${poster}" alt="${m.title} poster">
          <div class="card-overlay"><span class="info-icon">ℹ️</span></div>
          <div class="result-info">
            <div class="title">${m.title} (${
          m.release_date?.slice(0, 4) || ""
        })</div>
            <button class="add-fav">${
              translations[currentLang].addFavorite
            }</button>
          </div>
        </div>`;
      })
      .join("");
    $results.html(html);
  }

  function renderPager(current, total) {
    const prevDisabled = current === 1 ? "disabled" : "";
    const nextDisabled = current === total ? "disabled" : "";
    const html = `
      <button ${prevDisabled} data-page="${current - 1}">Prev</button>
      <span>Page ${current} of ${total}</span>
      <button ${nextDisabled} data-page="${current + 1}">Next</button>`;
    $pagination.html(html);
  }
  $pagination.on("click", "button", function () {
    const p = $(this).data("page");
    if (p) {
      filterState.page = p;
      reload();
    }
  });

  function applyFilters() {
    const { yearFrom, yearTo, sortBy, country, genres } = filterState;
    $results.find(".result-card").each(function () {
      const $c = $(this);
      let ok = true;
      const year = parseInt($c.attr("data-year"), 10);
      if (yearFrom && year < yearFrom) ok = false;
      if (yearTo && year > yearTo) ok = false;

      if (country) {
        const mc = ($c.attr("data-country") || "")
          .split(",")
          .map((s) => s.trim());
        if (!mc.includes(countryMap[country])) ok = false;
      }
      if (genres.length) {
        const mg = ($c.attr("data-genre") || "")
          .split(",")
          .map((s) => s.trim());
        const req = genres.map((id) => genreRev[id]);
        if (!req.every((g) => mg.includes(g))) ok = false;
      }
      $c.toggle(ok);
    });
    if (sortBy) {
      const arr = $results.find(".result-card:visible").toArray();
      arr.sort((a, b) => {
        const A = $(a),
          B = $(b);
        switch (sortBy) {
          case "original_title.asc":
            return A.find(".title")
              .text()
              .localeCompare(B.find(".title").text());
          case "vote_average.desc":
            return (
              parseFloat(B.attr("data-rating")) -
              parseFloat(A.attr("data-rating"))
            );
          case "vote_average.asc":
            return (
              parseFloat(A.attr("data-rating")) -
              parseFloat(B.attr("data-rating"))
            );
          case "vote_count.desc":
            return (
              parseInt(B.attr("data-votes"), 10) -
              parseInt(A.attr("data-votes"), 10)
            );
        }
      });
      $results.append(arr);
    }
  }

  function annotateTmdbDetails(list) {
    list.forEach((movie) => {
      $.getJSON(`${TMDB_API_URL}/movie/${movie.id}`, {
        api_key: TMDB_API_KEY,
        language: "en-US",
        append_to_response: "external_ids",
      }).done((detail) => {
        const $card = $results.find(`.result-card[data-id="${movie.id}"]`);
        const genres = detail.genres.map((g) => g.name).join(", ");
        const country = detail.production_countries
          .map((c) => c.name)
          .join(", ");
        $card
          .attr("data-genre", genres)
          .attr("data-country", country)
          .attr("data-rating", detail.vote_average)
          .attr("data-votes", detail.vote_count);
        if (detail.external_ids?.imdb_id) {
          $card.attr("data-id", detail.external_ids.imdb_id);
        }
        applyFilters();
      });
    });
  }

  $results.on("click", ".add-fav", function (e) {
    e.stopPropagation();
    const id = $(this).closest(".result-card").data("id");
    const title = $(this).siblings(".title").text();
    Favorites.add({ imdbID: id, Title: title }, renderFavoritesDropdown);
  });

  $results.on("click", ".result-card", function (e) {
    if ($(e.target).is(".add-fav")) return;
    const imdbID = $(this).data("id");
    $.getJSON(OMDB_API_URL, {
      apikey: OMDB_API_KEY,
      i: imdbID,
      plot: "full",
    }).done((md) => {
      const q = encodeURIComponent(md.Title + " official trailer");
      $.getJSON(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${q}&key=${YT_API_KEY}`
      ).done((yt) => {
        const vid = yt.items?.[0]?.id.videoId;
        if (vid) {
          $.getJSON(
            `https://www.googleapis.com/youtube/v3/videos?part=status&id=${vid}&key=${YT_API_KEY}`
          ).done((st) =>
            MovieModal.show(md, vid, st.items?.[0]?.status.embeddable)
          );
        } else {
          MovieModal.show(md, null, false);
        }
      });
    });
  });

  $("#popular-list").on("click", ".pop-card", function (e) {
    const tmdbId = $(this).data("id");
    $.getJSON(`${TMDB_API_URL}/movie/${tmdbId}`, {
      api_key: TMDB_API_KEY,
      language: "en-US",
      append_to_response: "external_ids",
    }).done((tmdb) => {
      const imdbID = tmdb.external_ids.imdb_id;
      if (!imdbID) return;
      $.getJSON(OMDB_API_URL, {
        apikey: OMDB_API_KEY,
        i: imdbID,
        plot: "full",
      }).done((omdb) => {
        const q = encodeURIComponent(omdb.Title + " official trailer");
        $.getJSON("https://www.googleapis.com/youtube/v3/search", {
          part: "snippet",
          type: "video",
          maxResults: 1,
          q,
          key: YT_API_KEY,
        }).done((yt) => {
          const vid = yt.items?.[0]?.id.videoId;
          if (vid) {
            $.getJSON("https://www.googleapis.com/youtube/v3/videos", {
              part: "status",
              id: vid,
              key: YT_API_KEY,
            }).done((st) =>
              MovieModal.show(omdb, vid, st.items?.[0]?.status.embeddable)
            );
          } else {
            MovieModal.show(omdb, null, false);
          }
        });
      });
    });
  });

  $("#language-switch").on("change", () => {
    applyTranslations(currentLang);
    applyFilterTranslations(currentLang);
    renderBrowseTabs();
    loadPopular($("#popular-tabs button.active").data("cat"));
  });

  $("#popular-list").on("click", ".info-icon", function (e) {
    e.stopPropagation();
    $(this).closest(".pop-card").trigger("click");
  });


  $("#language-switch").on("change", function () {
    currentLang = this.value;
    applyTranslations(currentLang);
    renderBrowseTabs();
    loadPopular($("#popular-tabs button.active").data("cat"));
    MovieModal.rerender()
  });

  loadPopular("top_rated");
  reload();
});
