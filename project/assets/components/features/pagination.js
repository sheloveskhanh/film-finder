
export function renderPager(container, current, total) {
  const prevDisabled = current === 1 ? 'disabled' : '';
  const nextDisabled = current === total ? 'disabled' : '';
  const html = `
    <button ${prevDisabled} data-page="${current - 1}">Prev</button>
    <span class="page-info">
      Page <span class="current-page">${current}</span> of ${total}
    </span>
    <button ${nextDisabled} data-page="${current + 1}">Next</button>
  `;
  container.html(html);
}

export function initPagination(container, onPageChange) {
  container.on('click', 'button', function() {
    const p = $(this).data('page');
    if (p) onPageChange(p);
  });
}
