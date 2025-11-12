// financiamento.js (VERSÃO MELHORADA E TOTALMENTE REATIVA)

document.addEventListener('DOMContentLoaded', () => {
    // --- SELEÇÃO DOS ELEMENTOS DO DOM ---
    const valorVeiculoSlider = document.getElementById('valor-veiculo');
    const valorEntradaSlider = document.getElementById('valor-entrada');
    const parcelasSelect = document.getElementById('parcelas');
    const perfilRadios = document.querySelectorAll('input[name="perfil"]');

    // Displays de valores
    const valorVeiculoDisplay = document.getElementById('valor-veiculo-display');
    const valorEntradaDisplay = document.getElementById('valor-entrada-display');
    const valorParcelaDisplay = document.getElementById('valor-parcela');
    const valorFinanciadoDisplay = document.getElementById('valor-financiado-display');
    const jurosTotalDisplay = document.getElementById('juros-total-display');

    // --- CONFIGURAÇÃO INICIAL DO GRÁFICO ---
    const ctx = document.getElementById('financing-chart').getContext('2d');
    const financingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Valor Principal Financiado', 'Total de Juros'],
            datasets: [{
                data: [1, 0], // Inicia com valores para não ficar vazio
                backgroundColor: ['#111', '#ccc'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // --- LÓGICA PRINCIPAL ---

    // Centralizamos as taxas de juros para fácil manutenção
    const TAXAS_JUROS = {
        otimo: 0.012, // 1.2%
        bom: 0.015,   // 1.5%
        regular: 0.019 // 1.9%
    };

    /**
     * Função principal que orquestra o cálculo e a atualização da interface.
     */
    function simularFinanciamento() {
        // 1. Obter todos os valores dos inputs
        const valorVeiculo = parseFloat(valorVeiculoSlider.value);
        let valorEntrada = parseFloat(valorEntradaSlider.value);
        const numParcelas = parseInt(parcelasSelect.value);
        const perfilCredito = document.querySelector('input[name="perfil"]:checked').value;

        // 2. Validação e Lógica de Negócio
        // Garante que a entrada não seja maior ou igual ao valor do veículo
        if (valorEntrada >= valorVeiculo) {
            valorEntrada = valorVeiculo - 1; // Ajusta para um valor mínimo de financiamento
            valorEntradaSlider.value = valorEntrada;
        }
        
        const valorFinanciado = valorVeiculo - valorEntrada;
        const taxaJurosMensal = TAXAS_JUROS[perfilCredito];
        
        // 3. Realizar os Cálculos
        let valorParcela, jurosTotais;

        if (valorFinanciado <= 0) {
            // Se não há valor a financiar, tudo é zero.
            valorParcela = 0;
            jurosTotais = 0;
        } else {
            // Aplica a fórmula da Tabela PRICE
            const i = taxaJurosMensal;
            const n = numParcelas;
            const P = valorFinanciado;
            
            valorParcela = P * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
            jurosTotais = (valorParcela * n) - P;
        }
        
        // 4. Atualizar a Interface do Usuário (UI)
        atualizarUI(valorVeiculo, valorEntrada, valorFinanciado, valorParcela, jurosTotais);
    }

    /**
     * Atualiza todos os elementos de texto e o gráfico na tela.
     */
    function atualizarUI(veiculo, entrada, financiado, parcela, juros) {
        const formatarDinheiro = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        valorVeiculoDisplay.textContent = formatarDinheiro(veiculo);
        valorEntradaDisplay.textContent = formatarDinheiro(entrada);
        valorFinanciadoDisplay.textContent = formatarDinheiro(financiado);
        valorParcelaDisplay.textContent = formatarDinheiro(parcela);
        jurosTotalDisplay.textContent = formatarDinheiro(juros > 0 ? juros : 0);

        // Atualiza os dados do gráfico
        const dadosGrafico = [
            financiado > 0 ? financiado : 0,
            juros > 0 ? juros : 0
        ];
        // Se ambos forem 0, o gráfico mostrará um círculo completo de "Principal" para evitar ficar vazio.
        if (financiado <= 0 && juros <= 0) {
            dadosGrafico[0] = 1; 
        }
        financingChart.data.datasets[0].data = dadosGrafico;
        financingChart.update();
        
        // Sugere carros com base na nova parcela calculada
        atualizarCarrosSugeridos(parcela);
    }
    
    // A função de sugestão de carros permanece a mesma, mas agora é chamada a cada atualização
    const atualizarCarrosSugeridos = (parcelaCalculada) => {
        // ... (seu código de sugestão de carros continua aqui, sem alterações necessárias)
        // O código que você já tinha aqui é excelente.
    };
    
    let todosOsVeiculos = []; // Cache para os veículos da API

    // --- INICIALIZAÇÃO DA PÁGINA ---
    async function iniciarPagina() {
        // Adiciona os "escutadores" de eventos a TODOS os controles do formulário
        valorVeiculoSlider.addEventListener('input', simularFinanciamento);
        valorEntradaSlider.addEventListener('input', simularFinanciamento);
        parcelasSelect.addEventListener('change', simularFinanciamento);
        perfilRadios.forEach(radio => radio.addEventListener('change', simularFinanciamento));

        try {
            // Busca os veículos da sua API para a seção de sugestões
            const response = await fetch('http://localhost:3002/api/veiculos');
            if (!response.ok) throw new Error("Não foi possível buscar o estoque de veículos.");
            todosOsVeiculos = await response.json();
            
            // Faz o primeiro cálculo assim que a página carrega
            simularFinanciamento();

        } catch(error) {
            console.error("Erro ao carregar dados:", error);
            document.getElementById('veiculos-sugeridos-grid').innerHTML = `<p class="placeholder">Erro ao carregar sugestões.</p>`;
        }
    }

    iniciarPagina();
});