// financiamento.js - UPGRADED VERSION
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const valorVeiculoSlider = document.getElementById('valor-veiculo');
    const valorEntradaSlider = document.getElementById('valor-entrada');
    const parcelasSelect = document.getElementById('parcelas');
    const perfilRadios = document.querySelectorAll('input[name="perfil"]');
    
    const valorVeiculoDisplay = document.getElementById('valor-veiculo-display');
    const valorEntradaDisplay = document.getElementById('valor-entrada-display');
    const valorParcelaDisplay = document.getElementById('valor-parcela');
    
    const valorFinanciadoDisplay = document.getElementById('valor-financiado-display');
    const jurosTotalDisplay = document.getElementById('juros-total-display');

    // --- CHART SETUP ---
    const ctx = document.getElementById('financing-chart').getContext('2d');
    let financingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Valor Financiado', 'Juros Totais'],
            datasets: [{
                label: 'Composição do Custo',
                data: [80000, 30175], // Initial data
                backgroundColor: ['#2a2d3b', '#cccccc'],
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', }
    });
    
    // --- MOCK VEHICLE DATA (in a real project, this would come from an API) ---
    const veiculosDisponiveis = [
      { id: 1, modelo: "JETTA GLI", imagem: "img/jetta.webp", preco: 239990, parcela: 4500 },
      { id: 2, modelo: "COROLLA ALTIS HYBRID", imagem: "img/corola do novo.jpg", preco: 198990, parcela: 3800 },
      { id: 4, modelo: "CIVIC G10 TOURING", imagem: "img/civic g10.jpg", preco: 152000, parcela: 2900 },
      { id: 5, modelo: "MINI COOPER S", imagem: "img/mini cooper s.jpg", preco: 212990, parcela: 4100 },
      { id: 6, modelo: "GWM HAVAL H6", imagem: "img/haval.jpg", preco: 279000, parcela: 5000 },
    ];

    // --- CORE CALCULATION FUNCTION ---
    const calcularFinanciamento = () => {
        // 1. Get current values
        const valorVeiculo = parseFloat(valorVeiculoSlider.value);
        let valorEntrada = parseFloat(valorEntradaSlider.value);
        const numParcelas = parseInt(parcelasSelect.value);
        const perfilCredito = document.querySelector('input[name="perfil"]:checked').value;

        // 2. Business Logic & Validation
        if (valorEntrada >= valorVeiculo) {
            valorEntrada = valorVeiculo * 0.9;
            valorEntradaSlider.value = valorEntrada;
        }
        
        const taxasJuros = { otimo: 0.012, bom: 0.015, regular: 0.019 };
        const taxa = taxasJuros[perfilCredito];
        
        const valorFinanciado = valorVeiculo - valorEntrada;

        // 3. Formula (Tabela Price)
        let valorParcela = 0;
        if(valorFinanciado > 0){
             valorParcela = (valorFinanciado * taxa) / (1 - Math.pow((1 + taxa), -numParcelas));
        }
       
        const custoTotal = valorParcela * numParcelas;
        const jurosTotais = custoTotal - valorFinanciado;
        
        // 4. Update UI
        const formatarDinheiro = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        valorVeiculoDisplay.textContent = formatarDinheiro(valorVeiculo);
        valorEntradaDisplay.textContent = formatarDinheiro(valorEntrada);
        valorParcelaDisplay.textContent = formatarDinheiro(valorParcela);
        valorFinanciadoDisplay.textContent = formatarDinheiro(valorFinanciado);
        jurosTotalDisplay.textContent = formatarDinheiro(jurosTotais > 0 ? jurosTotais : 0);
        
        // 5. Update Chart
        financingChart.data.datasets[0].data = [valorFinanciado, jurosTotais > 0 ? jurosTotais : 0];
        financingChart.update();
        
        // 6. Update Suggested Cars
        atualizarCarrosSugeridos(valorParcela);
    };

    const atualizarCarrosSugeridos = (parcelaCalculada) => {
        const grid = document.getElementById('veiculos-sugeridos-grid');
        // Filter cars where the mock 'parcela' is within a 20% range of the calculated payment
        const carrosFiltrados = veiculosDisponiveis.filter(v => 
            v.parcela <= (parcelaCalculada * 1.2) && v.parcela >= (parcelaCalculada * 0.8)
        );

        grid.innerHTML = ''; // Clear previous results
        
        if (carrosFiltrados.length === 0) {
            grid.innerHTML = `<p class="placeholder">Nenhum veículo encontrado nesta faixa de preço. Tente ajustar os valores.</p>`;
            return;
        }

        carrosFiltrados.forEach(v => {
            const card = document.createElement('div');
            card.className = 'veiculo-card';
            card.innerHTML = `
                <div class="card-imagem"><img src="${v.imagem}" alt="${v.modelo}"></div>
                <div class="card-conteudo">
                    <h3>${v.modelo}</h3>
                    <p class="card-preco">${v.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <a href="#" class="card-botao">Ver Detalhes</a>
                </div>
            `;
            grid.appendChild(card);
        });
    };
    
    // --- EVENT LISTENERS ---
    [valorVeiculoSlider, valorEntradaSlider, parcelasSelect].forEach(el => el.addEventListener('input', calcularFinanciamento));
    perfilRadios.forEach(radio => radio.addEventListener('change', calcularFinanciamento));
    
    // --- INITIAL CALCULATION ---
    calcularFinanciamento();
});