// comprar.js

document.addEventListener('DOMContentLoaded', () => {

    // --- BANCO DE DADOS (simulado com o JSON que você forneceu) ---
    // Em um projeto real, isso viria de uma API: fetch('/api/veiculos')
    const veiculosData = [
      { "id": 1, "modelo": "JETTA GLI", "marca": "Volkswagen", "imagem": "img/jetta.webp", "categoria": "carros", "preco": 239990, "ano": 2023, "km": 0, "motor": "2.0 TSI" },
      { "id": 2, "modelo": "COROLLA ALTIS HYBRID", "marca": "Toyota", "imagem": "img/corola do novo.jpg", "categoria": "carros", "preco": 198990, "ano": 2024, "km": 0, "motor": "1.8 Hybrid" },
      { "id": 3, "modelo": "FORD EVEREST", "marca": "Ford", "imagem": "img/ford-everest.webp", "categoria": "suvs", "preco": 415500, "ano": 2023, "km": 1500, "motor": "3.0 V6 Turbodiesel" },
      { "id": 4, "modelo": "CIVIC G10 TOURING", "marca": "Honda", "imagem": "img/civic g10.jpg", "categoria": "carros", "preco": 152000, "ano": 2021, "km": 35000, "motor": "1.5 Turbo" },
      { "id": 5, "modelo": "MINI COOPER S", "marca": "MINI", "imagem": "img/mini cooper s.jpg", "categoria": "esportivos", "preco": 212990, "ano": 2022, "km": 12000, "motor": "2.0 Turbo" },
      { "id": 6, "modelo": "GWM HAVAL H6 PHEV", "marca": "GWM", "imagem": "img/haval.jpg", "categoria": "suvs", "preco": 279000, "ano": 2024, "km": 0, "motor": "1.5 Turbo Híbrido Plug-in" },
      { "id": 7, "modelo": "Lamborghini Huracan", "marca": "Lamborghini", "imagem": "img/lambo.webp", "categoria": "esportivos", "preco": 3800000, "ano": 2022, "km": 5000, "motor": "5.2 V10 Aspirado" },
      { "id": 8, "modelo": "BMW M4 COMPETITION", "marca": "BMW", "imagem": "img/bmw m4.webp", "categoria": "esportivos", "preco": 829950, "ano": 2023, "km": 4500, "motor": "3.0 Bi-Turbo" },
      { "id": 9, "modelo": "BMW X7 M60i", "marca": "BMW", "imagem": "img/bmw x7.webp", "categoria": "suvs", "preco": 1154950, "ano": 2024, "km": 0, "motor": "4.4 V8 Bi-Turbo" },
      { "id": 10, "modelo": "MERCEDES-BENZ GLE COUPE", "marca": "Mercedes-Benz", "imagem": "img/GLE COUPE.webp", "categoria": "suvs", "preco": 755000, "ano": 2022, "km": 9800, "motor": "3.0 Turbo" },
      { "id": 11, "modelo": "FORD F-150 RAPTOR", "marca": "Ford", "imagem": "img/Ford_F-150_Raptor.webp", "categoria": "picape", "preco": 519990, "ano": 2023, "km": 3000, "motor": "3.5 V6 Bi-Turbo" },
      { "id": 12, "modelo": "RAM 1500 TRX", "marca": "RAM", "imagem": "img/ram trx.png", "categoria": "picape", "preco": 989000, "ano": 2023, "km": 800, "motor": "6.2 V8 Supercharged HEMI" }
    ];

    // --- ELEMENTOS DO DOM ---
    const grid = document.getElementById('veiculos-grid');
    const contagemResultados = document.getElementById('resultados-contagem');
    const loadMoreBtn = document.getElementById('load-more-btn');

    const filtroMarca = document.getElementById('filtro-marca');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroPreco = document.getElementById('filtro-preco');
    const precoValor = document.getElementById('preco-valor');
    const filtroCondicao = document.querySelectorAll('input[name="condicao"]');
    const ordenarPor = document.getElementById('ordenar-por');
    const limparFiltrosBtn = document.getElementById('limpar-filtros-btn');

    // --- ESTADO DA APLICAÇÃO ---
    let veiculosFiltrados = [...veiculosData];
    let currentPage = 1;
    const itemsPerPage = 6;

    // --- FUNÇÕES ---

    // Função para formatar preço para o padrão brasileiro
    const formatarPreco = (preco) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
    };

    // Função principal que renderiza os veículos no grid
    const renderVeiculos = () => {
        // Limpa o grid apenas na primeira página
        if (currentPage === 1) {
            grid.innerHTML = '';
        }

        // Paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const veiculosParaRenderizar = veiculosFiltrados.slice(startIndex, endIndex);

        veiculosParaRenderizar.forEach(veiculo => {
            const card = document.createElement('div');
            card.className = 'veiculo-card';
            card.innerHTML = `
                <div class="card-imagem">
                    <img src="${veiculo.imagem}" alt="${veiculo.modelo}">
                </div>
                <div class="card-conteudo">
                    <h3>${veiculo.marca} ${veiculo.modelo}</h3>
                    <p class="card-preco">${formatarPreco(veiculo.preco)}</p>
                    <ul class="card-specs">
                        <li>Ano: ${veiculo.ano}</li>
                        <li>KM: ${veiculo.km.toLocaleString('pt-BR')} km</li>
                        <li>Motor: ${veiculo.motor}</li>
                    </ul>
                    <a href="#" class="card-botao">Ver Detalhes</a>
                </div>
            `;
            grid.appendChild(card);
        });

        // Atualiza a contagem de resultados
        contagemResultados.textContent = `${veiculosFiltrados.length} veículos encontrados`;

        // Controla a visibilidade do botão "Carregar Mais"
        if (veiculosFiltrados.length > endIndex) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    };

    // Função que aplica todos os filtros e ordenação
    const aplicarFiltrosEOrdenar = () => {
        let resultado = [...veiculosData];

        // 1. Aplicar filtro de marca
        const marca = filtroMarca.value;
        if (marca !== 'todas') {
            resultado = resultado.filter(v => v.marca === marca);
        }
        
        // 2. Aplicar filtro de categoria
        const categoria = filtroCategoria.value;
        if (categoria !== 'todas') {
            resultado = resultado.filter(v => v.categoria === categoria);
        }

        // 3. Aplicar filtro de condição (novo/usado)
        const condicao = document.querySelector('input[name="condicao"]:checked').value;
        if (condicao === 'novo') {
            resultado = resultado.filter(v => v.km === 0);
        } else if (condicao === 'usado') {
            resultado = resultado.filter(v => v.km > 0);
        }

        // 4. Aplicar filtro de preço
        const precoMax = parseFloat(filtroPreco.value);
        resultado = resultado.filter(v => v.preco <= precoMax);

        // 5. Aplicar Ordenação
        const ordem = ordenarPor.value;
        switch (ordem) {
            case 'preco-menor':
                resultado.sort((a, b) => a.preco - b.preco);
                break;
            case 'preco-maior':
                resultado.sort((a, b) => b.preco - a.preco);
                break;
            case 'ano-novo':
                resultado.sort((a, b) => b.ano - a.ano);
                break;
        }

        veiculosFiltrados = resultado;
        currentPage = 1; // Reseta a página para a primeira
        renderVeiculos();
    };

    // Função para popular os seletores de filtro (marca e categoria)
    const popularFiltros = () => {
        const marcas = [...new Set(veiculosData.map(v => v.marca))];
        marcas.sort().forEach(marca => {
            const option = document.createElement('option');
            option.value = marca;
            option.textContent = marca;
            filtroMarca.appendChild(option);
        });

        const categorias = [...new Set(veiculosData.map(v => v.categoria))];
        categorias.sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            filtroCategoria.appendChild(option);
        });
    };

    // --- EVENT LISTENERS ---
    
    // Listeners para os filtros e ordenação
    filtroMarca.addEventListener('change', aplicarFiltrosEOrdenar);
    filtroCategoria.addEventListener('change', aplicarFiltrosEOrdenar);
    ordenarPor.addEventListener('change', aplicarFiltrosEOrdenar);
    filtroCondicao.forEach(radio => radio.addEventListener('change', aplicarFiltrosEOrdenar));
    
    filtroPreco.addEventListener('input', () => {
      precoValor.textContent = `Até ${formatarPreco(filtroPreco.value)}`;
    });
    filtroPreco.addEventListener('change', aplicarFiltrosEOrdenar);
    
    // Listener para o botão "Carregar Mais"
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        renderVeiculos();
    });

    // Listener para o botão "Limpar Filtros"
    limparFiltrosBtn.addEventListener('click', () => {
        filtroMarca.value = 'todas';
        filtroCategoria.value = 'todas';
        document.getElementById('cond-todas').checked = true;
        filtroPreco.value = filtroPreco.max;
        precoValor.textContent = `Até ${formatarPreco(filtroPreco.max)}`;
        ordenarPor.value = 'relevancia';
        aplicarFiltrosEOrdenar();
    });


    // --- INICIALIZAÇÃO ---
    popularFiltros();
    aplicarFiltrosEOrdenar(); // Renderiza os veículos na primeira carga
});