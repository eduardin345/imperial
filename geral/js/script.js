document.addEventListener('DOMContentLoaded', () => {
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('my-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const body = document.body;

    // Elementos focáveis dentro da sidebar para o "focus trap"
    const focusableElementsString = 'a[href], button:not([disabled]), textarea, input, select';
    let firstFocusableElement;
    let lastFocusableElement;

    function openSidebar() {
        body.classList.add('sidebar-is-open');
        openSidebarBtn.setAttribute('aria-expanded', 'true');
        sidebar.setAttribute('aria-hidden', 'false');

        // Gerenciamento de foco
        setFocusableElements();
        // Atraso pequeno para garantir que a sidebar esteja visível antes de focar
        setTimeout(() => {
            if (closeSidebarBtn) {
                 closeSidebarBtn.focus(); // Foca no botão de fechar
            } else if (firstFocusableElement) {
                firstFocusableElement.focus();
            }
        }, 100); // 100ms pode ser ajustado

        // Adiciona listeners para fechar
        addCloseListeners();
    }

    function closeSidebar() {
        body.classList.remove('sidebar-is-open');
        openSidebarBtn.setAttribute('aria-expanded', 'false');
        sidebar.setAttribute('aria-hidden', 'true');

        // Devolve o foco ao botão que abriu a sidebar
        openSidebarBtn.focus();

        // Remove listeners para fechar
        removeCloseListeners();
    }

    function setFocusableElements() {
        const focusableContent = sidebar.querySelectorAll(focusableElementsString);
        if (focusableContent.length > 0) {
            firstFocusableElement = focusableContent[0];
            lastFocusableElement = focusableContent[focusableContent.length - 1];
        } else {
            // Se não houver outros, o botão fechar é o único
            firstFocusableElement = closeSidebarBtn;
            lastFocusableElement = closeSidebarBtn;
        }
    }

    // Prende o foco dentro da sidebar (Focus Trap)
    function handleFocusTrap(e) {
        if (e.key !== 'Tab' || (!firstFocusableElement && !lastFocusableElement)) {
            return;
        }

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstFocusableElement) {
                if (lastFocusableElement) lastFocusableElement.focus();
                e.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === lastFocusableElement) {
                if (firstFocusableElement) firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    }

    // Fecha com a tecla Escape
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && body.classList.contains('sidebar-is-open')) {
            closeSidebar();
        }
    }

    function addCloseListeners() {
        overlay.addEventListener('click', closeSidebar);
        if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
        document.addEventListener('keydown', handleEscapeKey);
        sidebar.addEventListener('keydown', handleFocusTrap); // Adiciona trap de foco
    }

    function removeCloseListeners() {
        overlay.removeEventListener('click', closeSidebar);
        if(closeSidebarBtn) closeSidebarBtn.removeEventListener('click', closeSidebar);
        document.removeEventListener('keydown', handleEscapeKey);
        sidebar.removeEventListener('keydown', handleFocusTrap); // Remove trap de foco
    }


    // Event Listeners principais
    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', openSidebar);
    }

    // Opcional: Fechar sidebar ao clicar em um link dentro dela (se for navegação na mesma página)
    sidebar.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', (event) => {
            // Verifique se é um link para a mesma página (âncora)
            if (link.getAttribute('href').startsWith('#') || link.pathname === window.location.pathname) {
                 if (body.classList.contains('sidebar-is-open')) {
                    closeSidebar();
                }
            }
            // Se for um link para outra página, a sidebar fechará com o carregamento da nova página.
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#modelos .modelos-multi-carousel-container');
    const track = document.querySelector('#modelos .modelos-multi-carousel-track');
    const originalItems = Array.from(document.querySelectorAll('#modelos .modelo-item-original'));

    if (!container || !track || !originalItems.length) {
        console.warn('Elementos do carrossel de múltiplos itens não encontrados ou sem itens originais.');
        return;
    }

    const itemsVisible = 3;
    const itemsToScroll = 1; // Quantos itens rolam por vez (mudar para 3 se quiser que o bloco de 3 avance)
    const itemNominalWidth = 200; // Largura base do item (CSS .modelo-item-display width)
    const itemGap = 20;          // Espaçamento (CSS .modelo-item-display margin-right)
    const itemTotalWidth = itemNominalWidth + itemGap; // Largura de um item + seu gap à direita

    let currentIndex = 0;
    let autoPlayInterval;
    const AUTOPLAY_DELAY = 2000; // 4 segundos
    let displayItems = [];
    let totalClonedItems = 0; // Será o número total de itens no track (originais + clones)
    const clonesAtEachEnd = itemsVisible * 2; // Número de clones para adicionar em cada extremidade para o loop

    function setupCarousel() {
        track.innerHTML = '';
        displayItems = [];

        if (originalItems.length === 0) return;

        // Criar a lista de itens para o track, incluindo clones para o loop
        let trackItemNodes = [];

        // Adicionar clones do final dos originais no início do track
        for (let i = 0; i < clonesAtEachEnd; i++) {
            trackItemNodes.push(originalItems[(originalItems.length - clonesAtEachEnd + i) % originalItems.length].cloneNode(true));
        }

        // Adicionar os itens originais
        originalItems.forEach(item => trackItemNodes.push(item.cloneNode(true)));

        // Adicionar clones do início dos originais no final do track
        for (let i = 0; i < clonesAtEachEnd; i++) {
            trackItemNodes.push(originalItems[i % originalItems.length].cloneNode(true));
        }
        
        totalClonedItems = trackItemNodes.length;

        trackItemNodes.forEach(node => {
            node.classList.remove('modelo-item-original');
            node.classList.add('modelo-item-display');
            track.appendChild(node);
            displayItems.push(node); // Adiciona o elemento DOM real
        });
        
        // Ponto de partida: após os clones iniciais
        currentIndex = clonesAtEachEnd; 
        track.style.transition = 'none';
        track.style.transform = `translateX(-${currentIndex * itemTotalWidth}px)`;
        
        track.offsetHeight; // Força reflow
        track.style.transition = `transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)`;
    }

    function moveToNext() {
        if (displayItems.length <= itemsVisible) return;

        currentIndex += itemsToScroll;
        track.style.transform = `translateX(-${currentIndex * itemTotalWidth}px)`;

        // Lógica para o loop infinito (teletransporte para frente)
        if (currentIndex >= (totalClonedItems - clonesAtEachEnd)) {
            track.addEventListener('transitionend', function resetLoop() {
                track.removeEventListener('transitionend', resetLoop);
                currentIndex = clonesAtEachEnd + ((currentIndex - clonesAtEachEnd) % originalItems.length);
                track.style.transition = 'none';
                track.style.transform = `translateX(-${currentIndex * itemTotalWidth}px)`;
                track.offsetHeight; // Força reflow
                track.style.transition = `transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)`;
            }, { once: true });
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

    // Event Listeners para pausar no hover
    if (container && originalItems.length > itemsVisible) {
        container.addEventListener('mouseenter', stopAutoPlay);
        container.addEventListener('mouseleave', startAutoPlay);
    }
    
    // Inicialização
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
            if (originalItems.length > itemsVisible) {
                startAutoPlay();
            }
        }, 300);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // ... SEU CÓDIGO JS EXISTENTE PARA OUTRAS PARTES (MENU PRINCIPAL, ETC.) ...

    // --- CÓDIGO PARA SUBNAVEGAÇÃO E GRID DINÂMICO ---
    const subNavContainer = document.querySelector('#sua-viagem .sub-navigation');

    if (subNavContainer) {
        const subNavList = subNavContainer.querySelector('ul');
        const subNavItems = subNavList.querySelectorAll('li'); // Seleciona os LIs
        const highlighter = subNavContainer.querySelector('.underline-highlighter');
        const viagemGrid = document.querySelector('#sua-viagem .viagem-grid');
        const allGridItems = viagemGrid ? viagemGrid.querySelectorAll('.viagem-item.item-content') : [];

        function updateHighlighter(activeItem) {
            if (!activeItem || !highlighter || !subNavList) return;

            // Remove 'active' de todos os LIs
            subNavItems.forEach(item => item.classList.remove('active'));
            // Adiciona 'active' ao LI clicado
            activeItem.classList.add('active');

            // activeItem é o <li>
            const itemOffsetLeftRelativeToUL = activeItem.offsetLeft;
            const itemWidth = activeItem.offsetWidth;

            // Se o highlighter é filho direto do nav (subNavContainer),
            // e o UL está centralizado dentro do NAV com display:inline-block no NAV
            // Precisamos do offset do UL em relação ao NAV.
            // Se o UL ocupa 100% do NAV, ulOffsetLeft seria 0.
            const ulOffsetLeftRelativeToNav = subNavList.offsetLeft;
            
            const finalOffsetLeft = ulOffsetLeftRelativeToNav + itemOffsetLeftRelativeToUL;

            highlighter.style.width = `${itemWidth}px`;
            highlighter.style.transform = `translateX(${finalOffsetLeft}px)`;
        }

        function loadCategoryContent(categoryToShow) {
            if (!allGridItems.length) return;

            allGridItems.forEach(item => {
                if (item.dataset.category === categoryToShow) {
                    item.style.display = 'block'; // Ou 'flex', 'grid' conforme o layout do seu .viagem-item
                    // Para um pequeno fade-in, você pode fazer:
                    // item.style.opacity = '0';
                    // setTimeout(() => item.style.opacity = '1', 50);
                } else {
                    item.style.display = 'none';
                    // item.style.opacity = '0'; // Para fade-out
                }
            });
        }

        // Inicialização correta
        let initialActiveItem = subNavList.querySelector('li.active');
        if (!initialActiveItem && subNavItems.length > 0) {
            // Se nenhum estiver ativo no HTML, ativa o primeiro por padrão
            subNavItems[0].classList.add('active');
            initialActiveItem = subNavItems[0];
        }

        if (initialActiveItem) {
            // Atraso mínimo para garantir que os offsets sejam calculados após o render inicial
            // E especialmente após o CSS ser totalmente aplicado
            setTimeout(() => {
                updateHighlighter(initialActiveItem);
                const initialCategory = initialActiveItem.dataset.category;
                if (initialCategory) {
                    loadCategoryContent(initialCategory);
                }
            }, 0); // Um timeout de 0 adia a execução para o próximo ciclo de eventos
        }

        subNavItems.forEach(item => {
            item.addEventListener('click', function(event) {
                event.preventDefault();

                if (this.classList.contains('active')) {
                    return;
                }
                
                updateHighlighter(this);
                const category = this.dataset.category;
                if (category) {
                    loadCategoryContent(category);
                }
            });
        });
    }


    document.addEventListener('DOMContentLoaded', () => {
    // ... (seu código existente para menu e sidebar) ...

    // --- Lógica da Barra de Busca ---
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('site-search');
    const searchButton = document.querySelector('.search-container .search-button');

    if (searchContainer && searchInput && searchButton) {
        searchButton.addEventListener('click', function(event) {
            // Se o container NÃO está ativo, ativa-o e foca no input
            if (!searchContainer.classList.contains('search-active')) {
                searchContainer.classList.add('search-active');
                
                // Pequeno delay para focar APÓS a animação de expansão ter iniciado
                // e o input estar realmente visível para receber foco.
                setTimeout(() => {
                    searchInput.focus();
                }, 150); // Ajuste este tempo (ms) se a transição do container for mais longa/curta
                event.preventDefault(); // Previne qualquer comportamento padrão do botão
            } else {
                // Se o container JÁ ESTÁ ATIVO (input visível), então o clique na lupa executa a busca
                performSiteSearch();
            }
        });

        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSiteSearch();
            }
        });

        // Ao perder o foco do input, se estiver vazio, remove a classe para encolher.
        // :focus-within no CSS cuidará de manter aberto se o foco for para o botão.
        searchInput.addEventListener('blur', function() {
            // Para evitar que feche imediatamente se o clique foi no botão de busca
            // verificamos se o elemento que vai receber o foco é o searchButton.
            // document.activeElement nem sempre está atualizado no evento blur.
            // Uma forma mais segura é verificar se o mouse está sobre o botão,
            // mas vamos simplificar: se o input está vazio, tentamos fechar.
            // A classe .search-active pode ser mais determinante.
            if (searchInput.value.trim() === '') {
                // Somente remove a classe se o foco não for para o botão.
                // A forma mais simples aqui é deixar que o usuário clique fora ou
                // clique na lupa (vazia) novamente para "minimizar".
                // Para um auto-recolhimento mais robusto, precisaria de lógica mais complexa
                // ou depender apenas do :focus-within e de o usuário clicar fora de todo o componente.
                
                // Vamos manter simples: se input está vazio no blur, remove 'search-active'
                // Se o usuário clicou no botão de busca, ele será re-adicionado pelo listener do botão.
                 searchContainer.classList.remove('search-active');
            }
        });

        function performSiteSearch() {
            const query = searchInput.value.trim();
            if (query) {
                alert(`Você buscou por: ${query}`);
                console.log(`Buscando por: ${query}`);
                // Implemente sua lógica de busca real aqui
            } else {
                // Se não houver texto, e o input está visível, foca nele.
                // Se o input já estava focado, não faz nada extra.
                if (searchContainer.classList.contains('search-active')) {
                    searchInput.focus();
                }
            }
        }
    }
    // --- Fim da Lógica da Barra de Busca ---
});
    // --- FIM DO CÓDIGO PARA SUBNAVEGAÇÃO ---

});

// --- CÓDIGO PARA SUBNAVEGAÇÃO E GRID DINÂMICO ---

// Dentro de script.js

// --- LÓGICA DA NAVEGAÇÃO COM DESTAQUE ---
const subNavContainer = document.querySelector('#sua-viagem .sub-navigation');

// VERIFICAÇÃO ADICIONADA AQUI!
if (subNavContainer) {
    // TODO O CÓDIGO DESTA NAVEGAÇÃO VAI AQUI DENTRO
    // const subNavItems = ...
    // const highlighter = ...
    // ...resto da lógica da navegação...
}


// Dentro de script.js

// --- LÓGICA DO CARROSSEL DE MODELOS (AUTOPLAY) ---
const carouselContainer = document.querySelector('#modelos .modelos-multi-carousel-container');

// VERIFICAÇÃO ADICIONADA AQUI!
if (carouselContainer) {
    // TODO O CÓDIGO DO CARROSSEL VAI AQUI DENTRO
    const carouselTrack = document.querySelector('#modelos .modelos-multi-carousel-track');
    const originalItems = Array.from(document.querySelectorAll('#modelos .modelo-item-original'));

    // if (carouselTrack && originalItems.length > 0) { ... }
    // ...resto da lógica do carrossel...
}