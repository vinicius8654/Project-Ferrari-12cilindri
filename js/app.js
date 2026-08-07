document.body.classList.add('fade-out');
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    document.body.classList.remove('fade-out');
    document.body.classList.add('fade-in');
  });
});

document.querySelectorAll('a').forEach(link => {
  if (link.hostname === window.location.hostname) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');
      if (href.startsWith('#') || link.target === '_blank') return;
      e.preventDefault();
      document.body.classList.remove('fade-in');
      document.body.classList.add('fade-out');
      setTimeout(() => { window.location.href = href; }, 500);
    });
  }
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    document.body.classList.remove('fade-out');
    document.body.classList.add('fade-in');
  }
});
// Fallback para mídia externa (Cloudinary) que falhar ao carregar

const PLACEHOLDER_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23222"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" font-family="sans-serif" font-size="16" text-anchor="middle" dy=".3em"%3EImagem indispon%C3%ADvel%3C/text%3E%3C/svg%3E';

document.addEventListener('error', (e) => {
  const el = e.target;

  if (el.tagName === 'IMG' && el.src !== PLACEHOLDER_IMG) {
    console.warn('Falha ao carregar imagem:', el.src);
    el.src = PLACEHOLDER_IMG;
    el.alt = el.alt || 'Imagem indisponível';
  }

  if (el.tagName === 'SOURCE' && el.closest('video')) {
    console.warn('Falha ao carregar vídeo:', el.src);
    el.closest('video').classList.add('midia-indisponivel');
  }

  if (el.tagName === 'AUDIO') {
    console.warn('Falha ao carregar áudio:', el.src);
    el.closest('.botao-audio')?.classList.add('indisponivel');
  }
}, true); // capture:true — evento "error" não faz bubble, precisa capturar
// Atualiza o ano do copyright automaticamente
const copyrightYear = document.getElementById('copyright-year');
if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();