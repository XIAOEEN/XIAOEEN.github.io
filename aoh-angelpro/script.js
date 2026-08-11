const header = document.querySelector('#site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');

const syncHeader = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 20);
};
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

menuToggle?.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');

const closeLightbox = () => {
  lightbox.hidden = true;
  document.body.style.overflow = '';
  lightboxImage.src = '';
};

document.querySelectorAll('.zoomable').forEach((button) => {
  button.addEventListener('click', () => {
    lightboxImage.src = button.dataset.image;
    lightboxImage.alt = button.querySelector('img')?.alt || 'Enlarged project figure';
    lightboxCaption.textContent = button.dataset.caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  });
});

lightbox?.querySelectorAll('[data-close-lightbox]').forEach((element) => {
  element.addEventListener('click', closeLightbox);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

const copyButton = document.querySelector('#copy-bibtex');
const bibtex = document.querySelector('#bibtex-code')?.innerText || '';
copyButton?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(bibtex);
    copyButton.innerHTML = 'Copied <span aria-hidden="true">✓</span>';
  } catch {
    copyButton.textContent = 'Select the citation above';
  }
  window.setTimeout(() => {
    copyButton.innerHTML = 'Copy citation <span aria-hidden="true">▣</span>';
  }, 1800);
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.desktop-nav a')];
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach((section) => observer.observe(section));
