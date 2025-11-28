/**
 * comprar.js - VERSÃO DEFINITIVA (Enterprise Edition v5.0)
 * =========================================================
 * Recursos:
 * 1. Mapeamento de Imagem de Segurança (Garante que fotos apareçam).
 * 2. Normalização de Dados (Evita 'undefined').
 * 3. Deep Linking (Salva filtros na URL).
 * 4. Paginação Infinita (Load More).
 * 5. Debounce e Performance Otimizada.
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. CONFIGURAÇÃO CENTRAL
    // =========================================================================
    const App = {
        config: {
            // Porta do Servidor (ajuste se necessário para 3000 ou 3002)
            API_URL: 'http://localhost:3002/api/veiculos', 
            
            // Imagem padrão caso TUDO falhe (fundo cinza elegante)
            PLACEHOLDER: 'https://placehold.co/600x400/2a2a2a/FFFFFF?text=Foto+Indispon%C3%ADvel',
            
            ITEMS_PER_PAGE: 6,      // Quantos carros carrega por vez
            ANIMATION_SPEED: 400,   // Velocidade da animação em ms
            DEBOUNCE_DELAY: 300,    // Delay para inputs de texto/preço

            // === O SEGREDO DO SUCESSO: GALERIA DE SEGURANÇA ===
            // O sistema procura PALAVRAS-CHAVE no nome do carro.
            // Se encontrar (ex: "Jetta"), força esta imagem da Wikipedia.
            IMAGE_MAP_SAFETY: {
                'JETTA':    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/2022_Volkswagen_Jetta_GLI_2.0_s.jpg/800px-2022_Volkswagen_Jetta_GLI_2.0_s.jpg',
                'COROLLA':  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/2020_Toyota_Corolla_Altis_Hybrid_%28Philippines%29.jpg/800px-2020_Toyota_Corolla_Altis_Hybrid_%28Philippines%29.jpg',
                'EVEREST':  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/2022_Ford_Everest_Sport_V6_%28Thailand%29_front_view_01.jpg/800px-2022_Ford_Everest_Sport_V6_%28Thailand%29_front_view_01.jpg',
                'CIVIC':    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/2017_Honda_Civic_Si_Coupe_%28FC3%29%2C_front_11.17.19.jpg/800px-2017_Honda_Civic_Si_Coupe_%28FC3%29%2C_front_11.17.19.jpg',
                'COOPER':   'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Mini_Cooper_S_%28F56%29_%E2%80%93_Frontansicht%2C_12._April_2014%2C_D%C3%BCsseldorf.jpg/800px-Mini_Cooper_S_%28F56%29_%E2%80%93_Frontansicht%2C_12._April_2014%2C_D%C3%BCsseldorf.jpg',
                'HAVAL':    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Haval_H6_S_PHEV_IAA_2021_1X7A0064.jpg/800px-Haval_H6_S_PHEV_IAA_2021_1X7A0064.jpg',
                'HURACAN':  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2014-03-04_Geneva_Motor_Show_1379.JPG/800px-2014-03-04_Geneva_Motor_Show_1379.JPG',
                'M4':       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BMW_G82_IAA_2021_1X7A0086.jpg/800px-BMW_G82_IAA_2021_1X7A0086.jpg',
                'X7':       'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/2019_BMW_X7_xDrive40i_Front.jpg/800px-2019_BMW_X7_xDrive40i_Front.jpg',
                'GLE':      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Mercedes-Benz_C_167_Mondial_de_l%E2%80%99Auto_2024_1X7A0766.jpg/800px-Mercedes-Benz_C_167_Mondial_de_l%E2%80%99Auto_2024_1X7A0766.jpg',
                'RAPTOR':   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ford_F-150_Raptor_Gen3_img03.jpg/800px-Ford_F-150_Raptor_Gen3_img03.jpg',
                'TRX':      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ram_1500_TRX_%28restyling%29_%E2%80%93_Frontansicht%2C_10._April_2022%2C_D%C3%BCsseldorf.jpg/800px-Ram_1500_TRX_%28restyling%29_%E2%80%93_Frontansicht%2C_10._April_2022%2C_D%C3%BCsseldorf.jpg'
            }
        },

        // --- Estado Global (State) ---
        state: {
            rawData: [],        // Dados puros do banco
            viewData: [],       // Dados filtrados prontos para exibir
            renderedCount: 0,   // Controle de paginação
            searchQuery: ''
        },

        // --- Elementos HTML (Cache DOM) ---
        dom: {
            grid: document.getElementById('veiculos-grid'),
            counter: document.getElementById('resultados-contagem'),
            // Filtros
            filters: {
                marca: document.getElementById('filtro-marca'),
                categoria: document.getElementById('filtro-categoria'),
                preco: document.getElementById('filtro-preco'),
                precoLabel: document.getElementById('preco-valor'),
                radios: document.querySelectorAll('input[name="condicao"]'),
                btnLimpar: document.getElementById('limpar-filtros-btn')
            },
            sort: document.getElementById('ordenar-por'),
            loadMoreBtn: document.getElementById('load-more-btn'),
            headerSearch: document.getElementById('site-search')
        },

        // =====================================================================
        // 2. CICLO DE VIDA (INICIALIZAÇÃO)
        // =====================================================================
        init: async function() {
            console.log('🏎️ Imperial Motors App Iniciado.');
            
            this.ui.showSkeleton(); // Mostra esqueleto carregando

            // Busca dados da API
            const success = await this.data.fetchAll();

            if (success) {
                this.ui.populateSelects();      // Preenche os filtros de Marca/Categoria
                this.router.readURL();          // Lê filtros da URL (se houver)
                this.logic.refreshGrid(true);   // Renderiza a grade
                this.events.setupListeners();   // Ativa os cliques
            }
        },

        // =====================================================================
        // 3. DATA LAYER (Busca e Normalização)
        // =====================================================================
        data: {
            fetchAll: async function() {
                try {
                    const response = await fetch(App.config.API_URL);
                    if (!response.ok) throw new Error(`API Error ${response.status}`);
                    const json = await response.json();

                    // --- SANITIZAÇÃO DE DADOS (IMPEDE ERROS "UNDEFINED") ---
                    App.state.rawData = json.map(item => {
                        
                        // 1. Trata campos de texto que podem vir nulos
                        const model = item.modelo || 'Modelo Desconhecido';
                        const brand = item.nome_marca || item.marca || 'Marca Indefinida';
                        const cat = item.nome_categoria || item.categoria || 'Geral';

                        // 2. DETECTOR DE IMAGENS QUEBRADAS (SOLUÇÃO FINAL)
                        // A Lógica: Procura uma palavra chave no nome do carro que bata com o Mapa de Segurança
                        let safeImage = App.config.PLACEHOLDER; // Começa com o backup
                        const dbImage = item.imagem || item.imagem_url;

                        // Verifica no Mapa de Segurança
                        const keyMatch = Object.keys(App.config.IMAGE_MAP_SAFETY).find(key => 
                            model.toUpperCase().includes(key) || brand.toUpperCase().includes(key)
                        );

                        if (keyMatch) {
                            safeImage = App.config.IMAGE_MAP_SAFETY[keyMatch];
                        } else if (dbImage && dbImage.startsWith('http')) {
                            // Se não achou no mapa, mas tem link http válido no banco, usa ele
                            safeImage = dbImage;
                        }

                        // 3. Monta o objeto limpo
                        return {
                            ...item,
                            id: item.id_veiculo,
                            marca: brand,
                            categoria: cat,
                            modelo: model,
                            imagem: safeImage, // Link garantido
                            // Numéricos seguros
                            preco: Number(item.preco) || 0,
                            ano: Number(item.ano) || new Date().getFullYear(),
                            km: Number(item.km) || 0,
                            // Define se é 'Novo' (ano atual ou maior)
                            isNew: (Number(item.ano) >= new Date().getFullYear())
                        };
                    });

                    return true;

                } catch (error) {
                    console.error('❌ Falha ao carregar API:', error);
                    App.ui.showErrorState();
                    return false;
                }
            }
        },

        // =====================================================================
        // 4. LÓGICA (Filtragem e Ordenação)
        // =====================================================================
        logic: {
            refreshGrid: function(resetPagination = false) {
                this.applyFilters();
                this.applySorting();
                
                if (resetPagination) {
                    App.state.renderedCount = 0;
                    App.dom.grid.innerHTML = ''; // Limpa para nova busca
                }
                
                App.ui.renderCards();
                App.router.updateURL(); // Salva estado na URL
            },

            applyFilters: function() {
                const s = App.state;
                const d = App.dom.filters;
                
                // Normaliza valores para comparação (tudo minúsculo)
                const valMarca = d.marca.value.toLowerCase();
                const valCat = d.categoria.value.toLowerCase();
                const valPreco = parseFloat(d.preco.value);
                const valCond = document.querySelector('input[name="condicao"]:checked').value;
                const valSearch = App.utils.slugify(s.searchQuery); // Busca texto

                s.viewData = s.rawData.filter(car => {
                    const carBrand = car.marca.toLowerCase();
                    const carCat = car.categoria.toLowerCase();
                    const carSlug = App.utils.slugify(car.modelo + " " + car.marca); // Cria slug para busca fácil

                    const matchSearch = !valSearch || carSlug.includes(valSearch);
                    const matchBrand = valMarca === 'todas' || carBrand === valMarca;
                    const matchCat = valCat === 'todas' || carCat === valCat;
                    const matchPrice = car.preco <= valPreco;
                    
                    let matchCond = true;
                    if (valCond === 'novo') matchCond = car.isNew;
                    if (valCond === 'usado') matchCond = !car.isNew;

                    return matchSearch && matchBrand && matchCat && matchPrice && matchCond;
                });
            },

            applySorting: function() {
                const type = App.dom.sort.value;
                const list = App.state.viewData;

                switch (type) {
                    case 'preco-menor': list.sort((a, b) => a.preco - b.preco); break;
                    case 'preco-maior': list.sort((a, b) => b.preco - a.preco); break;
                    case 'ano-novo':    list.sort((a, b) => b.ano - a.ano); break;
                    default:            list.sort((a, b) => b.id - a.id); // Padrão: Mais recentes primeiro
                }
            }
        },

        // =====================================================================
        // 5. INTERFACE (HTML Generation)
        // =====================================================================
        ui: {
            showSkeleton: function() {
                // Gera 6 cards falsos pulsantes
                const skelHTML = `<div class="veiculo-card skeleton"><div class="skel-img"></div><div class="skel-body"><div class="skel-line w70"></div><div class="skel-line w40"></div><div class="skel-line w100"></div></div></div>`;
                App.dom.grid.innerHTML = Array(6).fill(skelHTML).join('');
            },

            showErrorState: function() {
                App.dom.grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:50px; color:#d9534f;">
                        <h3>Falha na Conexão</h3>
                        <p>Verifique se o servidor está rodando (Porta 3002).</p>
                        <button onclick="location.reload()" style="padding:10px 20px; margin-top:10px; cursor:pointer;">Tentar Novamente</button>
                    </div>`;
            },

            renderCards: function() {
                const s = App.state;
                const totalFiltered = s.viewData.length;
                App.dom.counter.innerText = `${totalFiltered} resultados`;

                if (totalFiltered === 0) {
                    App.dom.grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px;"><h3>Nenhum veículo encontrado 😕</h3><p>Tente mudar os filtros.</p></div>`;
                    App.dom.loadMoreBtn.style.display = 'none';
                    return;
                }

                // Lógica de Paginação (Fatia o array)
                const start = s.renderedCount;
                const end = start + App.config.ITEMS_PER_PAGE;
                const pageItems = s.viewData.slice(start, end);

                const fragment = document.createDocumentFragment();

                pageItems.forEach(car => {
                    const el = document.createElement('div');
                    el.className = 'veiculo-card fade-in';
                    
                    const price = car.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const badge = car.isNew ? '<span class="badge-new">NOVO</span>' : '';

                    el.innerHTML = `
                        <div class="card-imagem">
                            ${badge}
                            <img src="${car.imagem}" alt="${car.marca} ${car.modelo}" loading="lazy" onerror="this.src='${App.config.PLACEHOLDER}'">
                        </div>
                        <div class="card-conteudo">
                            <div class="card-meta"><span>${car.marca}</span></div>
                            <h3>${car.modelo}</h3>
                            <div class="card-details">
                                <span>${car.ano}</span> &bull; <span>${car.km.toLocaleString()} km</span>
                            </div>
                            <div class="card-price">${price}</div>
                            <a href="detalhes.html?id=${car.id}" class="card-botao">Ver Detalhes</a>
                        </div>
                    `;
                    fragment.appendChild(el);
                });

                App.dom.grid.appendChild(fragment);
                s.renderedCount += pageItems.length;

                // Botão Load More
                if (s.renderedCount >= totalFiltered) {
                    App.dom.loadMoreBtn.style.display = 'none';
                } else {
                    App.dom.loadMoreBtn.style.display = 'block';
                    App.dom.loadMoreBtn.textContent = `Carregar Mais (${totalFiltered - s.renderedCount})`;
                }
            },

            populateSelects: function() {
                const data = App.state.rawData;
                const marcas = [...new Set(data.map(i => i.marca).filter(Boolean))].sort();
                const cats = [...new Set(data.map(i => i.categoria).filter(Boolean))].sort();
                
                App.utils.fillSelect(App.dom.filters.marca, marcas);
                App.utils.fillSelect(App.dom.filters.categoria, cats);
            }
        },

        // =====================================================================
        // 6. ROUTER (Sincronia com URL)
        // =====================================================================
        router: {
            updateURL: function() {
                const url = new URL(window.location);
                const f = App.dom.filters;
                
                const set = (k, v, def) => v !== def ? url.searchParams.set(k, v) : url.searchParams.delete(k);
                
                set('marca', f.marca.value, 'todas');
                set('categoria', f.categoria.value, 'todas');
                set('q', App.state.searchQuery, '');
                
                // Condição
                const cond = document.querySelector('input[name="condicao"]:checked').value;
                set('cond', cond, 'todas');

                window.history.replaceState({}, '', url);
            },

            readURL: function() {
                const p = new URLSearchParams(window.location.search);
                const f = App.dom.filters;
                
                if (p.has('marca')) f.marca.value = p.get('marca');
                if (p.has('categoria')) f.categoria.value = p.get('categoria');
                if (p.has('q')) {
                    App.state.searchQuery = p.get('q');
                    if (App.dom.headerSearch) App.dom.headerSearch.value = p.get('q');
                }
                if (p.has('cond')) {
                    const r = document.querySelector(`input[name="condicao"][value="${p.get('cond')}"]`);
                    if(r) r.checked = true;
                }
            }
        },

        // =====================================================================
        // 7. EVENTOS E HELPERS
        // =====================================================================
        events: {
            setupListeners: function() {
                const dom = App.dom;
                
                // Atualizador genérico (reinicia grid)
                const update = () => App.logic.refreshGrid(true);

                // Filtros de Select/Radio
                dom.filters.marca.addEventListener('change', update);
                dom.filters.categoria.addEventListener('change', update);
                dom.filters.radios.forEach(el => el.addEventListener('change', update));
                dom.sort.addEventListener('change', update);

                // Slider de Preço com Debounce
                const delayPrice = App.utils.debounce(() => update(), App.config.DEBOUNCE_DELAY);
                dom.filters.preco.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
                    dom.filters.precoLabel.textContent = `Até ${val}`;
                    delayPrice();
                });

                // Busca no Header
                if (dom.headerSearch) {
                    dom.headerSearch.addEventListener('keyup', App.utils.debounce((e) => {
                        App.state.searchQuery = e.target.value;
                        update();
                    }, 500));
                }

                // Load More
                if (dom.loadMoreBtn) {
                    dom.loadMoreBtn.addEventListener('click', () => App.ui.renderCards());
                }

                // Limpar Tudo
                dom.filters.btnLimpar.addEventListener('click', () => {
                    dom.filters.marca.value = 'todas';
                    dom.filters.categoria.value = 'todas';
                    document.getElementById('cond-todas').checked = true;
                    dom.filters.preco.value = dom.filters.preco.max;
                    dom.sort.value = 'relevancia';
                    App.state.searchQuery = '';
                    if (dom.headerSearch) dom.headerSearch.value = '';
                    update();
                });
            }
        },

        utils: {
            // Remove acentos e deixa minusculo (Busca inteligente)
            slugify: (t) => t ? t.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : '',
            
            // Popula selects mantendo a opção 'todas'
            fillSelect: (el, list) => {
                const oldVal = el.value;
                el.innerHTML = el.firstElementChild.outerHTML; // Mantém <option> padrão
                list.forEach(val => {
                    const opt = document.createElement('option');
                    opt.value = val; opt.text = val;
                    el.add(opt);
                });
                el.value = oldVal;
            },

            // Debounce para não travar com slider
            debounce: (func, wait) => {
                let t;
                return (...args) => {
                    clearTimeout(t);
                    t = setTimeout(() => func(...args), wait);
                };
            }
        }
    };

    // INICIAR
    App.init();
});