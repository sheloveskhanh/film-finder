export function Search(inputSelector = "#search-input", buttonSelector = "#search-button", onSearch) {
  const $input = $(inputSelector);
  const $button = $(buttonSelector);

  function trigger() {
    const query = $input.val().trim();
    if (typeof onSearch === "function") {
      onSearch(query);
    } else {
      // If using event-based approach:
      $(document).trigger("search:changed", { query, page: 1 });
    }
  }

  function init() {
    $button.on("click", trigger);
    $input.on("keypress", function (e) {
      if (e.which === 13) trigger();
    });
  }

  return { init };
}