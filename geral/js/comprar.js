/**
 * comprar.js - Versão Definitiva (Enterprise Grade)
 * Gerencia a listagem, filtragem e renderização dos veículos.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. CONFIGURAÇÕES E ESTADO
    // ========================================================
    const App = {
        config: {
            API_URL: 'http://localhost:3002/api/veiculos', // Confirme sua porta aqui
            PLACEHOLDER_IMG: 'img/placeholder.webp',
            LOCALE: 'pt-BR',
            CURRENCY: 'BRL'
        },
        
        state: {
            allVehicles: [],      // Dados originais da API
            filteredVehicles: [], // Dados sendo exibidos atualmente
            isLoading: false
        },

        elements: {
            grid: document.getElementById('veiculos-grid'),
            counter: document.getElementById('resultados-contagem'),
            filters: {
                marca: document.getElementById('filtro-marca'),
                categoria: document.getElementById('filtro-categoria'),
                preco: document.getElementById('filtro-preco'),
                precoLabel: document.getElementById('preco-valor'),
                condicao: document.querySelectorAll('input[name="condicao"]'),
                limparBtn: document.getElementById('limpar-filtros-btn')
            },
            sort: document.getElementById('ordenar-por')
        },

        // ========================================================
        // 2. INICIALIZAÇÃO
        // ========================================================
        init: async function() {
            this.setLoading(true);
            try {
                await this.fetchData();
                this.populateFilters();
                this.applyFilters(); // Renderiza inicial
                this.bindEvents();
            } catch (error) {
                console.error("Erro crítico na inicialização:", error);
                this.renderError("Falha ao conectar com o servidor. Verifique se a API está rodando.");
            } finally {
                this.setLoading(false);
            }
        },

        // ========================================================
        // 3. COMUNICAÇÃO COM A API
        // ========================================================
        fetchData: async function() {
            const response = await fetch(this.config.API_URL);
            
            if (!response.ok) {
                throw new Error(`Status da API: ${response.status}`);
            }

            const data = await response.json();
            
            // Sanitização inicial dos dados
            this.state.allVehicles = data.map(v => ({
                ...v,
                // Garante que preço e ano sejam números
                preco: Number(v.preco) || 0,
                ano: Number(v.ano) || 0,
                // Garante normalização de strings para evitar "undefined"
                nome_marca: v.nome_marca || v.marca || 'Marca Indefinida',
                nome_categoria: v.nome_categoria || v.categoria || 'Geral'
            }));
            
            this.state.filteredVehicles = [...this.state.allVehicles];
        },

        // ========================================================
        // 4. LÓGICA DE FILTRAGEM (O CORAÇÃO DO SISTEMA)
        // ========================================================
        applyFilters: function() {
            let result = [...this.state.allVehicles];
            const { filters } = this.elements;

            // 1. Filtro de Marca
            const selectedMarca = filters.marca.value;
            if (selectedMarca !== 'todas') {
                result = result.filter(v => 
                    (v.nome_marca || '').toLowerCase() === selectedMarca.toLowerCase()
                );
            }

            // 2. Filtro de Categoria
            const selectedCategoria = filters.categoria.value;
            if (selectedCategoria !== 'todas') {
                result = result.filter(v => 
                    (v.nome_categoria || '').toLowerCase() === selectedCategoria.toLowerCase()
                );
            }

            // 3. Filtro de Preço
            const maxPrice = parseFloat(filters.preco.value);
            result = result.filter(v => v.preco <= maxPrice);

            // 4. Filtro de Condição (Novo vs Usado baseado no Ano)
            const selectedCondicao = document.querySelector('input[name="condicao"]:checked').value;
            const currentYear = new Date().getFullYear();
            
            if (selectedCondicao === 'novo') {
                // Consideramos novo: ano atual ou próximo
                result = result.filter(v => v.ano >= currentYear); 
            } else if (selectedCondicao === 'usado') {
                result = result.filter(v => v.ano < currentYear);
            }

            this.state.filteredVehicles = result;
            this.applySort(); // A ordenação acontece depois do filtro
        },

        applySort: function() {
            const sortType = this.elements.sort.value;
            const vehicles = this.state.filteredVehicles;

            switch (sortType) {
                case 'preco-menor':
                    vehicles.sort((a, b) => a.preco - b.preco);
                    break;
                case 'preco-maior':
                    vehicles.sort((a, b) => b.preco - a.preco);
                    break;
                case 'ano-novo':
                    vehicles.sort((a, b) => b.ano - a.ano);
                    break;
                // Relevância mantém a ordem original do banco ou lógica customizada
                default: 
                    // Se tivesse ID, ordenaria por ID decrescente (mais recentes cadastrados)
                    if(vehicles[0] && vehicles[0].id_veiculo) {
                         vehicles.sort((a, b) => b.id_veiculo - a.id_veiculo);
                    }
                    break;
            }

            this.render();
        },

        populateFilters: function() {
            // Extrai Marcas Únicas do Banco de Dados
            const marcas = [...new Set(this.state.allVehicles.map(v => v.nome_marca).filter(Boolean))];
            this.utils.fillSelect(this.elements.filters.marca, marcas);

            // Extrai Categorias Únicas
            const categorias = [...new Set(this.state.allVehicles.map(v => v.nome_categoria).filter(Boolean))];
            this.utils.fillSelect(this.elements.filters.categoria, categorias);
        },

        // ========================================================
        // 5. RENDERIZAÇÃO (UI)
        // ========================================================
        render: function() {
            const { grid, counter } = this.elements;
            grid.innerHTML = ''; // Limpa grid

            // Atualiza contador
            const count = this.state.filteredVehicles.length;
            counter.textContent = `${count} veículo${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;

            if (count === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <h3>Nenhum veículo encontrado</h3>
                        <p>Tente ajustar os filtros para ver mais opções.</p>
                    </div>`;
                return;
            }

            // Fragmento para performance (só insere no DOM no final)
            const fragment = document.createDocumentFragment();

            this.state.filteredVehicles.forEach(vehicle => {
                const card = document.createElement('div');
                card.className = 'veiculo-card fade-in'; // Adicione classe fade-in no CSS para animação

                // Definição inteligente da imagem
                const imgSource = vehicle.imagem || this.config.PLACEHOLDER_IMG;
                
                // Formatação de valores
                const precoFormatado = this.utils.formatCurrency(vehicle.preco);
                
                // Construção HTML segura
                card.innerHTML = `
                    <div class="card-imagem">
                        <img src="${imgSource}" 
                             alt="${vehicle.nome_marca} ${vehicle.modelo}"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='${this.config.PLACEHOLDER_IMG}';">
                        <span class="badge-ano">${vehicle.ano}</span>
                    </div>
                    <div class="card-conteudo">
                        <div class="card-header">
                            <small class="card-categoria">${vehicle.nome_categoria}</small>
                            <h3>${vehicle.nome_marca} ${vehicle.modelo}</h3>
                        </div>
                        <p class="card-preco">${precoFormatado}</p>
                        
                        <div class="card-actions">
                             <a href="#" class="card-botao">Ver Detalhes</a>
                        </div>
                    </div>
                `;
                fragment.appendChild(card);
            });

            grid.appendChild(fragment);
        },

        renderError: function(msg) {
            this.elements.grid.innerHTML = `<div class="error-msg">⚠️ ${msg}</div>`;
        },

        setLoading: function(loading) {
            this.state.isLoading = loading;
            if (loading) {
                this.elements.grid.innerHTML = '<div class="loading-spinner">Carregando estoque...</div>';
            }
        },

        // ========================================================
        // 6. UTILITÁRIOS
        // ========================================================
        utils: {
            formatCurrency: (value) => {
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(value);
            },

            fillSelect: (selectElement, values) => {
                // Mantém a opção "Todas" e limpa o resto
                selectElement.innerHTML = '<option value="todas">Todas</option>';
                values.sort().forEach(val => {
                    const option = document.createElement('option');
                    option.value = val; // Mantém o valor original
                    option.textContent = val;
                    selectElement.appendChild(option);
                });
            },
            
            // Função debounce para o slider de preço não travar
            debounce: (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }
        },

        // ========================================================
        // 7. EVENTOS
        // ========================================================
        bindEvents: function() {
            const { filters, sort } = this.elements;

            // Change Events (Selects e Radios)
            filters.marca.addEventListener('change', () => this.applyFilters());
            filters.categoria.addEventListener('change', () => this.applyFilters());
            filters.condicao.forEach(radio => 
                radio.addEventListener('change', () => this.applyFilters())
            );
            sort.addEventListener('change', () => this.applySort());

            // Input Event (Preço) - Usando Debounce para performance
            const handlePriceChange = this.utils.debounce((e) => {
                this.applyFilters();
            }, 300); // Espera 300ms após parar de mover o slider

            filters.preco.addEventListener('input', (e) => {
                filters.precoLabel.textContent = `Até ${this.utils.formatCurrency(e.target.value)}`;
                handlePriceChange(e);
            });

            // Botão Limpar
            filters.limparBtn.addEventListener('click', () => {
                filters.marca.value = 'todas';
                filters.categoria.value = 'todas';
                document.getElementById('cond-todas').checked = true;
                filters.preco.value = filters.preco.max;
                filters.precoLabel.textContent = `Até ${this.utils.formatCurrency(filters.preco.max)}`;
                sort.value = 'relevancia';
                this.applyFilters();
            });
        }
    };

    // Inicializa o App
    App.init();
});