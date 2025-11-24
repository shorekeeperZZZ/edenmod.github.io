// --- Preloader Logic ---
window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.classList.add('loaded');
    }, 300);
});

// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('detail-view');
    const gameListContainer = document.getElementById('gameList');
    const searchInput = document.getElementById('searchInput');
    const gameCounter = document.getElementById('gameCounter');
    const filterAllBtn = document.getElementById('filter-all');
    const filterVipBtn = document.getElementById('filter-vip');
    const filterFreeBtn = document.getElementById('filter-free');
    const filterNormalBtn = document.getElementById('filter-normal');

    let currentFilter = 'all';

    // Lấy dữ liệu từ file games.js (biến global window.gameDataSource)
    const rawGameData = window.gameDataSource || [];

    const processData = (rawData) => {
        return rawData.map(game => {
            const features = (game.note || '').split(/,/).map(f => f.trim()).filter(f => f);
            const id = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const isFree = game.free === true;
            return { ...game, id, features, vip: game.vip || false, free: isFree };
        });
    };

    const gameData = processData(rawGameData);

    const displayGames = (games) => {
        gameListContainer.innerHTML = '';
        gameCounter.textContent = `Hiển thị ${games.length} game.`;

        if (games.length === 0) {
            gameListContainer.innerHTML = '<p class="no-results" style="text-align:center; grid-column: 1 / -1;">Không tìm thấy game phù hợp.</p>';
            return;
        }

        games.slice().reverse().forEach(game => {
            const card = document.createElement('article');
            const classes = ['game-card'];
            if (game.vip) classes.push('is-vip');
            if (game.free) classes.push('is-free');
            card.className = classes.join(' ');
            card.dataset.gameId = game.id;

            const featuresHTML = game.features.length > 0 ?
                `<ul class="features-list">${game.features.map(f => `<li class="feature-tag">${f}</li>`).join('')}</ul>` :
                '<p style="font-size: 0.9rem; color: var(--text-secondary);">Chưa có thông tin.</p>';

            const vipBadgeHTML = game.vip ? `<div class="vip-badge">VIP</div>` : '';
            const freeBadgeHTML = game.free ? `<div class="free-badge">FREE</div>` : '';

            card.innerHTML = `
                ${freeBadgeHTML}
                ${vipBadgeHTML}
                <img class="game-card-image" src="${game.image || 'https://placehold.co/400x200/0d1117/8b949e?text=No+Image'}"
                    alt="Ảnh bìa ${game.name}" loading="lazy"
                    onerror="this.onerror=null;this.src='https://placehold.co/400x200/0d1117/8b949e?text=Image+Error';">
                <h3>${game.name}</h3>
                <p class="mod-author-note">100% apk and No root by Nobody</p>
                <div class="features-wrapper"><strong>Tính năng Mod:</strong>${featuresHTML}</div>`;

            card.addEventListener('click', () => showDetailView(game.id));
            gameListContainer.appendChild(card);
        });
    };

    const showDetailView = (gameId) => {
        document.querySelector('.header').style.display = 'none';
        const game = gameData.find(g => g.id === gameId);
        if (!game) return;

        document.getElementById('detail-title').innerHTML = `<a href="${game.link || '#'}" target="_blank" rel="noopener noreferrer">${game.name}</a>`;
        document.getElementById('video-container').innerHTML = game.videoId && game.videoId !== "xxx" ?
            `<iframe src="https://www.youtube.com/embed/${game.videoId}" frameborder="0" allowfullscreen></iframe>` :
            `<div style="text-align:center; padding: 2rem;">Không có video demo.</div>`;
        document.querySelector('#detail-description p').textContent = game.description || "Chưa có mô tả.";
        document.querySelector('#detail-features .features-list').innerHTML = game.features.map(f =>
            `<li class="feature-tag">${f}</li>`
        ).join('');
        document.getElementById('detail-discord-link').href = game.discordLink || "https://discord.gg/edenmod";

        const downloadLink = document.getElementById('download-link');
        if (downloadLink) {
            if (game.link && game.link !== "link") {
                downloadLink.classList.add('visible');
                downloadLink.href = game.link;
                downloadLink.textContent = game.free ? 'Mở / Tải (Miễn phí)' : 'Mở / Tải';
            } else {
                downloadLink.classList.remove('visible');
                downloadLink.href = '#';
            }
        }

        mainView.style.display = 'none';
        detailView.style.display = 'block';
        window.scrollTo(0, 0);
    };

    const renderGameList = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let filteredGames = gameData;

        if (currentFilter === 'vip') {
            filteredGames = filteredGames.filter(game => game.vip);
        } else if (currentFilter === 'free') {
            filteredGames = filteredGames.filter(game => game.free);
        } else if (currentFilter === 'normal') {
            filteredGames = filteredGames.filter(game => !game.vip && !game.free);
        }

        if (searchTerm) {
            filteredGames = filteredGames.filter(game => game.name.toLowerCase().includes(searchTerm));
        }

        displayGames(filteredGames);
    };

    window.copyDiscordLink = (button) => {
        const link = document.getElementById('detail-discord-link').href;
        navigator.clipboard.writeText(link).then(() => {
            button.textContent = 'Đã sao chép!';
            setTimeout(() => { button.textContent = 'Sao chép Link'; }, 2000);
        });
    };

    window.showMainView = () => {
        document.querySelector('.header').style.display = 'flex';
        detailView.style.display = 'none';
        mainView.style.display = 'block';
    };

    // --- Init App ---
    renderGameList();
    searchInput.addEventListener('input', renderGameList);

    const setActiveBtn = (btn) => {
        [filterAllBtn, filterVipBtn, filterFreeBtn, filterNormalBtn].forEach(b => {
            if(b) b.classList.remove('active');
        });
        if(btn) btn.classList.add('active');
    };

    if (filterAllBtn) filterAllBtn.addEventListener('click', () => { currentFilter = 'all'; setActiveBtn(filterAllBtn); renderGameList(); });
    if (filterVipBtn) filterVipBtn.addEventListener('click', () => { currentFilter = 'vip'; setActiveBtn(filterVipBtn); renderGameList(); });
    if (filterFreeBtn) filterFreeBtn.addEventListener('click', () => { currentFilter = 'free'; setActiveBtn(filterFreeBtn); renderGameList(); });
    if (filterNormalBtn) filterNormalBtn.addEventListener('click', () => { currentFilter = 'normal'; setActiveBtn(filterNormalBtn); renderGameList(); });

    const scrollToTopBtn = document.getElementById('scroll-to-top');
    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
    });
    if (scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// --- Announcement Modal Logic ---
(function() {
  const BACKDROP_ID = 'policy-modal-backdrop';
  const KEY_UNTIL   = 'edenmod_policy_dismiss_until_3h';
  const KEY_LANG    = 'edenmod_policy_lang';
  const KEY_VER     = 'edenmod_policy_version';
  const NOTICE_VERSION = '2025-10-31-v2';
  const DISMISS_HOURS = 3;

  function setStore(key, val) { try { localStorage.setItem(key, val); } catch(e) { try { document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(val) + '; path=/; max-age=' + (365*24*3600); } catch(e2){} } }
  function getStore(key) { try { return localStorage.getItem(key); } catch(e) { const m = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; } }
  function delStore(key) { try { localStorage.removeItem(key); } catch(e) { document.cookie = encodeURIComponent(key) + '=; path=/; max-age=0'; } }

  const $backdrop = document.getElementById(BACKDROP_ID);
  const $modal    = document.getElementById('policy-modal');
  const $langVI   = document.getElementById('lang-vi');
  const $langEN   = document.getElementById('lang-en');
  const $boxVI    = document.getElementById('policy-vi');
  const $boxEN    = document.getElementById('policy-en');
  const $dont3h   = document.getElementById('dont-show-3h');
  const $close    = document.getElementById('policy-close');
  const $ok       = document.getElementById('policy-accept');
  const $dontText = document.getElementById('dont-show-text');

  const storedLang = (getStore(KEY_LANG) || '').toLowerCase();
  const browserLang = (navigator.language || '').toLowerCase();
  const preferVI = storedLang ? storedLang === 'vi' : browserLang.startsWith('vi');

  function setLang(lang) {
    const vi = lang === 'vi';
    if($langVI) {
        $langVI.classList.toggle('active', vi);
        $langVI.setAttribute('aria-selected', vi ? 'true' : 'false');
    }
    if($langEN) {
        $langEN.classList.toggle('active', !vi);
        $langEN.setAttribute('aria-selected', !vi ? 'true' : 'false');
    }
    if($boxVI) $boxVI.style.display = vi ? '' : 'none';
    if($boxEN) $boxEN.style.display = vi ? 'none' : '';
    if($dontText) $dontText.textContent = vi ? 'Đừng hiện lại trong 3 giờ' : "Don't show again for 3 hours";
    setStore(KEY_LANG, vi ? 'vi' : 'en');
  }

  function shouldShow() {
    try {
      const ver = getStore(KEY_VER);
      if (ver !== NOTICE_VERSION) return true;
      const until = Number(getStore(KEY_UNTIL) || 0);
      return Date.now() > until;
    } catch(e) { return true; }
  }

  function afterDismiss(save3h) {
    try { setStore(KEY_VER, NOTICE_VERSION); } catch(e){}
    if (save3h) {
      const until = Date.now() + DISMISS_HOURS*60*60*1000;
      try { setStore(KEY_UNTIL, String(until)); } catch(e){}
    } else {
      try { delStore(KEY_UNTIL); } catch(e){}
    }
  }

  function showModal() {
    if(!$backdrop) return;
    $backdrop.classList.add('show');
    $backdrop.setAttribute('aria-hidden','false');
  }
  function hideModal() {
    if(!$backdrop) return;
    $backdrop.classList.remove('show');
    $backdrop.setAttribute('aria-hidden','true');
  }

  function dismiss(save3h) { afterDismiss(save3h); hideModal(); }

  if($langVI) $langVI.addEventListener('click', () => setLang('vi'));
  if($langEN) $langEN.addEventListener('click', () => setLang('en'));
  if($close) $close.addEventListener('click', () => dismiss($dont3h?.checked));
  if($ok) $ok.addEventListener('click',   () => dismiss($dont3h?.checked));
  if($backdrop) $backdrop.addEventListener('click', (e) => { if (e.target === $backdrop) dismiss($dont3h?.checked); });

  setLang(preferVI ? 'vi' : 'en');
  if (shouldShow()) showModal();
})();

// --- Anti-DevTools Script ---
document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, false);
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73 || e.key === 'J' || e.keyCode === 74 || e.key === 'C' || e.keyCode === 67)) { e.preventDefault(); return false; }
    if (e.ctrlKey && (e.key === 'U' || e.keyCode === 85)) { e.preventDefault(); return false; }
});