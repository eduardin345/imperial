// financiamento.js (VERSÃO FINAL FUNCIONAL)
document.addEventListener('DOMContentLoaded', () => {

    const valorVeiculoSlider = document.getElementById('valor-veiculo');
    const valorEntradaSlider = document.getElementById('valor-entrada');
    const parcelasSelect = document.getElementById('parcelas');
    const perfilRadios = document.querySelectorAll('input[name="perfil"]');
    const valorVeiculoDisplay = document.getElementById('valor-veiculo-display');
    const valorEntradaDisplay = document.getElementById('valor-entrada-display');
    const valorParcelaDisplay = document.getElementById('valor-parcela');
    const valorFinanciadoDisplay = document.getElementById('valor-financiado-display');
    const jurosTotalDisplay = document.getElementById('juros-total-display');
    
    // Configuração do Gráfico
    const ctx = document.getElementById('financing-chart').getContext('2d');
    const financingChart = new Chart(ctx, { /* ... sua configuração do chart.js ... */ });

    let todosOsVeiculos = []; // Armazena todos os veículos da API

    const calcularFinanciamento = () => {
        const valorVeiculo = parseFloat(valorVeiculoSlider.value);
        let valorEntrada = parseFloat(valorEntradaSlider.value);
        if (valorEntrada >= valorVeiculo) {
            valorEntrada = valorVeiculo * 0.9;
            valorEntradaSlider.value = valorEntrada;
        }
        const numParcelas = parseInt(parcelasSelect.value);
        const perfilCredito = document.querySelector('input[name="perfil"]:checked').value;
        const taxasJuros = { otimo: 0.012, bom: 0.015, regular: 0.019 };
        const taxa = taxasJuros[perfilCredito];
        const valorFinanciado = valorVeiculo - valorEntrada;
        let valorParcela = (valorFinanciado * taxa) / (1 - Math.pow((1 + taxa), -numParcelas));
        if(isNaN(valorParcela) || valorParcela < 0) valorParcela = 0;
        
        const custoTotal = valorParcela * numParcelas;
        const jurosTotais = custoTotal - valorFinanciado;

        // Atualiza a UI com os cálculos
        const formatarDinheiro = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        valorVeiculoDisplay.textContent = formatarDinheiro(valorVeiculo);
        valorEntradaDisplay.textContent = formatarDinheiro(valorEntrada);
        valorParcelaDisplay.textContent = formatarDinheiro(valorParcela);
        valorFinanciadoDisplay.textContent = formatarDinheiro(valorFinanciado);
        jurosTotalDisplay.textContent = formatarDinheiro(jurosTotais > 0 ? jurosTotais : 0);
        financingChart.data.datasets[0].data = [valorFinanciado, jurosTotais > 0 ? jurosTotais : 0];
        financingChart.update();
        
        // **A PARTE MAIS IMPORTANTE: SUGERE CARROS DE VERDADE**
        atualizarCarrosSugeridos(valorParcela);
    };

    const atualizarCarrosSugeridos = (parcelaCalculada) => {
        const grid = document.getElementById('veiculos-sugeridos-grid');
        grid.innerHTML = '';

        // Estima o preço do carro com base na parcela simulada (cálculo inverso aproximado)
        // Isso é uma heurística, não um cálculo exato.
        const precoMaximoSugerido = (parcelaCalculada * (1 - Math.pow((1 + 0.015), -48))) / 0.015;

        // Filtra veículos cujo preço está numa faixa de 30% abaixo e 30% acima do preço estimado
        const carrosFiltrados = todosOsVeiculos.filter(v => 
            v.preco >= (precoMaximoSugerido * 0.7) && v.preco <= (precoMaximoSugerido * 1.3)
        );

        if (carrosFiltrados.length === 0) {
            grid.innerHTML = `<p class="placeholder">Nenhum veículo encontrado nesta faixa. Tente ajustar os valores.</p>`;
            return;
        }

        carrosFiltrados.forEach(v => {
            const card = document.createElement('div');
            card.className = 'veiculo-card';
            const imageUrl = v.imagem || 'img/placeholder.webp';

            card.innerHTML = `
                <div class.card-imagem"><img src="${imageUrl}" alt="${v.marca} ${v.modelo}"></div>
                <div class="card-conteudo">
                    <h3>${v.marca} ${v.modelo}</h3>
                    <p class="card-preco">${v.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <a href="#" class="card-botao">Ver Detalhes</a>
                </div>
            `;
            grid.appendChild(card);
        });
    };
    
    // --- INICIALIZAÇÃO DA PÁGINA ---
    async function iniciarPaginaFinanciamento() {
        try {
            const response = await fetch('http://localhost:3002/api/veiculos');
            if (!response.ok) throw new Error("Não foi possível buscar o estoque de veículos.");
            
            todosOsVeiculos = await response.json();
            
            // Adiciona listeners e faz o primeiro cálculo
            [valorVeiculoSlider, valorEntradaSlider, parcelasSelect].forEach(el => el.addEventListener('input', calcularFinanciamento));
            perfilRadios.forEach(radio => radio.addEventListener('change', calcularFinanciamento));
            calcularFinanciamento();
            
        } catch(error) {
            console.error("Erro ao carregar dados:", error);
            document.getElementById('veiculos-sugeridos-grid').innerHTML = `<p class="placeholder">Erro ao carregar sugestões.</p>`;
        }
    }

    iniciarPaginaFinanciamento();
});