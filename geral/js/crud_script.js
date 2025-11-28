document.addEventListener('DOMContentLoaded', () => {
    
    // --- GUARDA DE SEGURANÇA ---
    // Verifica se existe um token de autenticação no armazenamento local do navegador.
    // Se não houver, redireciona imediatamente para a página de login, protegendo o CRUD.
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return; // Impede que o resto do script seja executado para usuários não autenticados.
    }
    
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
    const marcaInput = document.getElementById('marca');
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
    
    // --- SELETORES DA TABELA E FILTROS DE BUSCA ---
    const corpoTabelaVeiculos = document.getElementById('corpo-tabela-veiculos');
    const searchFiltersContainer = document.getElementById('search-filters');
    const searchIdInput = document.getElementById('search-id');
    const searchModeloInput = document.getElementById('search-modelo');
    const searchMarcaInput = document.getElementById('search-marca');
    const searchAnoInput = document.getElementById('search-ano');
    const searchDisponivelSelect = document.getElementById('search-disponivel');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    // --- ESTADO DA APLICAÇÃO ---
    let allVeiculos = []; // Cache local de todos os veículos para a busca funcionar
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

    // Função central para todas as chamadas à API.
    // Ela adiciona automaticamente o token de autenticação em todas as requisições.
    async function apiFetch(url, options = {}) {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };

        try {
            const response = await fetch(url, { ...options, headers });
            
            // Se o token for inválido ou expirado, o backend retornará 401 ou 403.
            // Neste caso, limpamos o token local e expulsamos o usuário para a tela de login.
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
                throw new Error('Sessão expirada ou inválida. Faça login novamente.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            // Para respostas DELETE que não têm corpo (status 204)
            if (response.status === 204) return { success: true };

            return await response.json();
        } catch (error) {
            console.error('Falha na API:', error);
            throw error; // Re-lança o erro para ser tratado pela função que chamou
        }
    }

    // --- CARREGAMENTO DE DADOS INICIAIS ---
    async function carregarCategorias() {
        try {
            const categorias = await apiFetch(ENDPOINTS.CATEGORIAS);
            categoriaSelect.innerHTML = '<option value="">Selecione uma categoria...</option>';
            categorias.forEach(cat => {
                categoriaSelect.add(new Option(cat.nome_categoria, cat.id_categoria));
            });
        } catch (error) {
            categoriaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }
    
    async function carregarVeiculos() {
         corpoTabelaVeiculos.innerHTML = `<tr><td colspan="8">Carregando...</td></tr>`;
         try {
            allVeiculos = await apiFetch(ENDPOINTS.VEICULOS);
            renderizarTabela(allVeiculos);
         } catch(error) {
             showNotification(error.message, 'error');
             corpoTabelaVeiculos.innerHTML = `<tr><td colspan="8" class="error">Erro ao carregar veículos.</td></tr>`;
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

    // --- LÓGICA DO FORMULÁRIO (CRIAR E ATUALIZAR) ---
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
            await apiFetch(url, { method, body: JSON.stringify(dadosVeiculo) });
            showNotification(`Veículo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            resetarFormulario();
            await carregarVeiculos(); // Recarrega a lista de veículos após a operação
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

    clearButton.addEventListener('click', (e) => { e.preventDefault(); resetarFormulario(); });
    
    // --- LÓGICA DA TABELA (EDITAR E DELETAR) ---
    corpoTabelaVeiculos.addEventListener('click', async (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            try {
                const veiculo = await apiFetch(`${ENDPOINTS.VEICULOS}/${id}`);
                popularFormularioParaEdicao(veiculo);
            } catch (error) {
                showNotification(`Erro ao carregar veículo: ${error.message}`, 'error');
            }
        }
        
        if (target.classList.contains('delete-btn')) {
            const modelo = target.dataset.modelo;
            if (confirm(`Tem certeza que deseja deletar o veículo "${modelo}"?`)) {
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

    // --- LÓGICA DA BUSCA AVANÇADA ---
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
            if (disponivelTerm === "sim") disponivelMatch = v.disponivel === true;
            else if (disponivelTerm === "nao") disponivelMatch = v.disponivel === false;

            return idMatch && modeloMatch && marcaMatch && anoMatch && disponivelMatch;
        });
        renderizarTabela(veiculosFiltrados);
    }
    
    if (searchFiltersContainer) searchFiltersContainer.addEventListener('input', filtrarVeiculos);

    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
        searchFiltersContainer.querySelectorAll('input, select').forEach(el => el.value = '');
        filtrarVeiculos();
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    async function init() {
        await carregarCategorias();
        await carregarVeiculos();
        resetarFormulario();
    }

    init();
});