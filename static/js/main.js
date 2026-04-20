// ── Scroll Reveal ─────────────────────────────────────────────
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Nav scroll tint ───────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.borderBottomColor = window.scrollY > 60
    ? 'rgba(200,135,58,0.2)'
    : 'rgba(210,170,110,0.12)';
});

// ── Active nav highlight ──────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 220) current = sec.id;
  });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current ? 'var(--accent2)' : '';
  });
});

// ── READER ────────────────────────────────────────────────────
const overlay    = document.getElementById('readerOverlay');
const readerBody = document.getElementById('readerBody');
const readerToc  = document.getElementById('readerToc');
const partLabel  = document.getElementById('readerPartLabel');

let fontSize   = 1.05;
const cache    = {};

async function openReader(part) {
  partLabel.textContent = `Part 0${part}`;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  readerBody.innerHTML = `
    <div class="reader-loading">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>`;
  readerToc.innerHTML = '';

  if (cache[part]) { renderStory(cache[part]); return; }

  try {
    const res  = await fetch(`/api/story/${part}`);
    const data = await res.json();
    cache[part] = data.chapters;
    renderStory(data.chapters);
  } catch (e) {
    readerBody.innerHTML = `<p style="color:var(--muted);padding:2rem;font-family:var(--mono);font-size:0.85rem;">// error loading story. try again.</p>`;
  }
}

function renderStory(chapters) {
  readerToc.innerHTML = chapters.map((ch, i) =>
    `<button class="toc-item" onclick="scrollToChapter(${i})">${ch.title}</button>`
  ).join('');

  readerBody.innerHTML = chapters.map((ch, i) => `
    <div class="chapter-block" id="chapter-${i}">
      <h2 class="chapter-heading">${ch.title}</h2>
      ${ch.paragraphs.map(p => `<p class="chapter-para">${p}</p>`).join('')}
    </div>
  `).join('');

  applyFontSize();
  readerBody.scrollTop = 0;
  readerBody.addEventListener('scroll', updateActiveToc);
  updateActiveToc();
}

function scrollToChapter(idx) {
  const el = document.getElementById(`chapter-${idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateActiveToc() {
  const blocks   = readerBody.querySelectorAll('.chapter-block');
  const tocItems = readerToc.querySelectorAll('.toc-item');
  let activeIdx  = 0;
  blocks.forEach((block, i) => {
    if (block.getBoundingClientRect().top < 200) activeIdx = i;
  });
  tocItems.forEach((item, i) => item.classList.toggle('active', i === activeIdx));
  const activeItem = readerToc.querySelector('.toc-item.active');
  if (activeItem) activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function closeReader() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

overlay.addEventListener('click', e => { if (e.target === overlay) closeReader(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeReader(); });

function changeFontSize(delta) {
  fontSize = Math.min(1.5, Math.max(0.85, fontSize + delta * 0.1));
  applyFontSize();
}

function applyFontSize() {
  document.querySelectorAll('.chapter-para').forEach(p => {
    p.style.fontSize = fontSize + 'rem';
  });
}
