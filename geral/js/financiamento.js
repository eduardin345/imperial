// js/financiamento.js (VERSÃO FINAL E CORRIGIDA)

document.addEventListener('DOMContentLoaded', () => {
    // --- SELEÇÃO DOS ELEMENTOS DO DOM ---
    
    const valorVeiculoSlider = document.getElementById('valor-veiculo');
    const valorEntradaSlider = document.getElementById('valor-entrada');
    const parcelasSelect = document.getElementById('parcelas');
    const perfilRadios = document.querySelectorAll('input[name="perfil"]');
    const valorVeiculoDisplay = document.getElementById('valor-veiculo-display');
    const valorEntradaDisplay = document.getElementById('valor-entrada-display');
    const valorParcelaDisplay = document.getElementById('valor-parcela');
    const valorFinanciadoDisplay = document.getElementById('valor-financiado-display');
    const jurosTotalDisplay = document.getElementById('juros-total-display');
    const gridSugestoes = document.getElementById('veiculos-sugeridos-grid');

    // --- CONFIGURAÇÃO DO GRÁFICO (Chart.js) ---
    const ctx = document.getElementById('financing-chart').getContext('2d');
    const financingChart = new Chart(ctx, {
        type: 'doughnut', data: { labels: ['Valor Principal', 'Total de Juros'], datasets: [{ data: [1, 0], backgroundColor: ['#111', '#ccc'], borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });

    // --- ESTADO E FUNÇÕES AUXILIARES ---
  const TAXAS_JUROS = { otimo: 0.012, bom: 0.015, regular: 0.019 };
    let todosOsVeiculos = []; // Array para guardar os carros da API

    // Função que converte qualquer número para o formato de moeda brasileira (R$)
    const formatarDinheiro = (valor) => {
        if (typeof valor !== 'number' || isNaN(valor)) {
            valor = 0;
        }
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // ==========================================================
    // NOVA LÓGICA PARA ATUALIZAR SUGESTÕES - INÍCIO
    // ==========================================================
    const atualizarCarrosSugeridos = (parcelaOrcamento, valorEntrada) => {
        gridSugestoes.innerHTML = ''; 

        const numParcelas = parseInt(parcelasSelect.value);
        const taxaJuros = TAXAS_JUROS[document.querySelector('input[name="perfil"]:checked').value];

        // 1. CALCULA O MÁXIMO FINANCIÁVEL com base na parcela simulada (fórmula de Valor Presente)
        const i = taxaJuros;
        const n = numParcelas;
        const maximoFinanciavel = parcelaOrcamento > 0 ? (parcelaOrcamento * (Math.pow(1 + i, n) - 1)) / (i * Math.pow(1 + i, n)) : 0;
        
        // 2. CALCULA O PREÇO MÁXIMO do carro que o usuário pode pagar
        const precoTotalMaximo = maximoFinanciavel + valorEntrada;

        // 3. FILTRA os carros do estoque que são mais baratos ou iguais ao preço máximo
        const carrosFiltrados = todosOsVeiculos.filter(veiculo => veiculo.preco <= precoTotalMaximo);
        
        // 4. ORDENA para mostrar os mais caros (e mais próximos do orçamento) primeiro
        carrosFiltrados.sort((a, b) => b.preco - a.preco);

        // Limita a exibição aos 3 carros mais relevantes
        const carrosParaExibir = carrosFiltrados.slice(0, 3);

        if (carrosParaExibir.length === 0) {
            gridSugestoes.innerHTML = `<p class="placeholder">Nenhum veículo no estoque se encaixa nesse orçamento. Tente aumentar o valor de entrada ou a simulação.</p>`;
            return;
        }

        // 5. RENDERIZA os cards com a mesma estrutura da página "Comprar"
        carrosParaExibir.forEach(v => {
            const card = document.createElement('div');
            card.className = 'veiculo-card'; // Classe principal para o estilo

            const nomeCompleto = `${v.nome_marca} ${v.modelo}`;
            const imageUrl = v.imagem_url || 'img/placeholder.webp';

            // HTML IDÊNTICO AO DA PÁGINA 'comprar.js' PARA GARANTIR O MESMO VISUAL
            card.innerHTML = `
                <div class="card-imagem">
                    <img src="${imageUrl}" alt="${nomeCompleto}" onerror="this.src='img/placeholder.webp';">
                </div>
                <div class="card-conteudo">
                    <h3>${nomeCompleto}</h3>
                    <p class="card-preco">${formatarDinheiro(v.preco)}</p>
                    <ul class="card-specs">
                        <li>Ano: ${v.ano}</li>
                    </ul>
                    <a href="#" class="card-botao">Ver Detalhes</a>
                </div>
            `;
            gridSugestoes.appendChild(card);
        });
    };
    // ==========================================================
    // NOVA LÓGICA PARA ATUALIZAR SUGESTÕES - FIM
    // ==========================================================

// SUBSTITUA SUA FUNÇÃO ANTIGA POR ESTA VERSÃO COMPLETA

function simularFinanciamento() {
    // 1. LER OS VALORES DOS INPUTS E CONVERTER PARA NÚMEROS
    const valorVeiculo = parseFloat(valorVeiculoSlider.value);
    let valorEntrada = parseFloat(valorEntradaSlider.value);
    const numParcelas = parseInt(parcelasSelect.value);
    const perfil = document.querySelector('input[name="perfil"]:checked').value;
    const taxaJuros = TAXAS_JUROS[perfil];

    // 2. VALIDAR E AJUSTAR VALORES
    // Garante que a entrada não seja maior ou igual ao valor do veículo
    if (valorEntrada >= valorVeiculo) {
        valorEntrada = valorVeiculo - 1; // Deixa um valor mínimo para financiar
        valorEntradaSlider.value = valorEntrada; // Atualiza o slider visualmente
    }
    
    const valorFinanciado = valorVeiculo - valorEntrada;
    
    // 3. FAZER OS CÁLCULOS
    const i = taxaJuros, n = numParcelas, P = valorFinanciado;
    
    // Se o valor a financiar for positivo, calcula a parcela. Senão, é zero.
    const valorParcela = P > 0 ? P * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) : 0;
    const jurosTotais = (valorParcela * numParcelas) - P;

    // 4. ATUALIZAR A INTERFACE COM OS VALORES FORMATADOS
    // (Note que só chamamos formatarDinheiro aqui, no final)
    valorVeiculoDisplay.textContent = formatarDinheiro(valorVeiculo);
    valorEntradaDisplay.textContent = formatarDinheiro(valorEntrada);
    valorFinanciadoDisplay.textContent = formatarDinheiro(valorFinanciado);
    valorParcelaDisplay.textContent = formatarDinheiro(valorParcela);
    jurosTotalDisplay.textContent = formatarDinheiro(jurosTotais > 0 ? jurosTotais : 0);
    
    // Atualiza o gráfico
    financingChart.data.datasets[0].data = [P > 0 ? P : 1, jurosTotais > 0 ? jurosTotais : 0];
    financingChart.update();
    
    // Chama a função de sugestão de carros
    atualizarCarrosSugeridos(valorParcela, valorEntrada);
}
    
    async function iniciarPagina() {
        // Adiciona os "escutadores" de eventos
        [valorVeiculoSlider, valorEntradaSlider, parcelasSelect, ...perfilRadios].forEach(el => {
            el.addEventListener(el.type === 'radio' ? 'change' : 'input', simularFinanciamento);
        });

        try {
            // **URL da API corrigida para a porta 3002**
            const response = await fetch('http://localhost:3002/api/veiculos'); 
            if (!response.ok) throw new Error("Não foi possível carregar o estoque.");
            
            todosOsVeiculos = await response.json();
            
            simularFinanciamento(); // Realiza a primeira simulação
        } catch(error) {
            console.error("Erro ao carregar dados:", error);
            gridSugestoes.innerHTML = `<p class="placeholder">Erro ao carregar sugestões.</p>`;
        }
    }

    iniciarPagina();
});