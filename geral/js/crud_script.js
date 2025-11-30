/**
 * IMPERIAL MOTORS ADMIN PANEL v6.0 (Ultimate Edition)
 * Autor: Imperial Dev Team
 * Recursos: Auth, CRUD, Upload, Máscaras, Notificações, Busca, Sort e muito mais.
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. CONSTANTES E CONFIGURAÇÃO
    // =========================================================================
    const Config = {
        API_URL: 'http://localhost:3002/api',
        // Imagem Padrão se nada existir
        PLACEHOLDER_IMG: 'https://placehold.co/100x100?text=Sem+Foto',
        // Mapa de Segurança (Backup Interno) - Para mostrar prévia se não tiver upload
        IMAGE_BACKUP: {
            'JETTA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/2022_Volkswagen_Jetta_GLI_2.0_s.jpg/800px-2022_Volkswagen_Jetta_GLI_2.0_s.jpg',
            'COROLLA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/2020_Toyota_Corolla_Altis_Hybrid_%28Philippines%29.jpg/800px-2020_Toyota_Corolla_Altis_Hybrid_%28Philippines%29.jpg',
            'RAM': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ram_1500_TRX_%28restyling%29_%E2%80%93_Frontansicht%2C_10._April_2022%2C_D%C3%BCsseldorf.jpg/800px-Ram_1500_TRX_%28restyling%29_%E2%80%93_Frontansicht%2C_10._April_2022%2C_D%C3%BCsseldorf.jpg'
            // (A lista completa de segurança pode ser importada ou repetida aqui)
        }
    };

    // Estado Local
    let vehicleCache = [];
    
    // Verificação de Token (Gatekeeper)
    const token = localStorage.getItem('imperial_token') || localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'code.html'; // Redireciona se não logado
        return; 
    }

    // =========================================================================
    // 2. REFERÊNCIAS DO DOM (HTML)
    // =========================================================================
    
    // Formulário
    const form = document.getElementById('form-veiculo');
    const fields = {
        id: document.getElementById('veiculo-id'),
        modelo: document.getElementById('modelo'),
        marca: document.getElementById('marca'),
        cat: document.getElementById('categoria'),
        ano: document.getElementById('ano'),
        km: document.getElementById('km'),
        motor: document.getElementById('motor'),
        cor: document.getElementById('cor'),
        preco: document.getElementById('preco'),
        desc: document.getElementById('descricao'),
        status: document.getElementById('disponivel'),
        title: document.getElementById('form-title'),
        btnSubmit: document.getElementById('submit-button'),
        btnReset: document.getElementById('clear-button')
    };

    // Área de Upload
    const uploader = {
        zone: document.getElementById('drop-zone'),
        input: document.getElementById('imagem'),
        preview: document.getElementById('preview-container'),
        img: document.getElementById('image-preview'),
        btnRemove: document.getElementById('remove-image-btn'),
        file: null, // Armazena arquivo novo
        urlOld: ''  // Armazena URL antiga
    };

    // Tabela e Filtros
    const tbody = document.getElementById('corpo-tabela-veiculos');
    const search = {
        id: document.getElementById('search-id'),
        model: document.getElementById('search-modelo'),
        brand: document.getElementById('search-marca'),
        status: document.getElementById('search-disponivel'),
        btnClear: document.getElementById('clear-filters-btn')
    };

    const btnLogout = document.getElementById('logout-btn');

    // =========================================================================
    // 3. SISTEMA DE NOTIFICAÇÕES (TOASTS) - ADEUS ALERT()
    // =========================================================================
    const Toast = {
        show: (msg, type = 'success') => {
            const el = document.createElement('div');
            el.className = `toast-msg ${type}`;
            el.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 9999;
                background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
                color: #fff; padding: 15px 25px; border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2); font-weight: bold;
                animation: slideIn 0.3s ease; display: flex; align-items: center; gap: 10px;
            `;
            el.innerHTML = `<i class="fas fa-${type==='success'?'check':'times'}-circle"></i> ${msg}`;
            document.body.appendChild(el);
            setTimeout(() => { 
                el.style.animation = 'slideOut 0.3s forwards';
                setTimeout(() => el.remove(), 300);
            }, 3000);
        }
    };

    // CSS para Animações (Injetado via JS para não precisar mexer no CSS agora)
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes slideOut { to { transform: translateX(100%); opacity:0; } }
        tr.fade-in { animation: fadeInRow 0.4s ease; }
        @keyframes fadeInRow { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // =========================================================================
    // 4. API MANAGER (COM TRATAMENTO DE ERRO AVANÇADO)
    // =========================================================================
    
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = { 'Authorization': `Bearer ${token}` };
        const options = { method, headers };

        // Se body for FormData, browser define Content-Type. Se objeto, nós definimos.
        if (body && !(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        } else if (body) {
            options.body = body; 
        }

        try {
            const res = await fetch(`${Config.API_URL}${endpoint}`, options);
            
            // Logout forçado se token inválido
            if (res.status === 401 || res.status === 403) {
                Toast.show('Sessão expirada. Redirecionando...', 'error');
                localStorage.removeItem('imperial_token');
                setTimeout(() => window.location.href = 'code.html', 1500);
                return null;
            }

            // Tratamento de resposta HTML (Erro 500 do servidor geralmente)
            const type = res.headers.get("content-type");
            if (!type || !type.includes("application/json")) {
                const text = await res.text();
                console.error("Server HTML Error:", text);
                throw new Error(`Erro do Servidor (${res.status}). Verifique o console.`);
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro desconhecido na API.');

            // Retorno para DELETE
            if (res.status === 204 || method === 'DELETE') return true;

            return data;

        } catch (error) {
            console.error('API Error:', error);
            Toast.show(error.message, 'error');
            return null;
        }
    }

    // =========================================================================
    // 5. GERENCIADOR DE UPLOAD (DRAG & DROP + PREVIEW)
    // =========================================================================
    const UploadManager = {
        init: () => {
            const z = uploader.zone; const i = uploader.input;
            
            z.onclick = () => i.click();
            i.onchange = (e) => { if(e.target.files.length) UploadManager.process(e.target.files[0]); };
            
            // Eventos de arrastar
            ['dragenter', 'dragover'].forEach(e => z.addEventListener(e, (ev) => {
                ev.preventDefault(); z.classList.add('dragover'); z.style.borderColor='#2ecc71'; z.style.background='#eafaf1';
            }));
            ['dragleave', 'drop'].forEach(e => z.addEventListener(e, (ev) => {
                ev.preventDefault(); z.classList.remove('dragover'); z.style.borderColor='#ccc'; z.style.background='#f9f9f9';
            }));
            z.addEventListener('drop', (ev) => {
                if(ev.dataTransfer.files.length) UploadManager.process(ev.dataTransfer.files[0]);
            });

            uploader.btnRemove.onclick = (e) => { e.preventDefault(); UploadManager.clear(); };
        },

        process: (file) => {
            if(!file.type.startsWith('image/')) { Toast.show('Apenas imagens são permitidas!', 'error'); return; }
            uploader.file = file;
            const reader = new FileReader();
            reader.onload = (e) => UploadManager.show(e.target.result);
            reader.readAsDataURL(file);
        },

        show: (src) => {
            uploader.img.src = src;
            uploader.zone.style.display = 'none';
            uploader.preview.style.display = 'block';
        },

        clear: () => {
            uploader.file = null;
            uploader.urlOld = '';
            uploader.input.value = '';
            uploader.img.src = '';
            uploader.zone.style.display = 'block';
            uploader.preview.style.display = 'none';
        }
    };

    // =========================================================================
    // 6. FUNÇÕES PRINCIPAIS DO SISTEMA
    // =========================================================================

    // Carregamento Inicial
    async function initSystem() {
        UploadManager.init(); // Ativa upload
        
        // Popula Categorias
        const cats = await apiRequest('/categorias');
        if (cats && Array.isArray(cats)) {
            fields.cat.innerHTML = '<option value="">Selecione...</option>';
            cats.forEach(c => {
                fields.cat.innerHTML += `<option value="${c.id_categoria}">${c.nome_categoria}</option>`;
            });
        }

        refreshTable();
    }

    // Recarrega Tabela
    async function refreshTable() {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#666;"><i class="fas fa-spinner fa-spin"></i> Atualizando lista...</td></tr>';
        
        const data = await apiRequest('/veiculos');
        if (data) {
            vehicleCache = data;
            renderRows(data);
        }
    }

    // Renderiza Linhas
    function renderRows(list) {
        tbody.innerHTML = '';
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">Nenhum veículo encontrado no inventário.</td></tr>';
            return;
        }

        list.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'fade-in'; // Animação de entrada

            // Resolve Imagem para Thumb (Tenta Upload -> Backup -> Placeholder)
            let thumb = item.imagem || item.imagem_url;
            if (thumb && thumb.startsWith('/uploads')) thumb = `http://localhost:3002${thumb}`;
            
            // Backup Interno se o banco tiver link quebrado
            if (!thumb || thumb.length < 5) {
                // Tenta achar pelo nome
                const key = Object.keys(Config.IMAGE_BACKUP).find(k => (item.modelo || '').toUpperCase().includes(k));
                thumb = key ? Config.IMAGE_BACKUP[key] : Config.PLACEHOLDER_IMG;
            }

            const priceFmt = parseFloat(item.preco).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
            const badgeClass = item.disponivel ? 'success' : 'danger';
            const badgeLabel = item.disponivel ? 'VISÍVEL' : 'OCULTO';

            row.innerHTML = `
                <td style="font-weight:bold;">#${item.id_veiculo}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="width:60px; height:40px; border-radius:6px; overflow:hidden; border:1px solid #ddd; background:#eee;">
                            <img src="${thumb}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='${Config.PLACEHOLDER_IMG}'">
                        </div>
                        <div>
                            <div style="font-weight:700; font-size:1.05em;">${item.modelo}</div>
                            <div style="font-size:0.85em; color:#777; text-transform:uppercase;">${item.nome_marca || item.marca || 'Marca?'}</div>
                        </div>
                    </div>
                </td>
                <td style="font-weight:600;">${priceFmt}</td>
                <td>${item.ano}</td>
                <td>
                    <span style="background:var(--${badgeClass}-color, ${item.disponivel?'#2ecc71':'#e74c3c'}); color:white; padding:4px 8px; border-radius:4px; font-size:0.75em; font-weight:800; letter-spacing:0.5px;">
                        ${badgeLabel}
                    </span>
                </td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button class="btn-icon edit" data-id="${item.id_veiculo}" title="Editar" style="background:#f1c40f; color:#fff; border:none; width:32px; height:32px; border-radius:4px; cursor:pointer;"><i class="fas fa-pen"></i></button>
                        <button class="btn-icon del" data-id="${item.id_veiculo}" title="Excluir" style="background:#e74c3c; color:#fff; border:none; width:32px; height:32px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Ligações de Botões (Evita inline JS no HTML)
        tbody.querySelectorAll('.btn-icon.edit').forEach(b => b.onclick = () => loadForEdit(b.dataset.id));
        tbody.querySelectorAll('.btn-icon.del').forEach(b => b.onclick = () => deleteVehicle(b.dataset.id));
    }

    // =========================================================================
    // 7. AÇÕES DO FORMULÁRIO (SAVE/EDIT/RESET)
    // =========================================================================

    // Salvar (Submit)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Estado de Carregamento no Botão
        const originalText = fields.btnSubmit.innerHTML;
        fields.btnSubmit.disabled = true;
        fields.btnSubmit.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processando...';

        try {
            // FormData Automático
            const fd = new FormData();
            
            // Mapeamento dos campos
            fd.append('modelo', fields.modelo.value.trim());
            fd.append('marca', fields.marca.value.trim());
            fd.append('id_categoria_fk', fields.cat.value);
            fd.append('ano', fields.ano.value);
            fd.append('km', fields.km.value);
            fd.append('motor', fields.motor.value);
            fd.append('cor', fields.cor.value);
            fd.append('preco', fields.preco.value);
            fd.append('descricao', fields.desc.value);
            // Checkbox precisa enviar boolean string ou value
            fd.append('disponivel', fields.status.checked);

            // Tratamento de Imagem
            if (uploader.file) {
                fd.append('imagem', uploader.file);
            } else if (uploader.urlOld) {
                fd.append('imagem_url_existente', uploader.urlOld);
            }

            const id = fields.id.value;
            const method = id ? 'PUT' : 'POST';
            const endpoint = id ? `/veiculos/${id}` : '/veiculos';

            const res = await apiRequest(endpoint, method, fd);

            if (res) {
                Toast.show(id ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado!', 'success');
                resetAll();
                refreshTable();
                
                // Rola para a tabela
                document.getElementById('lista-veiculos-section').scrollIntoView({behavior:'smooth'});
            }

        } catch (error) {
            Toast.show('Falha ao salvar: ' + error.message, 'error');
        } finally {
            fields.btnSubmit.disabled = false;
            fields.btnSubmit.innerHTML = originalText;
        }
    });

    // Carregar Edição
    function loadForEdit(id) {
        const item = vehicleCache.find(v => v.id_veiculo == id);
        if(!item) return Toast.show('Erro ao localizar item localmente.', 'error');

        fields.title.innerHTML = `<i class="fas fa-edit"></i> Editando: ${item.modelo}`;
        fields.btnSubmit.innerHTML = `<i class="fas fa-sync"></i> Atualizar Agora`;
        fields.btnSubmit.classList.add('pulse'); // Efeito visual

        // Preenche campos
        fields.id.value = item.id_veiculo;
        fields.modelo.value = item.modelo;
        fields.marca.value = item.nome_marca || item.marca;
        fields.cat.value = item.id_categoria_fk;
        fields.ano.value = item.ano;
        fields.km.value = item.km;
        fields.cor.value = item.cor;
        fields.motor.value = item.motor;
        fields.preco.value = item.preco;
        fields.desc.value = item.descricao;
        fields.status.checked = (item.disponivel === 1 || item.disponivel === true);

        // Preenche Imagem
        const img = item.imagem || item.imagem_url;
        if (img) {
            let safeImg = img;
            // Corrige se for local
            if (safeImg.startsWith('/uploads')) safeImg = `http://localhost:3002${safeImg}`;
            // Guarda para re-envio
            uploader.urlOld = img;
            UploadManager.show(safeImg);
        } else {
            UploadManager.clear();
        }

        // Rola suave para o topo
        window.scrollTo({ top: form.offsetTop - 50, behavior: 'smooth' });
    }

    // Excluir
    async function deleteVehicle(id) {
        if (!confirm('🛑 ATENÇÃO: Esta ação é permanente!\nDeseja realmente excluir este veículo?')) return;
        
        const success = await apiRequest(`/veiculos/${id}`, 'DELETE');
        if (success) {
            Toast.show('Item excluído da base de dados.', 'success');
            // Remove do array local para ser instantâneo
            vehicleCache = vehicleCache.filter(v => v.id_veiculo != id);
            filterData(); // Re-renderiza sem precisar ir no servidor de novo
        }
    }

    // Resetar Formulário
    function resetAll() {
        form.reset();
        fields.id.value = '';
        fields.title.textContent = 'Adicionar Novo Veículo';
        fields.btnSubmit.innerHTML = '<i class="fas fa-save"></i> Salvar Veículo';
        fields.status.checked = true;
        UploadManager.clear();
    }

    fields.btnReset.onclick = (e) => { e.preventDefault(); resetAll(); };

    // =========================================================================
    // 8. BUSCA INSTANTÂNEA
    // =========================================================================
    
    function filterData() {
        const idT = search.id.value.toLowerCase();
        const modT = search.model.value.toLowerCase();
        const brandT = search.brand.value.toLowerCase();
        const stT = search.status.value;

        const res = vehicleCache.filter(item => {
            const mId = String(item.id_veiculo);
            const mMod = (item.modelo || '').toLowerCase();
            const mBr = (item.nome_marca || item.marca || '').toLowerCase();
            const mSt = !!item.disponivel;

            const matchId = !idT || mId.includes(idT);
            const matchMod = !modT || mMod.includes(modT);
            const matchBr = !brandT || mBr.includes(brandT);
            
            let matchSt = true;
            if (stT === 'sim') matchSt = mSt === true;
            if (stT === 'nao') matchSt = mSt === false;

            return matchId && matchMod && matchBr && matchSt;
        });

        renderRows(res);
    }

    // Bind eventos de busca
    [search.id, search.model, search.brand, search.status].forEach(el => {
        el.addEventListener('input', filterData);
        if(el.tagName === 'SELECT') el.addEventListener('change', filterData);
    });

    search.btnClear.onclick = () => {
        search.id.value = ''; search.model.value = '';
        search.brand.value = ''; search.status.value = '';
        renderRows(vehicleCache);
    };

    // Logout
    if (btnLogout) {
        btnLogout.onclick = (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'code.html';
        }
    }

    // START
    initSystem();
});