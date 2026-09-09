(() => {
  'use strict';

  const gallery = document.querySelector('.cv-feedback');
  const dialog = document.getElementById('cv-feedback-dialog');
  if (!gallery || !dialog || typeof dialog.showModal !== 'function') return;

  const photos = [...gallery.querySelectorAll('.cv-feedback__open')];
  const image = dialog.querySelector('.cv-feedback-dialog__image');
  const title = dialog.querySelector('#cv-feedback-dialog-title');
  const caption = dialog.querySelector('#cv-feedback-dialog-caption');
  const stage = dialog.querySelector('.cv-feedback-dialog__stage');
  const zoom = dialog.querySelector('.cv-feedback-dialog__zoom');
  const hint = dialog.querySelector('.cv-feedback-dialog__hint');
  const close = dialog.querySelector('.cv-feedback-dialog__close');
  let current = 0;
  let lastTrigger = null;
  let previousOverflow = '';
  let zoomed = false;
  let pointerStartedOutside = false;

  function setZoom(nextZoomed) {
    zoomed = nextZoomed;
    stage.classList.toggle('is-zoomed', zoomed);
    zoom.setAttribute('aria-pressed', String(zoomed));
    zoom.textContent = zoomed ? '适应屏幕 · Fit' : '阅读原图 · Zoom';
    hint.textContent = zoomed
      ? '滚动查看完整原图 · Scroll to read · Esc 关闭'
      : '← → 切换照片 · Arrow keys to browse · Esc 关闭';
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  }

  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    const thumbnail = photo.querySelector('img');
    setZoom(false);
    image.src = photo.href;
    image.alt = thumbnail.alt;
    image.style.setProperty('--feedback-original-width', `${thumbnail.naturalWidth || thumbnail.width}px`);
    title.textContent = photo.dataset.title;
    caption.textContent = `${current + 1} / ${photos.length} · ${photo.dataset.caption}`;
  }

  image.addEventListener('load', () => {
    image.style.setProperty('--feedback-original-width', `${image.naturalWidth}px`);
  });

  photos.forEach((photo, index) => {
    photo.addEventListener('click', (event) => {
      // Keep the browser's usual open-in-new-tab behavior available.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      lastTrigger = photo;
      previousOverflow = document.body.style.overflow;
      showPhoto(index);
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      close.focus();
    });
  });

  close.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-feedback-prev]').addEventListener('click', () => showPhoto(current - 1));
  dialog.querySelector('[data-feedback-next]').addEventListener('click', () => showPhoto(current + 1));
  zoom.addEventListener('click', () => setZoom(!zoomed));

  dialog.addEventListener('keydown', (event) => {
    // In original-size mode, arrow keys retain native image scrolling.
    if (zoomed || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });

  function isOutside(event) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }

  dialog.addEventListener('pointerdown', (event) => {
    pointerStartedOutside = event.target === dialog && isOutside(event);
  });
  dialog.addEventListener('click', (event) => {
    if (pointerStartedOutside && event.target === dialog && isOutside(event)) dialog.close();
    pointerStartedOutside = false;
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    setZoom(false);
    if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus({ preventScroll: true });
  });
})();
