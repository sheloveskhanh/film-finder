const Results = (function(){
  let $results, $pagination;

  function init() {
    $results    = $('#results');
    $pagination = $('<div id="pagination"></div>').insertAfter($results);

    $pagination.on('click','button', function(){
      const page = $(this).data('page');
      if (page) {
        $(document).trigger('pager:changed', page);
      }
    });

    $results.on('click','.add-fav', function(e){
      e.stopPropagation();
      const $card = $(this).closest('.result-card');
      const id    = $card.data('id');
      const title = $card.find('.title').text();
      Favorites.add({ imdbID:id, Title:title }, renderFavoritesDropdown);
    });

    // Card click → modal
    $results.on('click','.result-card', function(e){
      if ($(e.target).is('.add-fav')) return;
      const imdbID = $(this).data('id');
      $(document).trigger('card:clicked', imdbID);
    });
  }

  function render(list, currentPage, totalPages) {
    // render cards
    const html = list.map(m=>{
      const poster = m.poster_path
        ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
        : 'https://via.placeholder.com/180x260?text=No+Image';
      return `
        <div class="result-card" data-id="${m.id}" data-year="${m.release_date?.slice(0,4)||''}">
          <img src="${poster}" alt="${m.title} poster">
          <div class="card-overlay"><span class="info-icon">ℹ️</span></div>
          <div class="result-info">
            <div class="title">${m.title} (${m.release_date?.slice(0,4)||''})</div>
            <button class="add-fav">${translations[currentLang].addFavorite}</button>
          </div>
        </div>`;
    }).join('');
    $results.html(html);

    // render pager
    let ctrl = `<button ${currentPage===1?'disabled':''} data-page="${currentPage-1}">Prev</button>
                <span class="page-info">Page <span class="current-page">${currentPage}</span> of ${totalPages}</span>
                <button ${currentPage===totalPages?'disabled':''} data-page="${currentPage+1}">Next</button>`;
    $pagination.html(ctrl);
  }

  return { init, render };
})();
