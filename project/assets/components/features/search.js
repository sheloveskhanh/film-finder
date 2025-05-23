const Search = (function(){
  let $input, $button;

  function init() {
    $input  = $('#search-input');
    $button = $('#search-button');

    $button.on('click', trigger);
    $input.on('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        trigger();
      }
    });
  }

  function trigger() {
    const query = $input.val().trim();
    $(document).trigger('search:changed', { query, page: 1 });
  }

  return { init };
})();
