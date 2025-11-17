// js/crud_script.js (VERSÃO FINAL COM UPLOAD DE IMAGEM)

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
    
    // NOVO: Seletores de Imagem
    const imagemInput = document.getElementById('imagem');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewText = document.getElementById('image-preview-text');

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
    let allVeiculos = [];
    let isEditing = false;
    let currentImageUrl = null; // Guarda a URL da imagem atual na edição

    // --- FUNÇÕES AUXILIARES ---
    function showNotification(message, type = 'success') {
        alert(`${type === 'success' ? '✅' : '❌'} ${message}`);
    }

    // --- CARREGAMENTO INICIAL ---
    async function carregarCategorias() {
        // ... (código sem alteração)
    }

    async function carregarVeiculos() {
        // ... (código sem alteração)
    }

    function renderizarTabela(veiculos) {
        // ... (código sem alteração)
    }

    // --- LÓGICA DO FORMULÁRIO ---
    imagemInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            imagePreviewText.style.display = 'none';
            imagePreview.style.display = 'block';
            reader.onload = (event) => {
                imagePreview.setAttribute('src', event.target.result);
            }
            reader.readAsDataURL(file);
        }
    });

    formVeiculo.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData();
        formData.append('modelo', modeloInput.value.trim());
        formData.append('marca', marcaInput.value.trim());
        formData.append('id_categoria_fk', categoriaSelect.value);
        formData.append('ano', anoInput.value);
        formData.append('cor', corInput.value.trim());
        formData.append('preco', precoInput.value);
        formData.append('km', kmInput.value);
        formData.append('motor', motorInput.value.trim());
        formData.append('descricao', descricaoTextarea.value.trim());
        formData.append('disponivel', disponivelCheckbox.checked);

        if (imagemInput.files[0]) {
            formData.append('imagem', imagemInput.files[0]);
        } else if (isEditing && currentImageUrl) {
            formData.append('imagem_url_existente', currentImageUrl);
        }

        const id = veiculoIdInput.value;
        const url = isEditing ? `${ENDPOINTS.VEICULOS}/${id}` : ENDPOINTS.VEICULOS;
        const method = isEditing ? 'PUT' : 'POST';
        
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            const response = await fetch(url, { method, body: formData });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha na operação.');
            }

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
        
        imagePreview.setAttribute('src', '');
        imagePreview.style.display = 'none';
        imagePreviewText.style.display = 'block';
        currentImageUrl = null;

        modeloInput.focus();
    }

    clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        resetarFormulario();
    });
    
    // --- LÓGICA DE EDIÇÃO E DELEÇÃO ---
    corpoTabelaVeiculos.addEventListener('click', async (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-btn') && id) {
            const veiculo = allVeiculos.find(v => v.id_veiculo == id);
            if(veiculo) popularFormularioParaEdicao(veiculo);
        }
        
        if (target.classList.contains('delete-btn') && id) {
            const modelo = target.dataset.modelo;
            if (confirm(`Tem certeza que deseja deletar "${modelo}" (ID: ${id})?`)) {
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

        if (veiculo.imagem_url) {
            imagePreview.setAttribute('src', veiculo.imagem_url);
            imagePreview.style.display = 'block';
            imagePreviewText.style.display = 'none';
            currentImageUrl = veiculo.imagem_url;
        } else {
            resetarFormulario(); // reusa a lógica de limpar o preview
        }

        window.scrollTo({ top: formVeiculo.offsetTop - 20, behavior: 'smooth' });
        modeloInput.focus();
    }

    async function deletarVeiculo(id, modelo) {
        try {
            await fetch(`${ENDPOINTS.VEICULOS}/${id}`, { method: 'DELETE' });
            showNotification(`Veículo "${modelo}" deletado com sucesso!`);
            await carregarVeiculos();
            resetarFormulario();
        } catch (error) {
            showNotification(`Falha ao deletar: ${error.message}`, 'error');
        }
    }

    // --- LÓGICA DE BUSCA AVANÇADA ---
    function filtrarVeiculos() {
        // ... (código sem alteração)
    }
    
    if (searchFiltersContainer) {
        searchFiltersContainer.addEventListener('input', filtrarVeiculos);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
             // ... (código sem alteração)
        });
    }

    // --- INICIALIZAÇÃO DA PÁGINA ---
    async function init() {
        await carregarCategorias();
        await carregarVeiculos();
        resetarFormulario();
    }

    init();

    // =======================================================
    // DEFINIÇÃO DAS FUNÇÕES QUE FORAM MINIMIZADAS (COPIE E COLE)
    // =======================================================
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
            if (disponivelTerm === "sim") disponivelMatch = v.disponivel === 1;
            else if (disponivelTerm === "nao") disponivelMatch = v.disponivel === 0;

            return idMatch && modeloMatch && marcaMatch && anoMatch && disponivelMatch;
        });

        renderizarTabela(veiculosFiltrados);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            searchIdInput.value = '';
            searchModeloInput.value = '';
            searchMarcaInput.value = '';
            searchAnoInput.value = '';
            searchDisponivelSelect.value = '';
            filtrarVeiculos();
        });
    }
});