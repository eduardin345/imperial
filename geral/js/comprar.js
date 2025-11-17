// comprar.js (VERSÃO FINAL FUNCIONAL)

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('veiculos-grid');
    const contagemResultados = document.getElementById('resultados-contagem');
    const filtroMarca = document.getElementById('filtro-marca');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroPreco = document.getElementById('filtro-preco');
    const precoValor = document.getElementById('preco-valor');
    const ordenarPor = document.getElementById('ordenar-por');
    const limparFiltrosBtn = document.getElementById('limpar-filtros-btn');
    const filtroCondicao = document.querySelectorAll('input[name="condicao"]');

    let veiculosData = []; // Armazena todos os veículos da API
    let veiculosFiltrados = [];

    const formatarPreco = (preco) => {
        if (!preco) return "Preço a consultar";
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
    };

    const renderVeiculos = () => {
        grid.innerHTML = '';
        if (veiculosFiltrados.length === 0) {
            grid.innerHTML = '<p class="nenhum-veiculo">Nenhum veículo encontrado.</p>';
        } else {
            veiculosFiltrados.forEach(veiculo => {
                const card = document.createElement('div');
                card.className = 'veiculo-card';
                // A API agora manda 'imagem' como o nome do campo
                const imageUrl = veiculo.imagem || 'img/placeholder.webp';

                card.innerHTML = `
                    <div class="card-imagem">
                        <img src="${imageUrl}" alt="${veiculo.marca} ${veiculo.modelo}" onerror="this.src='img/placeholder.webp';">
                    </div>
                    <div class="card-conteudo">
                        <h3>${veiculo.marca} ${veiculo.modelo}</h3>
                        <p class="card-preco">${formatarPreco(veiculo.preco)}</p>
                        <ul class="card-specs">
                            <li>Ano: ${veiculo.ano}</li>
                        </ul>
                        <a href="#" class="card-botao">Ver Detalhes</a>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
        contagemResultados.textContent = `${veiculosFiltrados.length} veículos encontrados`;
    };

    const aplicarFiltrosEOrdenar = () => {
        let resultado = [...veiculosData];

        const marca = filtroMarca.value;
        if (marca !== 'todas') resultado = resultado.filter(v => v.marca === marca);

        const categoria = filtroCategoria.value;
        if (categoria !== 'todas') resultado = resultado.filter(v => v.categoria === categoria);

        const precoMax = parseFloat(filtroPreco.value);
        resultado = resultado.filter(v => v.preco <= precoMax);

        // A sua tabela 'vehicles' não tem a coluna KM.
        // A lógica de 'novo' vs 'usado' foi adaptada para o ANO.
        const condicao = document.querySelector('input[name="condicao"]:checked').value;
        const anoAtual = new Date().getFullYear();
        if (condicao === 'novo') resultado = resultado.filter(v => v.ano >= anoAtual);
        if (condicao === 'usado') resultado = resultado.filter(v => v.ano < anoAtual);

        const ordem = ordenarPor.value;
        switch (ordem) {
            case 'preco-menor': resultado.sort((a, b) => a.preco - b.preco); break;
            case 'preco-maior': resultado.sort((a, b) => b.preco - a.preco); break;
            case 'ano-novo': resultado.sort((a, b) => b.ano - a.ano); break;
        }
        veiculosFiltrados = resultado;
        renderVeiculos();
    };
    
   // VERSÃO CORRIGIDA
const popularFiltros = () => {
    // Mapeia e remove marcas nulas/vazias, depois cria um conjunto de valores únicos.
    const marcas = [...new Set(veiculosData.map(v => v.marca).filter(Boolean))];
    marcas.sort().forEach(marca => {
        if (marca) filtroMarca.add(new Option(marca, marca));
    });

    // Mapeia e remove categorias nulas/vazias.
    const categorias = [...new Set(veiculosData.map(v => v.categoria).filter(Boolean))];
    categorias.sort().forEach(cat => {
        // Se 'cat' não for nulo ou vazio, cria a opção
        if (cat) {
            const nomeExibicao = cat.charAt(0).toUpperCase() + cat.slice(1);
            filtroCategoria.add(new Option(nomeExibicao, cat));
        }
    });
};

    async function iniciarPagina() {
        try {
            const response = await fetch('http://localhost:3001/api/veiculos');
            if (!response.ok) throw new Error(`Falha na API`);
            
            veiculosData = await response.json();
            
            popularFiltros();
            aplicarFiltrosEOrdenar();

            // Adiciona os Event Listeners DEPOIS de tudo carregado
            [filtroMarca, filtroCategoria, ordenarPor].forEach(el => el.addEventListener('change', aplicarFiltrosEOrdenar));
            filtroCondicao.forEach(el => el.addEventListener('change', aplicarFiltrosEOrdenar));
            filtroPreco.addEventListener('input', () => { 
                precoValor.textContent = `Até ${formatarPreco(filtroPreco.value)}`; 
            });
            filtroPreco.addEventListener('change', aplicarFiltrosEOrdenar);
            limparFiltrosBtn.addEventListener('click', () => {
                filtroMarca.value = 'todas';
                filtroCategoria.value = 'todas';
                document.getElementById('cond-todas').checked = true;
                filtroPreco.value = filtroPreco.max;
                precoValor.textContent = `Até ${formatarPreco(filtroPreco.max)}`;
                ordenarPor.value = 'relevancia';
                aplicarFiltrosEOrdenar();
            });

        } catch (error) {
            console.error("Falha ao carregar a página:", error);
            grid.innerHTML = `<p class="erro-api">Não foi possível carregar os veículos.</p>`;
        }
    }

    iniciarPagina();
});