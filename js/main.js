// --- Preloader Logic ---
window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.classList.add('loaded');
    }, 300);
});

// --- Main App Logic ---
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
    let allGamesData = [];
    let savedScrollPosition = 0;


    // --- Helpers ---
    const normalizeStr = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };



    // --- Skeleton Loading ---
    const renderSkeleton = () => {
        gameListContainer.innerHTML = '';
        const skeletonCount = 12;
        for (let i = 0; i < skeletonCount; i++) {
            const card = document.createElement('div');
            card.className = 'game-card skeleton-card';
            card.style.pointerEvents = 'none';
            card.innerHTML = `
                <div class="skeleton-image" style="width:100%; aspect-ratio:16/9; background:rgba(255,255,255,0.05); border-radius:12px; margin-bottom:1rem; animation: pulse 1.5s infinite;"></div>
                <div class="skeleton-text" style="height:24px; width:70%; background:rgba(255,255,255,0.05); border-radius:4px; margin-bottom:0.5rem; animation: pulse 1.5s infinite;"></div>
                <div class="skeleton-text" style="height:16px; width:40%; background:rgba(255,255,255,0.05); border-radius:4px; animation: pulse 1.5s infinite;"></div>
            `;
            gameListContainer.appendChild(card);
        }
    };

    // --- Data Fetching ---
    const fetchGameData = async () => {
        renderSkeleton();
        try {
            // Simulate minimal network delay for skeleton demo (optional, remove in prod)
            // await new Promise(r => setTimeout(r, 800)); 

            const response = await fetch('data/games.json');
            if (!response.ok) throw new Error('Failed to load data');
            const data = await response.json();

            allGamesData = data.map(game => {
                const features = (game.note || '').split(/,/).map(f => f.trim()).filter(f => f);
                const id = game.name ? game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'unknown';
                const isFree = game.free === true;
                return { ...game, id, features, vip: game.vip || false, free: isFree };
            });

            renderGameList();
        } catch (error) {
            gameListContainer.innerHTML = `<p style="text-align:center; color:red;">Lỗi tải dữ liệu: ${error.message}</p>`;
            console.error(error);
        }
    };

    // --- Rendering ---
    const displayGames = (games) => {
        gameListContainer.innerHTML = '';
        gameCounter.textContent = `Hiển thị ${games.length} game.`;

        if (games.length === 0) {
            gameListContainer.innerHTML = '<p class="no-results" style="text-align:center; grid-column: 1 / -1;">Không tìm thấy game phù hợp.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();

        games.slice().reverse().forEach(game => {
            const card = document.createElement('article');
            const classes = ['game-card'];
            if (game.vip) classes.push('is-vip');
            if (game.free) classes.push('is-free');
            if (!game.vip && !game.free) classes.push('is-plus');
            card.className = classes.join(' ');
            card.dataset.gameId = game.id;

            // Determine badge
            let badges = '';
            if (game.free) {
                badges += `<div class="free-badge">FREE</div>`;
            } else if (game.vip) {
                badges += `<div class="vip-badge">VIP</div>`;
            } else {
                badges += `<div class="plus-badge">PLUS</div>`;
            }



            // VIP Logic for Fav position override if needed, but flex/absolute works. 
            // Note: Reuse existing badge class, adjusted positions in CSS.

            const featuresHTML = game.features.length > 0 ?
                `<ul class="features-list">${game.features.slice(0, 4).map(f => `<li class="feature-tag">${f}</li>`).join('')}${game.features.length > 4 ? '<li class="feature-tag">...</li>' : ''}</ul>` :
                '<p style="font-size: 0.9rem; color: var(--text-secondary);">Chưa có thông tin.</p>';

            card.innerHTML = `
                ${badges}

                <img class="game-card-image" 
                    src="${(game.image || '').replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')}"
                    alt="Ảnh bìa ${game.name}" 
                    loading="lazy"
                    onerror="this.onerror=null; this.src='https://placehold.co/400x200/0d1117/8b949e?text=No+Image';">
                <h3>${game.name}</h3>
                <p class="mod-author-note">100% apk and No root by Nobody</p>
                <div class="features-wrapper"><strong>Tính năng Mod:</strong>${featuresHTML}</div>`;

            // Event Listeners
            card.addEventListener('click', (e) => {
                showDetailView(game.id);
            });

            fragment.appendChild(card);
        });

        gameListContainer.appendChild(fragment);
    };

    const renderGameList = () => {
        const searchTerm = normalizeStr(searchInput.value.trim());
        let filteredGames = allGamesData;

        // Filter Logic
        if (currentFilter === 'vip') filteredGames = filteredGames.filter(g => g.vip);
        else if (currentFilter === 'free') filteredGames = filteredGames.filter(g => g.free);
        else if (currentFilter === 'normal') filteredGames = filteredGames.filter(g => !g.vip && !g.free);


        // Search Logic (Fuzzy-ish)
        if (searchTerm) {
            filteredGames = filteredGames.filter(game => {
                const name = normalizeStr(game.name || '');
                const desc = normalizeStr(game.description || '');
                const note = normalizeStr(game.note || ''); // Search in features too
                return name.includes(searchTerm) || desc.includes(searchTerm) || note.includes(searchTerm);
            });
        }

        displayGames(filteredGames);
    };

    // --- Detail View Logic ---
    const showDetailView = (gameId) => {
        const game = allGamesData.find(g => g.id === gameId);
        if (!game) return;

        // View Transition Logic
        if (!document.startViewTransition) {
            // Fallback for browsers without View Transitions support
            fallbackShowDetail(game);
            return;
        }

        // 1. Assign unique view-transition-name to the clicked card image
        const clickedCard = document.querySelector(`.game-card[data-game-id="${gameId}"]`);
        const cardImg = clickedCard ? clickedCard.querySelector('.game-card-image') : null;

        if (cardImg) cardImg.style.viewTransitionName = 'hero-image';

        // 2. Start Transition
        const transition = document.startViewTransition(() => {
            savedScrollPosition = window.scrollY;

            // Switch DOM
            document.querySelector('.header').style.display = 'none';
            mainView.style.display = 'none';
            detailView.style.display = 'block';
            detailView.style.opacity = '1'; // CSS handled by class

            // Update content
            updateDetailContent(game);

            // Assign transition name to target (video wrapper essentially acts as the hero image destination)
            const videoContainer = document.querySelector('.video-wrapper');
            if (videoContainer) videoContainer.style.viewTransitionName = 'hero-image';

            window.scrollTo(0, 0);
        });

        // 3. Cleanup after transition
        transition.finished.then(() => {
            if (cardImg) cardImg.style.viewTransitionName = '';
            const videoContainer = document.querySelector('.video-wrapper');
            if (videoContainer) videoContainer.style.viewTransitionName = '';
        });
    };

    // Helper to populate content (extracted to be reusable)
    const updateDetailContent = (game) => {
        // Set Blurred Background
        const bgUrl = (game.image || '').replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        const detailBg = document.getElementById('detail-bg');
        if (detailBg) detailBg.style.backgroundImage = `url('${bgUrl}')`;

        // Populate Text Data
        document.getElementById('detail-title').innerHTML = `<a href="${game.link || '#'}" target="_blank">${game.name}</a>`;
        document.getElementById('video-container').innerHTML = game.videoId && game.videoId !== "xxx" ?
            `<iframe src="https://www.youtube.com/embed/${game.videoId}" frameborder="0" allowfullscreen></iframe>` :
            `<img src="${bgUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;" alt="Backup Image">`;

        // Features
        document.querySelector('#detail-features .features-list').innerHTML = game.features.map(f =>
            `<li class="feature-tag">${f}</li>`
        ).join('');
        document.getElementById('detail-discord-link').href = game.discordLink || "https://discord.gg/edenmod";

        // Download Link
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
    };

    const fallbackShowDetail = (game) => {
        savedScrollPosition = window.scrollY;
        document.querySelector('.header').style.display = 'none';
        mainView.style.opacity = '0';
        setTimeout(() => {
            mainView.style.display = 'none';
            detailView.style.display = 'block';
            detailView.style.opacity = '0';
            updateDetailContent(game);
            requestAnimationFrame(() => {
                detailView.style.transition = 'opacity 0.3s ease';
                detailView.style.opacity = '1';
                window.scrollTo(0, 0);
            });
        }, 200);
    };

    window.showMainView = () => {
        if (!document.startViewTransition) {
            fallbackShowMain();
            return;
        }

        const transition = document.startViewTransition(() => {
            detailView.style.display = 'none';
            document.querySelector('.header').style.display = 'flex';
            mainView.style.display = 'block';
            window.scrollTo(0, savedScrollPosition);
        });
    };

    const fallbackShowMain = () => {
        detailView.style.opacity = '0';
        setTimeout(() => {
            detailView.style.display = 'none';
            document.querySelector('.header').style.display = 'flex';
            mainView.style.display = 'block';

            // Restore scroll
            window.scrollTo(0, savedScrollPosition);

            requestAnimationFrame(() => {
                mainView.style.transition = 'opacity 0.3s ease';
                mainView.style.opacity = '1';
            });
        }, 200);
    };

    window.copyDiscordLink = (button) => {
        const link = document.getElementById('detail-discord-link').href;
        navigator.clipboard.writeText(link).then(() => {
            showToast('Đã sao chép link Discord!', 'success');
        }).catch(() => {
            showToast('Lỗi khi sao chép!', 'error');
        });
    };

    // --- Toast Logic ---
    const showToast = (message, type = 'success') => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        // Simple icons based on type
        const icon = type === 'success' ? '✅' : '⚠️';
        toast.innerHTML = `<i>${icon}</i> ${message}`;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    };

    // --- Init ---
    fetchGameData();

    // Event Listeners
    searchInput.addEventListener('input', () => renderGameList());

    const setActiveBtn = (btn) => {
        [filterAllBtn, filterVipBtn, filterFreeBtn, filterNormalBtn].forEach(b => {
            if (b) b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');
    };

    if (filterAllBtn) filterAllBtn.addEventListener('click', () => { currentFilter = 'all'; setActiveBtn(filterAllBtn); renderGameList(); });
    if (filterVipBtn) filterVipBtn.addEventListener('click', () => { currentFilter = 'vip'; setActiveBtn(filterVipBtn); renderGameList(); });
    if (filterFreeBtn) filterFreeBtn.addEventListener('click', () => { currentFilter = 'free'; setActiveBtn(filterFreeBtn); renderGameList(); });
    if (filterNormalBtn) filterNormalBtn.addEventListener('click', () => { currentFilter = 'normal'; setActiveBtn(filterNormalBtn); renderGameList(); });

    // Scroll To Top
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
    });
    if (scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// --- Announcement Modal Logic ---
(function () {
    const BACKDROP_ID = 'policy-modal-backdrop';
    const KEY_UNTIL = 'edenmod_policy_dismiss_until_3h';
    const KEY_LANG = 'edenmod_policy_lang';
    const KEY_VER = 'edenmod_policy_version';
    const NOTICE_VERSION = '2025-10-31-v2';
    const DISMISS_HOURS = 3;

    function setStore(key, val) { try { localStorage.setItem(key, val); } catch (e) { try { document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(val) + '; path=/; max-age=' + (365 * 24 * 3600); } catch (e2) { } } }
    function getStore(key) { try { return localStorage.getItem(key); } catch (e) { const m = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; } }
    function delStore(key) { try { localStorage.removeItem(key); } catch (e) { document.cookie = encodeURIComponent(key) + '=; path=/; max-age=0'; } }

    const $backdrop = document.getElementById(BACKDROP_ID);
    const $modal = document.getElementById('policy-modal');
    const $langVI = document.getElementById('lang-vi');
    const $langEN = document.getElementById('lang-en');
    const $boxVI = document.getElementById('policy-vi');
    const $boxEN = document.getElementById('policy-en');
    const $dont3h = document.getElementById('dont-show-3h');
    const $close = document.getElementById('policy-close');
    const $ok = document.getElementById('policy-accept');
    const $dontText = document.getElementById('dont-show-text');

    const storedLang = (getStore(KEY_LANG) || '').toLowerCase();
    const browserLang = (navigator.language || '').toLowerCase();
    const preferVI = storedLang ? storedLang === 'vi' : browserLang.startsWith('vi');

    function setLang(lang) {
        const vi = lang === 'vi';
        if ($langVI) {
            $langVI.classList.toggle('active', vi);
            $langVI.setAttribute('aria-selected', vi ? 'true' : 'false');
        }
        if ($langEN) {
            $langEN.classList.toggle('active', !vi);
            $langEN.setAttribute('aria-selected', !vi ? 'true' : 'false');
        }
        if ($boxVI) $boxVI.style.display = vi ? '' : 'none';
        if ($boxEN) $boxEN.style.display = vi ? 'none' : '';
        if ($dontText) $dontText.textContent = vi ? 'Đừng hiện lại trong 3 giờ' : "Don't show again for 3 hours";
        setStore(KEY_LANG, vi ? 'vi' : 'en');
    }

    function shouldShow() {
        try {
            const ver = getStore(KEY_VER);
            if (ver !== NOTICE_VERSION) return true;
            const until = Number(getStore(KEY_UNTIL) || 0);
            return Date.now() > until;
        } catch (e) { return true; }
    }

    function afterDismiss(save3h) {
        try { setStore(KEY_VER, NOTICE_VERSION); } catch (e) { }
        if (save3h) {
            const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000;
            try { setStore(KEY_UNTIL, String(until)); } catch (e) { }
        } else {
            try { delStore(KEY_UNTIL); } catch (e) { }
        }
    }

    function showModal() {
        if (!$backdrop) return;
        $backdrop.classList.add('show');
        $backdrop.setAttribute('aria-hidden', 'false');
    }
    function hideModal() {
        if (!$backdrop) return;
        $backdrop.classList.remove('show');
        $backdrop.setAttribute('aria-hidden', 'true');
    }

    function dismiss(save3h) { afterDismiss(save3h); hideModal(); }

    if ($langVI) $langVI.addEventListener('click', () => setLang('vi'));
    if ($langEN) $langEN.addEventListener('click', () => setLang('en'));
    if ($close) $close.addEventListener('click', () => dismiss($dont3h?.checked));
    if ($ok) $ok.addEventListener('click', () => dismiss($dont3h?.checked));
    if ($backdrop) $backdrop.addEventListener('click', (e) => { if (e.target === $backdrop) dismiss($dont3h?.checked); });

    setLang(preferVI ? 'vi' : 'en');
    if (shouldShow()) showModal();
})();

// --- Anti-DevTools Script ---
document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, false);
document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73 || e.key === 'J' || e.keyCode === 74 || e.key === 'C' || e.keyCode === 67)) { e.preventDefault(); return false; }
    if (e.ctrlKey && (e.key === 'U' || e.keyCode === 85)) { e.preventDefault(); return false; }
});