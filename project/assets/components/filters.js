export function Filters({ filterState, genreRev, countryMap, reload }) {
  const $clearFilters = $("#clear-filters");

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
    filterState.yearFrom = null;
    filterState.yearTo = null;
    filterState.sortBy = null;
    filterState.country = null;
    filterState.genres = [];
    filterState.page = 1;
    $("#year-from,#year-to").val("");
    $("#sort-button").text("Sort by ▾");
    $("#sort-list li").removeClass("active");
    $("#country-button").text("Country ▾");
    $("#country-list li").removeClass("active");
    $("#genre-button-2").text("Genre ▾");
    $("#genre-list-2 li").removeClass("active");
    reload();
  });
}