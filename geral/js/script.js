// script.js (VERSÃO FINAL COMPLETA - SEM REMOÇÃO DE CÓDIGO)

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // BLOCO 1: LÓGICA DO MENU E SIDEBAR (GERAL)
    // ==========================================================
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    
    // Só executa o código do menu se o botão de abrir a sidebar existir na página
    if (openSidebarBtn) {
        const closeSidebarBtn = document.getElementById('close-sidebar-btn');
        const sidebar = document.getElementById('my-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const body = document.body;

        const focusableElementsString = 'a[href], button:not([disabled]), textarea, input, select';
        let firstFocusableElement;
        let lastFocusableElement;

        function openSidebar() {
            body.classList.add('sidebar-is-open');
            openSidebarBtn.setAttribute('aria-expanded', 'true');
            sidebar.setAttribute('aria-hidden', 'false');
            setFocusableElements();
            setTimeout(() => {
                if (closeSidebarBtn) {
                     closeSidebarBtn.focus();
                } else if (firstFocusableElement) {
                    firstFocusableElement.focus();
                }
            }, 100);
            addCloseListeners();
        }

        function closeSidebar() {
            body.classList.remove('sidebar-is-open');
            openSidebarBtn.setAttribute('aria-expanded', 'false');
            sidebar.setAttribute('aria-hidden', 'true');
            if (openSidebarBtn) openSidebarBtn.focus();
            removeCloseListeners();
        }

        function setFocusableElements() {
            const focusableContent = sidebar.querySelectorAll(focusableElementsString);
            if (focusableContent.length > 0) {
                firstFocusableElement = focusableContent[0];
                lastFocusableElement = focusableContent[focusableContent.length - 1];
            } else {
                firstFocusableElement = closeSidebarBtn;
                lastFocusableElement = closeSidebarBtn;
            }
        }

        function handleFocusTrap(e) {
            if (e.key !== 'Tab' || (!firstFocusableElement && !lastFocusableElement)) return;
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    if (lastFocusableElement) lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    if (firstFocusableElement) firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }

        function handleEscapeKey(e) {
            if (e.key === 'Escape' && body.classList.contains('sidebar-is-open')) {
                closeSidebar();
            }
        }

        function addCloseListeners() {
            if(overlay) overlay.addEventListener('click', closeSidebar);
            if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
            document.addEventListener('keydown', handleEscapeKey);
            if(sidebar) sidebar.addEventListener('keydown', handleFocusTrap);
        }

        function removeCloseListeners() {
            if(overlay) overlay.removeEventListener('click', closeSidebar);
            if(closeSidebarBtn) closeSidebarBtn.removeEventListener('click', closeSidebar);
            document.removeEventListener('keydown', handleEscapeKey);
            if(sidebar) sidebar.removeEventListener('keydown', handleFocusTrap);
        }

        openSidebarBtn.addEventListener('click', openSidebar);
    }


    // ==========================================================
    // BLOCO 2: LÓGICA DO CARROSSEL DE MODELOS (SÓ RODA NO INDEX.HTML)
    // ==========================================================
    const carouselContainer = document.querySelector('#modelos .modelos-multi-carousel-container');
    
    // Só executa se o container do carrossel existir
    if (carouselContainer) {
        const track = document.querySelector('#modelos .modelos-multi-carousel-track');
        const originalItems = Array.from(document.querySelectorAll('#modelos .modelo-item-original'));

        if (!track || !originalItems || originalItems.length === 0) {
            console.warn('Elementos do carrossel de múltiplos itens não encontrados ou sem itens originais.');
        } else {
            const itemsVisible = 3;
            const itemsToScroll = 1;
            const itemNominalWidth = 200;
            const itemGap = 20;
            const itemTotalWidth = itemNominalWidth + itemGap;

            let currentIndex = 0;
            let autoPlayInterval;
            const AUTOPLAY_DELAY = 2000;
            let totalClonedItems = 0;
            const clonesAtEachEnd = itemsVisible * 2;

            function setupCarousel() {
                track.innerHTML = '';
                if (originalItems.length === 0) return;

                let trackItemNodes = [];
                for (let i = 0; i < clonesAtEachEnd; i++) {
                    trackItemNodes.push(originalItems[(originalItems.length - clonesAtEachEnd + i) % originalItems.length].cloneNode(true));
                }
                originalItems.forEach(item => trackItemNodes.push(item.cloneNode(true)));
                for (let i = 0; i < clonesAtEachEnd; i++) {
                    trackItemNodes.push(originalItems[i % originalItems.length].cloneNode(true));
                }
                
                totalClonedItems = trackItemNodes.length;

                trackItemNodes.forEach(node => {
                    node.classList.remove('modelo-item-original');
                    node.classList.add('modelo-item-display');
                    track.appendChild(node);
                });
                
                currentIndex = clonesAtEachEnd;
                track.style.transition = 'none';
                track.style.transform = `translateX(-${currentIndex * itemTotalWidth}px)`;
                track.offsetHeight;
                track.style.transition = `transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)`;
            }

            function moveToNext() {
                if (track.children.length <= itemsVisible) return;
                currentIndex += itemsToScroll;
                track.style.transform = `translateX(-${currentIndex * itemTotalWidth}px)`;

                if (currentIndex >= (totalClonedItems - clonesAtEachEnd)) {
                    const resetLoop = () => {
                        track.removeEventListener('transitionend', resetLoop);
                        currentIndex = clonesAtEachEnd + ((currentIndex - clonesAtEachEnd) % originalItems.length);
                        track.style.transition = 'none';
                        track.style.transform = `translateX(-${currentIndex * itemTotalWidth}px)`;
                        track.offsetHeight;
                        track.style.transition = `transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)`;
                    };
                    track.addEventListener('transitionend', resetLoop, { once: true });
                }
            }

            const startAutoPlay = () => {
                if (originalItems.length <= itemsVisible) return;
                stopAutoPlay();
                autoPlayInterval = setInterval(moveToNext, AUTOPLAY_DELAY);
            };

            const stopAutoPlay = () => {
                clearInterval(autoPlayInterval);
            };

            carouselContainer.addEventListener('mouseenter', stopAutoPlay);
            carouselContainer.addEventListener('mouseleave', startAutoPlay);
            
            setupCarousel();
            if (originalItems.length > itemsVisible) {
                startAutoPlay();
            }

            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    stopAutoPlay();
                    setupCarousel();
                    if (originalItems.length > itemsVisible) startAutoPlay();
                }, 300);
            });
        }
    }


    // ==========================================================
    // BLOCO 3: LÓGICA DA SUBNAVEGAÇÃO (SÓ RODA NO INDEX.HTML)
    // ==========================================================
    const subNavContainer = document.querySelector('#sua-viagem .sub-navigation');

    // Só executa se a navegação por abas existir
    if (subNavContainer) {
        const subNavList = subNavContainer.querySelector('ul');
        const subNavItems = subNavList.querySelectorAll('li');
        const highlighter = subNavContainer.querySelector('.underline-highlighter');
        const allGridItems = document.querySelectorAll('#sua-viagem .viagem-grid .viagem-item');

        function updateHighlighter(activeItem) {
            if (!activeItem || !highlighter || !subNavList) return;

            subNavItems.forEach(item => item.classList.remove('active'));
            activeItem.classList.add('active');

            const itemOffsetLeftRelativeToUL = activeItem.offsetLeft;
            const itemWidth = activeItem.offsetWidth;
            const ulOffsetLeftRelativeToNav = subNavList.offsetLeft;
            const finalOffsetLeft = ulOffsetLeftRelativeToNav + itemOffsetLeftRelativeToUL;

            highlighter.style.width = `${itemWidth}px`;
            highlighter.style.transform = `translateX(${finalOffsetLeft}px)`;
        }

        function loadCategoryContent(categoryToShow) {
            allGridItems.forEach(item => {
                item.style.display = item.dataset.category === categoryToShow ? 'block' : 'none';
            });
        }

        let initialActiveItem = subNavList.querySelector('li.active');
        if (!initialActiveItem && subNavItems.length > 0) {
            subNavItems[0].classList.add('active');
            initialActiveItem = subNavItems[0];
        }

        if (initialActiveItem) {
            setTimeout(() => {
                updateHighlighter(initialActiveItem);
                loadCategoryContent(initialActiveItem.dataset.category);
            }, 0);
        }

        subNavItems.forEach(item => {
            item.addEventListener('click', function(event) {
                event.preventDefault();
                if (this.classList.contains('active')) return;
                updateHighlighter(this);
                loadCategoryContent(this.dataset.category);
            });
        });
    }


    // ==========================================================
    // BLOCO 4: LÓGICA DA BARRA DE BUSCA (GERAL)
    // ==========================================================
    const searchContainer = document.querySelector('.search-container');
    
    // Só executa se o container de busca existir
    if (searchContainer) {
        const searchInput = document.getElementById('site-search');
        const searchButton = document.querySelector('.search-container .search-button');

        if (searchInput && searchButton) {
            function performSiteSearch() {
                const query = searchInput.value.trim();
                if (query) {
                    alert(`Você buscou por: ${query}`);
                    console.log(`Buscando por: ${query}`);
                    // Ação de busca real viria aqui
                } else {
                    if (searchContainer.classList.contains('search-active')) {
                        searchInput.focus();
                    }
                }
            }

            searchButton.addEventListener('click', (event) => {
                if (!searchContainer.classList.contains('search-active')) {
                    event.preventDefault();
                    searchContainer.classList.add('search-active');
                    setTimeout(() => searchInput.focus(), 150);
                } else {
                    performSiteSearch();
                }
            });

            searchInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    performSiteSearch();
                }
            });

            searchInput.addEventListener('blur', () => {
                if (searchInput.value.trim() === '') {
                    searchContainer.classList.remove('search-active');
                }
            });
        }
    }
});