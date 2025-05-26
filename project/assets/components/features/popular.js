import {
  POPULAR_URL,
  TOP_RATED_URL,
  UPCOMING_URL,
  NOW_PLAYING_URL,
  TMDB_API_KEY
} from '../config/tmdb.js';

export function initPopular(tabsContainer, listContainer, onCardClick) {
  tabsContainer.on('click', 'button', function() {
    tabsContainer.find('button').removeClass('active');
    $(this).addClass('active');
    loadCategory($(this).data('cat'), listContainer);
  });

  $('#popular-prev').on('click', () => {
    listContainer.animate({ scrollLeft: `-=${listContainer.width()}` }, 400);
  });
  $('#popular-next').on('click', () => {
    listContainer.animate({ scrollLeft: `+=${listContainer.width()}` }, 400);
  });

  listContainer.on('click', '.pop-card', function() {
    onCardClick($(this).data('id'));
  });
  listContainer.on('click', '.info-icon', function(e) {
    e.stopPropagation();
    $(this).closest('.pop-card').trigger('click');
  });
}

export function loadCategory(cat, listContainer) {
  let url;
  switch (cat) {
    case 'top_rated':
      url = TOP_RATED_URL;
      break;
    case 'upcoming':
      url = UPCOMING_URL;
      break;
    case 'now_playing':
      url = NOW_PLAYING_URL;
      break;
    default:
      url = POPULAR_URL;
  }

  $.getJSON(url, {
    api_key: TMDB_API_KEY,
    language: 'en-US',
    page: 1
  }).done(resp => {
    const html = resp.results
      .slice(0, 12)
      .map(m => {
        const img = m.poster_path
          ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
          : 'https://via.placeholder.com/180x260?text=No+Image';
        return `
          <div class="pop-card" data-id="${m.id}">
            <img src="${img}" alt="${m.title}">
            <div class="card-overlay"><span class="info-icon">ℹ️</span></div>
          </div>
        `;
      })
      .join('');
    listContainer.html(html);
  });
}
