
  // Mapa com scroll desativado por padrão
    const map = L.map('map', { scrollWheelZoom: false }).setView([20, 0], 2);

    // Camada base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Ícone vermelho
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Ativar/desativar zoom via eventos do container (mais confiável)
    const mapEl = map.getContainer();
    mapEl.addEventListener('click', () => map.scrollWheelZoom.enable());
    mapEl.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

    // Carregar JSON (rodar com servidor: http://..., não file://)
    fetch('dealers.json')
      .then(r => {
        if (!r.ok) throw new Error('Não foi possível carregar dealers.json');
        return r.json();
      })
      .then(dealers => {
        dealers.forEach(d => {
          L.marker([d.lat, d.lng], { icon: redIcon })
            .addTo(map)
            .bindPopup(`<b>${d.nome}</b><br>${d.endereco ?? ''}`);
        });
      })
      .catch(err => {
        console.warn('Falha ao carregar dealers.json. Rode com Live Server ou verifique o caminho do arquivo.', err);
        // Fallback mínimo para você ver algo no mapa:
        const fallback = [
          { nome: 'Ferrari São Paulo', lat: -23.5693, lng: -46.6670, endereco: 'Av. Brasil, 1769 – Jardim América, São Paulo' }
        ];
        fallback.forEach(d => {
          L.marker([d.lat, d.lng], { icon: redIcon })
            .addTo(map)
            .bindPopup(`<b>${d.nome}</b><br>${d.endereco ?? ''}`);
        });
      });

document.getElementById("btnCompartilhar").addEventListener("click", () => {
  document.getElementById("menuLateral").classList.add("ativo");
});

document.getElementById("btnFechar").addEventListener("click", () => {
document.getElementById("menuLateral").classList.remove("ativo");
});

let lastScrollTop = 0;

window.addEventListener("scroll", () => {
  const current = Math.max(window.scrollY, 0);

  if (current > lastScrollTop && current > 100) { // Só esconde após 100px
    document.body.classList.add("scrolled");
  } else {
    document.body.classList.remove("scrolled");
  }

  lastScrollTop = current;
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      requestAnimationFrame(() => {
        entry.target.classList.add('show');
      });
    }
  });
}, {
  threshold: 0.1
});

const botao = document.getElementById("botaoPower");
const audio = document.getElementById("audioMotor");

botao.addEventListener("click", () => {
  if (audio.paused) {
    audio.currentTime = 0;
    audio.play();
  } else {
    audio.pause();
  }
});

  const video = document.getElementById('videoIntro');

  video.addEventListener('ended', () => {
    video.style.opacity = '0';
  });

document.querySelectorAll('.raiox-container').forEach(container => {
  const imagemInterna = container.querySelector('.imagem-interna');
  const anel = container.querySelector('.anel');

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    imagemInterna.style.clipPath = `circle(150px at ${x}px ${y}px)`;
    anel.style.left = `${x - 150}px`;
    anel.style.top = `${y - 150}px`;
  });
});

    container.addEventListener('mousemove', (e) => {
      const x = e.offsetX;
      const y = e.offsetY;
      imagemInterna.style.clipPath = `circle(150px at ${x}px ${y}px)`;
      anel.style.left = `${x - 150}px`;
      anel.style.top = `${y - 150}px`;
    });

// Aplica fade-in ao carregar
  document.body.classList.add('fade-out');
  window.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
      document.body.classList.remove('fade-out');
      document.body.classList.add('fade-in');
    });
  });

  // Adiciona fade-out antes de ir para a próxima página
  document.querySelectorAll('a').forEach(link => {
    // Só faz para links internos
    if (link.hostname === window.location.hostname) {
      link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');

        // ignora links com target="_blank" ou âncoras
        if (
          href.startsWith('#') ||
          link.target === '_blank'
        ) return;

        e.preventDefault();
        document.body.classList.remove('fade-in');
        document.body.classList.add('fade-out');

        setTimeout(() => {
          window.location.href = href;
        }, 500); // deve ser igual ao tempo do CSS
      });
    }
  });

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.gallery').forEach(gallery => {
    gallery.classList.remove('active');
    gallery.classList.add('hidden');
  });

  document.querySelector(`.tab[onclick*="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');
  document.getElementById(tabName).classList.remove('hidden');

  if (tabName === 'album-section') closeAlbum();
  if (tabName === 'videos') closeVideoAlbum(); // ← aqui
}

  function openAlbum(albumId) {
    document.getElementById('album-section').classList.add('hidden');
    document.getElementById(albumId).classList.remove('hidden');
    document.getElementById(albumId).classList.add('active');
  }

  function closeAlbum() {
    document.getElementById('album-section').classList.remove('hidden');
    document.querySelectorAll('.gallery').forEach(gallery => {
      if (gallery.id.startsWith('album') && gallery.id !== 'album-section') {
        gallery.classList.add('hidden');
        gallery.classList.remove('active');
      }
    });
  }

  function openVideoAlbum(albumId) {
  document.getElementById('videos').classList.add('hidden');
  document.getElementById(albumId).classList.remove('hidden');
  document.getElementById(albumId).classList.add('active');
}

function closeVideoAlbum() {
  document.getElementById('videos').classList.remove('hidden');
  document.querySelectorAll('.gallery').forEach(gallery => {
    if (gallery.id.startsWith('albumVideos') && gallery.id !== 'videos') {
      gallery.classList.add('hidden');
      gallery.classList.remove('active');
    }
  });
}

  function openModal(src) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    modalImg.src = src;
    modal.classList.add('active');
  }

  function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
  }
