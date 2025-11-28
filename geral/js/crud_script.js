/**
 * crud_script.js - Versão Enterprise v5.1 (Corrigido)
 * Gerencia o painel administrativo com upload de fotos e segurança.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // 1. CONFIGURAÇÕES E SEGURANÇA
    // ==========================================================
    
    // Configurações
    const API_URL = 'http://localhost:3002/api';
    const PLACEHOLDER_IMG = 'https://placehold.co/100x100?text=Sem+Foto';

    // Verificação de Segurança (Login)
    const token = localStorage.getItem('imperial_token') || localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole'); // (Opcional, se seu back enviar role)

    if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'code.html'; // Mude para o nome da sua tela de login
        return; // Para o script aqui
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'code.html';
        });
    }

    // ==========================================================
    // 2. REFERÊNCIAS DO DOM (HTML)
    // ==========================================================
    
    // Formulário e Campos
    const form = document.getElementById('form-veiculo');
    const elements = {
        id: document.getElementById('veiculo-id'),
        modelo: document.getElementById('modelo'),
        marca: document.getElementById('marca'),
        categoria: document.getElementById('categoria'),
        ano: document.getElementById('ano'),
        km: document.getElementById('km'),
        cor: document.getElementById('cor'),
        motor: document.getElementById('motor'),
        preco: document.getElementById('preco'),
        descricao: document.getElementById('descricao'),
        disponivel: document.getElementById('disponivel'),
        submitBtn: document.getElementById('submit-button'),
        clearBtn: document.getElementById('clear-button'),
        formTitle: document.getElementById('form-title')
    };

    // Área de Upload (Drag & Drop)
    const upload = {
        zone: document.getElementById('drop-zone'),
        input: document.getElementById('imagem'),
        previewBox: document.getElementById('preview-container'),
        img: document.getElementById('image-preview'),
        removeBtn: document.getElementById('remove-image-btn'),
        zoneContent: document.querySelector('.drop-zone-content'),
        file: null,      // Armazena o arquivo novo
        existingUrl: ''  // Armazena URL se for edição
    };

    // Tabela e Filtros
    const tbody = document.getElementById('corpo-tabela-veiculos');
    const filters = {
        id: document.getElementById('search-id'),
        modelo: document.getElementById('search-modelo'),
        marca: document.getElementById('search-marca'),
        status: document.getElementById('search-disponivel'),
        clearBtn: document.getElementById('clear-filters-btn')
    };

    // Cache de Dados
    let vehiclesCache = [];

    // ==========================================================
    // 3. GERENCIAMENTO DE UPLOAD (DRAG AND DROP)
    // ==========================================================

    // Função para mostrar prévia da imagem
    function renderPreview(src) {
        upload.img.src = src;
        upload.zone.style.display = 'none';
        upload.previewBox.style.display = 'block';
    }

    // Função para limpar imagem
    function clearImage() {
        upload.file = null;
        upload.existingUrl = '';
        upload.input.value = '';
        upload.img.src = '';
        upload.zone.style.display = 'block';
        upload.previewBox.style.display = 'none';
    }

    // Handlers de Upload
    const handleFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem.');
            return;
        }
        upload.file = file;
        const reader = new FileReader();
        reader.onload = (e) => renderPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    // Eventos da Zona de Arraste
    if(upload.zone && upload.input) {
        upload.zone.addEventListener('click', () => upload.input.click());
        
        upload.input.addEventListener('change', (e) => {
            if (e.target.files.length) handleFile(e.target.files[0]);
        });

        ['dragenter', 'dragover'].forEach(evt => {
            upload.zone.addEventListener(evt, (e) => {
                e.preventDefault();
                upload.zone.style.borderColor = '#000';
                upload.zone.style.backgroundColor = '#eef';
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            upload.zone.addEventListener(evt, (e) => {
                e.preventDefault();
                upload.zone.style.borderColor = '#ccc';
                upload.zone.style.backgroundColor = '#f9f9f9';
            });
        });

        upload.zone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });
    }

    if(upload.removeBtn) {
        upload.removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearImage();
        });
    }

    // ==========================================================
    // 4. API & DADOS (DATA FETCHING)
    // ==========================================================

    // Fetch genérico com Cabeçalho de Autorização
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = { 'Authorization': `Bearer ${token}` };
        const options = { method, headers };
        
        if (body && !(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        } else if (body) {
            options.body = body; // FormData (não seta Content-Type manual)
        }

        try {
            const res = await fetch(`${API_URL}${endpoint}`, options);
            
            // Tratamento de sessão
            if (res.status === 401 || res.status === 403) {
                alert('Sessão expirada.');
                localStorage.removeItem('imperial_token');
                window.location.href = 'code.html';
                return null;
            }

            // Tratamento de erros inesperados (ex: HTML 404 em vez de JSON)
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                if(!res.ok) throw new Error(`Erro Servidor (${res.status}): ${text.substring(0, 50)}...`);
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Erro HTTP ${res.status}`);
            }
            
            return method === 'DELETE' ? true : await res.json();
        } catch (error) {
            console.error(error);
            alert('❌ Erro na operação: ' + error.message);
            return null;
        }
    }

    async function loadData() {
        // Carrega Categorias
        const cats = await apiRequest('/categorias');
        if (cats && Array.isArray(cats)) {
            elements.categoria.innerHTML = '<option value="">Selecione...</option>';
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id_categoria;
                opt.textContent = c.nome_categoria;
                elements.categoria.appendChild(opt);
            });
        }

        // Carrega Veículos
        await reloadTable();
    }

    async function reloadTable() {
        if(!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Carregando...</td></tr>';
        const data = await apiRequest('/veiculos');
        if (data && Array.isArray(data)) {
            vehiclesCache = data;
            renderTable(data);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Erro ao carregar dados.</td></tr>';
        }
    }

    // ==========================================================
    // 5. RENDERIZAÇÃO E FILTROS
    // ==========================================================

    function renderTable(list) {
        tbody.innerHTML = '';
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Nenhum registro encontrado.</td></tr>';
            return;
        }

        list.forEach(v => {
            const row = document.createElement('tr');
            
            // Imagem: Se falhar ou vazia, usa placeholder
            let thumb = v.imagem || v.imagem_url;
            if (!thumb || thumb.length < 5) thumb = PLACEHOLDER_IMG;

            const price = parseFloat(v.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const statusText = v.disponivel ? 'Ativo' : 'Oculto';
            const statusColor = v.disponivel ? '#28a745' : '#dc3545';

            row.innerHTML = `
                <td>${v.id_veiculo}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${thumb}" class="thumb-tabela" onerror="this.src='${PLACEHOLDER_IMG}'" 
                             style="width:50px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #ddd;">
                        <div>
                            <strong>${v.modelo}</strong>
                            <div style="font-size:0.8em; color:#666;">${v.nome_marca || v.marca || '-'}</div>
                        </div>
                    </div>
                </td>
                <td>${price}</td>
                <td>${v.ano}</td>
                <td><span style="background:${statusColor}; color:white; padding:3px 8px; border-radius:4px; font-size:0.8em;">${statusText}</span></td>
                <td>
                    <button class="btn-action edit" data-id="${v.id_veiculo}" style="cursor:pointer; margin-right:5px;">✏️</button>
                    <button class="btn-action delete" data-id="${v.id_veiculo}" style="cursor:pointer;">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Ligar eventos nos botões
        document.querySelectorAll('.btn-action.delete').forEach(b => b.onclick = () => deleteItem(b.dataset.id));
        document.querySelectorAll('.btn-action.edit').forEach(b => b.onclick = () => loadItem(b.dataset.id));
    }

    // Filtragem Local
    function applyFilters() {
        if(!vehiclesCache.length) return;

        const idTerm = filters.id.value.trim().toLowerCase();
        const modelTerm = filters.modelo.value.trim().toLowerCase();
        const marcaTerm = filters.marca.value.trim().toLowerCase();
        const statusTerm = filters.status.value;

        const filtered = vehiclesCache.filter(v => {
            const mId = String(v.id_veiculo).toLowerCase();
            const mMod = String(v.modelo || '').toLowerCase();
            const mMrc = String(v.nome_marca || v.marca || '').toLowerCase();
            const isVis = !!v.disponivel; // Garante booleano

            const matchId = !idTerm || mId.includes(idTerm);
            const matchMod = !modelTerm || mMod.includes(modelTerm);
            const matchMrc = !marcaTerm || mMrc.includes(marcaTerm);
            
            let matchStatus = true;
            if (statusTerm === 'sim') matchStatus = isVis === true;
            if (statusTerm === 'nao') matchStatus = isVis === false;

            return matchId && matchMod && matchMrc && matchStatus;
        });

        renderTable(filtered);
    }

    Object.values(filters).forEach(inp => {
        if(inp) inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', applyFilters);
    });

    if(filters.clearBtn) {
        filters.clearBtn.addEventListener('click', () => {
            filters.id.value = '';
            filters.modelo.value = '';
            filters.marca.value = '';
            filters.status.value = '';
            applyFilters();
        });
    }

    // ==========================================================
    // 6. OPERAÇÕES DE CRUD (SUBMIT, EDIT, DELETE)
    // ==========================================================

    // SUBMIT (CREATE / UPDATE)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        elements.submitBtn.disabled = true;
        elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

        try {
            const fd = new FormData();
            fd.append('modelo', elements.modelo.value);
            fd.append('marca', elements.marca.value);
            fd.append('id_categoria_fk', elements.categoria.value);
            fd.append('ano', elements.ano.value);
            fd.append('km', elements.km.value);
            fd.append('cor', elements.cor.value);
            fd.append('motor', elements.motor.value);
            fd.append('preco', elements.preco.value);
            fd.append('descricao', elements.descricao.value);
            // Checkbox precisa ser tratado como booleano/string dependendo do back
            fd.append('disponivel', elements.disponivel.checked);

            if (upload.file) {
                fd.append('imagem', upload.file);
            } else if (upload.existingUrl) {
                fd.append('imagem_url_existente', upload.existingUrl);
            }

            const id = elements.id.value;
            const endpoint = id ? `/veiculos/${id}` : '/veiculos';
            const method = id ? 'PUT' : 'POST';

            const headers = { 'Authorization': `Bearer ${token}` };
            
            // ATENÇÃO: Ao enviar FormData, NÃO se define Content-Type manual. O navegador faz isso.
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: method,
                headers: headers,
                body: fd
            });

            // Tratamento específico de erro para Upload
            if (!res.ok) {
                const text = await res.text();
                // Tenta fazer parse do JSON, se falhar mostra texto puro
                let msg = text;
                try { 
                    msg = JSON.parse(text).error; 
                } catch(e){}
                throw new Error(msg || `Erro HTTP ${res.status}`);
            }

            alert(id ? 'Veículo atualizado!' : 'Veículo criado!');
            resetForm();
            reloadTable();

        } catch (error) {
            console.error(error);
            alert('❌ Falha ao salvar: ' + error.message);
        } finally {
            elements.submitBtn.disabled = false;
            elements.submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Veículo';
        }
    });

    // DELETE
    async function deleteItem(id) {
        if (!confirm('Tem certeza? Essa ação é irreversível.')) return;
        const success = await apiRequest(`/veiculos/${id}`, 'DELETE');
        if (success === true) { // 204 No Content
            // Removemos manualmente do cache para atualizar a tela sem refetch (opcional)
            vehiclesCache = vehiclesCache.filter(v => v.id_veiculo != id);
            applyFilters(); // Re-aplica filtros
            // Ou simplesmente recarregamos tudo: reloadTable();
        }
    }

    // EDITAR (Preencher Formulário)
    async function loadItem(id) {
        const item = vehiclesCache.find(v => v.id_veiculo == id);
        if (!item) return;

        elements.formTitle.innerText = `Editando: ${item.modelo}`;
        elements.submitBtn.innerHTML = '<i class="fas fa-sync"></i> Atualizar';
        
        elements.id.value = item.id_veiculo;
        elements.modelo.value = item.modelo;
        elements.marca.value = item.nome_marca || item.marca;
        elements.categoria.value = item.id_categoria_fk;
        elements.ano.value = item.ano;
        elements.km.value = item.km;
        elements.cor.value = item.cor;
        elements.motor.value = item.motor;
        elements.preco.value = item.preco;
        elements.descricao.value = item.descricao;
        elements.disponivel.checked = !!item.disponivel;

        // Imagem
        const imgUrl = item.imagem || item.imagem_url;
        if (imgUrl) {
            upload.existingUrl = imgUrl;
            renderPreview(imgUrl);
        } else {
            clearImage();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // RESETAR
    function resetForm() {
        form.reset();
        elements.id.value = '';
        elements.formTitle.innerText = 'Adicionar Novo Veículo';
        elements.submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Veículo';
        clearImage();
    }

    elements.clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetForm();
    });

    // Início
    loadData();
});