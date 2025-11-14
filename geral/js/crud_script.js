// js/crud_script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO E CONSTANTES ---
    const API_BASE_URL = 'http://localhost:3002/api';
    const ENDPOINTS = {
        VEICULOS: `${API_BASE_URL}/veiculos`,
        CATEGORIAS: `${API_BASE_URL}/categorias`,
    };

    // --- SELETORES DO FORMULÁRIO ---
    const formVeiculo = document.getElementById('form-veiculo');
    const formTitle = document.getElementById('form-title');
    const veiculoIdInput = document.getElementById('veiculo-id');
    const modeloInput = document.getElementById('modelo');
    const marcaInput = document.getElementById('marca'); // Alterado para input de texto
    const categoriaSelect = document.getElementById('categoria');
    const anoInput = document.getElementById('ano');
    const corInput = document.getElementById('cor');
    const precoInput = document.getElementById('preco');
    const kmInput = document.getElementById('km');
    const motorInput = document.getElementById('motor');
    const descricaoTextarea = document.getElementById('descricao');
    const disponivelCheckbox = document.getElementById('disponivel');
    const submitButton = document.getElementById('submit-button');
    const clearButton = document.getElementById('clear-button');
    
    // --- SELETORES DA TABELA E BUSCA ---
    const corpoTabelaVeiculos = document.getElementById('corpo-tabela-veiculos');
    const searchFiltersContainer = document.getElementById('search-filters');
    const searchIdInput = document.getElementById('search-id');
    const searchModeloInput = document.getElementById('search-modelo');
    const searchMarcaInput = document.getElementById('search-marca');
    const searchAnoInput = document.getElementById('search-ano');
    const searchDisponivelSelect = document.getElementById('search-disponivel');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    // --- ESTADO DA APLICAÇÃO ---
    let allVeiculos = []; // Cache local para a busca e filtros
    let isEditing = false;

    // --- FUNÇÕES AUXILIARES ---
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    }

    async function apiFetch(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Erro HTTP: ${response.status}`;
                throw new Error(errorMessage);
            }
            if (response.status === 204) return { success: true };
            return await response.json();
        } catch (error) {
            console.error('Falha na API:', error);
            throw new Error(error.message || 'Não foi possível conectar ao servidor.');
        }
    }

    // --- FUNÇÕES DE CARREGAMENTO INICIAL ---
    async function carregarCategorias() {
        try {
            const categorias = await apiFetch(ENDPOINTS.CATEGORIAS);
            categoriaSelect.innerHTML = '<option value="">Selecione uma categoria...</option>';
            categorias.forEach(cat => {
                categoriaSelect.add(new Option(cat.nome_categoria, cat.id_categoria));
            });
        } catch (error) {
            categoriaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
            console.error('Falha ao carregar categorias:', error);
        }
    }
    
    async function carregarVeiculos() {
         corpoTabelaVeiculos.innerHTML = `<tr><td colspan="8">Carregando...</td></tr>`;
         try {
            allVeiculos = await apiFetch(ENDPOINTS.VEICULOS);
            renderizarTabela(allVeiculos);
         } catch(error) {
             showNotification('Falha ao carregar veículos. Verifique o console (F12).', 'error');
             corpoTabelaVeiculos.innerHTML = `<tr><td colspan="8" class="error">Erro ao carregar veículos. A API está online?</td></tr>`;
         }
    }

    function renderizarTabela(veiculos) {
        corpoTabelaVeiculos.innerHTML = '';
        if (!veiculos || veiculos.length === 0) {
            corpoTabelaVeiculos.innerHTML = '<tr><td colspan="8">Nenhum veículo encontrado.</td></tr>';
            return;
        }
        veiculos.forEach(veiculo => {
            const tr = corpoTabelaVeiculos.insertRow();
            tr.innerHTML = `
                <td>${veiculo.id_veiculo}</td>
                <td>${veiculo.modelo}</td>
                <td>${veiculo.nome_marca || 'N/A'}</td>
                <td>${veiculo.nome_categoria || 'N/A'}</td>
                <td>${veiculo.ano || 'N/A'}</td>
                <td>${(veiculo.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td><span class="status ${veiculo.disponivel ? 'disponivel' : 'indisponivel'}">${veiculo.disponivel ? 'Sim' : 'Não'}</span></td>
                <td>
                    <button class="edit-btn" data-id="${veiculo.id_veiculo}" title="Editar">✏️</button>
                    <button class="delete-btn" data-id="${veiculo.id_veiculo}" data-modelo="${veiculo.modelo}" title="Deletar">🗑️</button>
                </td>
            `;
        });
    }

    // --- LÓGICA DO FORMULÁRIO (CRIAR/ATUALIZAR) ---
    formVeiculo.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const dadosVeiculo = {
            modelo: modeloInput.value.trim(),
            marca: marcaInput.value.trim(),
            id_categoria_fk: parseInt(categoriaSelect.value),
            ano: anoInput.value ? parseInt(anoInput.value) : null,
            cor: corInput.value.trim(),
            preco: precoInput.value ? parseFloat(precoInput.value) : null,
            km: kmInput.value ? parseInt(kmInput.value) : 0,
            motor: motorInput.value.trim(),
            descricao: descricaoTextarea.value.trim(),
            disponivel: disponivelCheckbox.checked
        };
        
        const id = veiculoIdInput.value;
        const url = isEditing ? `${ENDPOINTS.VEICULOS}/${id}` : ENDPOINTS.VEICULOS;
        const method = isEditing ? 'PUT' : 'POST';
        
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosVeiculo)
            });
            showNotification(`Veículo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            resetarFormulario();
            await carregarVeiculos();
        } catch (error) {
            showNotification(`Falha: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = isEditing ? 'Atualizar Veículo' : 'Salvar Veículo';
        }
    });

    function resetarFormulario() {
        formVeiculo.reset();
        veiculoIdInput.value = '';
        formTitle.textContent = 'Adicionar Novo Veículo';
        submitButton.textContent = 'Salvar Veículo';
        isEditing = false;
        disponivelCheckbox.checked = true;
        modeloInput.focus();
    }

    clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        resetarFormulario();
    });
    
    // --- LÓGICA DE EDIÇÃO E DELEÇÃO NA TABELA ---
    corpoTabelaVeiculos.addEventListener('click', async (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;

        if (target.classList.contains('edit-btn') && id) {
            try {
                const veiculo = await apiFetch(`${ENDPOINTS.VEICULOS}/${id}`);
                popularFormularioParaEdicao(veiculo);
            } catch (error) {
                showNotification(`Não foi possível carregar o veículo: ${error.message}`, 'error');
            }
        }
        
        if (target.classList.contains('delete-btn') && id) {
            const modelo = target.dataset.modelo;
            if (confirm(`Tem certeza que deseja deletar o veículo "${modelo}" (ID: ${id})?`)) {
                deletarVeiculo(id, modelo);
            }
        }
    });
    
    function popularFormularioParaEdicao(veiculo) {
        formTitle.textContent = `Editando Veículo: ${veiculo.modelo}`;
        submitButton.textContent = 'Atualizar Veículo';
        isEditing = true;

        veiculoIdInput.value = veiculo.id_veiculo;
        modeloInput.value = veiculo.modelo;
        marcaInput.value = veiculo.nome_marca;
        categoriaSelect.value = veiculo.id_categoria_fk;
        anoInput.value = veiculo.ano;
        corInput.value = veiculo.cor;
        precoInput.value = veiculo.preco;
        kmInput.value = veiculo.km;
        motorInput.value = veiculo.motor;
        descricaoTextarea.value = veiculo.descricao;
        disponivelCheckbox.checked = veiculo.disponivel;

        window.scrollTo({ top: formVeiculo.offsetTop - 20, behavior: 'smooth' });
        modeloInput.focus();
    }

    async function deletarVeiculo(id, modelo) {
        try {
            await apiFetch(`${ENDPOINTS.VEICULOS}/${id}`, { method: 'DELETE' });
            showNotification(`Veículo "${modelo}" deletado com sucesso!`);
            await carregarVeiculos();
            resetarFormulario();
        } catch (error) {
            showNotification(`Falha ao deletar: ${error.message}`, 'error');
        }
    }

    // --- LÓGICA DE BUSCA AVANÇADA ---
    function filtrarVeiculos() {
        const idTerm = searchIdInput.value.trim();
        const modeloTerm = searchModeloInput.value.trim().toLowerCase();
        const marcaTerm = searchMarcaInput.value.trim().toLowerCase();
        const anoTerm = searchAnoInput.value.trim();
        const disponivelTerm = searchDisponivelSelect.value;

        const veiculosFiltrados = allVeiculos.filter(v => {
            const idMatch = !idTerm || v.id_veiculo.toString() === idTerm;
            const modeloMatch = !modeloTerm || v.modelo.toLowerCase().includes(modeloTerm);
            const marcaMatch = !marcaTerm || (v.nome_marca && v.nome_marca.toLowerCase().includes(marcaTerm));
            const anoMatch = !anoTerm || (v.ano && v.ano.toString().includes(anoTerm));
            
            let disponivelMatch = true;
            if (disponivelTerm === "sim") {
                disponivelMatch = v.disponivel === true;
            } else if (disponivelTerm === "nao") {
                disponivelMatch = v.disponivel === false;
            }

            return idMatch && modeloMatch && marcaMatch && anoMatch && disponivelMatch;
        });

        renderizarTabela(veiculosFiltrados);
    }
    
    // Adiciona um único listener para reagir a qualquer alteração nos filtros
    if (searchFiltersContainer) {
        searchFiltersContainer.addEventListener('input', filtrarVeiculos);
    }

    // Listener para o botão de limpar filtros
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            searchIdInput.value = '';
            searchModeloInput.value = '';
            searchMarcaInput.value = '';
            searchAnoInput.value = '';
            searchDisponivelSelect.value = '';
            filtrarVeiculos(); // Re-renderiza a tabela com a lista completa
        });
    }


    // --- INICIALIZAÇÃO DA PÁGINA ---
    async function init() {
        await carregarCategorias();
        await carregarVeiculos();
        resetarFormulario();
    }

    init();
});