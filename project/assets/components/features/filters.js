
export const Filters = function(filterState) {

  function init(){
    function closeAllDropdowns() { $('.dropdown-menu').hide(); }
    $(document).on('click', closeAllDropdowns);

    $('#year-from, #year-to').on('input', () => {
      filterState.yearFrom = parseInt($('#year-from').val()) || null;
      filterState.yearTo   = parseInt($('#year-to').val())   || null;
      filterState.page = 1;
      $(document).trigger('filters:changed');
    });

    $('#sort-button').on('click', e => {
      e.stopPropagation(); closeAllDropdowns(); $('#sort-list').toggle();
    });
    $('#sort-list').on('click','li', function(){
      filterState.sortBy = $(this).data('sort') || null;
      $('#sort-button').text( filterState.sortBy 
        ? `Sort: ${$(this).text()} ▾`
        : `Sort by ▾`
      );
      filterState.page = 1;
      $(document).trigger('filters:changed');
    });

    $('#country-button').on('click', e => {
      e.stopPropagation(); closeAllDropdowns(); $('#country-list').toggle();
    });
    $('#country-list').on('click','li', function(){
      $('#country-list li').removeClass('active');
      $(this).addClass('active');
      filterState.country = $(this).data('code') || null;
      $('#country-button').text(
        filterState.country 
          ? `Country: ${$(this).text()} ▾`
          : `Country ▾`
      );
      filterState.page = 1;
      $(document).trigger('filters:changed');
    });

    $('#genre-button-2').on('click', e => {
      e.stopPropagation(); closeAllDropdowns(); $('#genre-list-2').toggle();
    });
    $('#genre-list-2').prepend(`<li data-id="" class="reset-genre">Any Genre</li>`);
    $('#genre-list-2').on('click','li', function(){
      if ($(this).hasClass('reset-genre')) {
        filterState.genres = [];
        $('#genre-list-2 li.active').removeClass('active');
      } else {
        $(this).toggleClass('active');
        filterState.genres = $('#genre-list-2 li.active')
          .map((i,el)=>$(el).data('id')).get();
      }
      const names = filterState.genres.map(id=>genreRev[id]);
      let label = 'Genre ▾';
      if (names.length) {
        if (names.length <= 2) label = `Genre: ${names.join(', ')} ▾`;
        else label = `Genre: ${names.slice(0,2).join(', ')} +${names.length-2} more ▾`;
      }
      $('#genre-button-2').text(label);
      filterState.page = 1;
      $(document).trigger('filters:changed');
    });

    $('#clear-filters').on('click', () => {
      filterState.yearFrom = filterState.yearTo = null;
      filterState.sortBy = filterState.country = null;
      filterState.genres = [];
      filterState.page = 1;
      
      $('#year-from, #year-to').val('');
      $('#sort-button').text('Sort by ▾'); $('#sort-list li').removeClass('active');
      $('#country-button').text('Country ▾'); $('#country-list li').removeClass('active');
      $('#genre-button-2').text('Genre ▾'); $('#genre-list-2 li').removeClass('active');
      $(document).trigger('filters:changed');
    });
  }

  function getState(){ return {...filterState}; }

  return { init, getState };
};
