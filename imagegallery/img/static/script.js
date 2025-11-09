/* ========= CONFIG ========= */
// Optional: add tags to each image by putting a comma-separated list in data-tags
// Example in HTML: <img src="..." alt="Desert" data-tags="desert,sunset,sand">

const state = {
    items: [],          // built from DOM
    filtered: [],
    currentIndex: 0,
    autoplay: false,
    autoplayTimer: null,
    size: 220
};

/* ========= SELECTORS ========= */
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const caption = document.getElementById('caption');
const closeBtn = document.querySelector('.close');

// Enhanced UI elements (add to your header if not present)
const searchInput = document.getElementById('search') || makeSearch();
const sizeRange = document.getElementById('size') || makeSize();
const fullscreenBtn = document.getElementById('fullscreenBtn') || makeFullscreenButton();
const autoplayChk = document.getElementById('autoplay') || makeAutoplayToggle();

/* ========= INIT ========= */
document.addEventListener('DOMContentLoaded', () => {
    indexItemsFromDOM();
    applySize(parseInt(sizeRange.value || state.size, 10));
    bindThumbClicks();
    bindGlobalKeys();
    if (autoplayChk.checked) startAutoplay();
});

/* ========= BUILD HELPERS (if HTML didn’t include controls) ========= */
function makeSearch() {
    const input = document.createElement('input');
    input.type = 'search'; input.placeholder = 'Search by caption or tag…';
    input.className = 'input'; input.id = 'search';
    attachToToolbar(input);
    return input;
}
function makeSize() {
    const wrap = document.createElement('div'); wrap.className = 'range-wrap btn';
    wrap.innerHTML = '<span style="font-size:12px">Thumbs</span> <input id="size" type="range" min="200" max="380" value="220">';
    attachToToolbar(wrap);
    return wrap.querySelector('#size');
}
function makeFullscreenButton() {
    const btn = document.createElement('button'); btn.className = 'btn'; btn.id = 'fullscreenBtn';
    btn.textContent = 'Fullscreen';
    attachToToolbar(btn);
    return btn;
}
function makeAutoplayToggle() {
    const label = document.createElement('label'); label.className = 'btn';
    label.title = 'Toggle slideshow';
    label.innerHTML = '<input id="autoplay" type="checkbox" class="sr-only"> <span id="autoplay-label">Slideshow: Off</span>';
    attachToToolbar(label);
    return label.querySelector('#autoplay');
}
function attachToToolbar(el) {
    const header = document.querySelector('.toolbar');
    if (header) header.appendChild(el);
}

/* ========= DOM INDEXING ========= */
function indexItemsFromDOM() {
    const thumbs = [...document.querySelectorAll('.gallery img')];
    state.items = thumbs.map((img, i) => ({
        i,
        el: img,
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
        tags: (img.dataset.tags || '').split(',').map(s => s.trim()).filter(Boolean)
    }));
    state.filtered = state.items;
}

/* ========= FILTER & SEARCH ========= */
searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    state.filtered = state.items.filter(({ alt, tags }) =>
        alt.toLowerCase().includes(q) || tags.join(' ').toLowerCase().includes(q)
    );
    renderFilter();
});

function renderFilter() {
    // hide unmatched cards
    const set = new Set(state.filtered.map(x => x.el));
    state.items.forEach(({ el }) => {
        el.closest('.card').classList.toggle('hidden', !set.has(el));
    });
}

/* ========= SIZE CONTROL ========= */
sizeRange.addEventListener('input', e => applySize(parseInt(e.target.value, 10)));
function applySize(px) {
    state.size = px;
    // update CSS grid min width by inlining style on gallery
    gallery.style.gridTemplateColumns = `repeat(auto-fit, minmax(${px}px, 1fr))`;
}

/* ========= THUMBNAILS / LIGHTBOX ========= */
function bindThumbClicks() {
    state.items.forEach(({ el, i }) => {
        el.loading = 'lazy';
        el.decoding = 'async';
        el.tabIndex = 0;
        el.addEventListener('click', () => openLightbox(i));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
        });
    });
}

function openLightbox(i) {
    state.currentIndex = i;
    const item = state.items[i];
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    caption.textContent = item.alt || 'Photo';
    lightbox.setAttribute('open', '');
}

function closeLightbox() {
    lightbox.removeAttribute('open');
    stopAutoplay();
}

function next() { move(1); }
function prev() { move(-1); }
function move(delta) {
    const arr = state.filtered.length ? state.filtered : state.items;
    if (!arr.length) return;
    const currentItem = state.items[state.currentIndex];
    let idxInFiltered = arr.findIndex(x => x === currentItem);
    if (idxInFiltered === -1) idxInFiltered = 0;
    const nextIndex = (idxInFiltered + delta + arr.length) % arr.length;
    const realIndex = arr[nextIndex].i;
    openLightbox(realIndex);
}

/* ========= AUTOPLAY ========= */
function startAutoplay() {
    state.autoplay = true;
    document.getElementById('autoplay-label')?.replaceChildren(document.createTextNode('Slideshow: On'));
    stopAutoplay(); // clear if any
    state.autoplayTimer = setInterval(next, 2500);
}
function stopAutoplay() {
    state.autoplay = false;
    document.getElementById('autoplay-label')?.replaceChildren(document.createTextNode('Slideshow: Off'));
    if (state.autoplayTimer) clearInterval(state.autoplayTimer);
    state.autoplayTimer = null;
}

autoplayChk.addEventListener('change', (e) => {
    if (e.target.checked) { startAutoplay(); }
    else { stopAutoplay(); }
});

/* ========= FULLSCREEN ========= */
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
});

/* ========= LIGHTBOX EVENTS ========= */
closeBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});

/* ========= KEYBOARD SHORTCUTS ========= */
function bindGlobalKeys() {
    window.addEventListener('keydown', (e) => {
        if (!lightbox.hasAttribute('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
    });
}
