// crud_script.js
document.addEventListener('DOMContentLoaded', () => {
    const apiUrlBase = 'http://localhost:3002/api'; // URL base da sua API Node.js

    const formVeiculo = document.getElementById('form-veiculo');
    const formTitle = document.getElementById('form-title');
    const veiculoIdInput = document.getElementById('veiculo-id');
    const modeloInput = document.getElementById('modelo');
    const marcaSelect = document.getElementById('marca');
    const categoriaSelect = document.getElementById('categoria');
    const anoInput = document.getElementById('ano');
    const corInput = document.getElementById('cor');
    const precoInput = document.getElementById('preco');
    const descricaoTextarea = document.getElementById('descricao');
    const disponivelCheckbox = document.getElementById('disponivel');
    const submitButton = document.getElementById('submit-button');
    const clearButton = document.getElementById('clear-button');

    const corpoTabelaVeiculos = document.getElementById('corpo-tabela-veiculos');
    const searchVeiculoInput = document.getElementById('search-veiculo-input');

    let editando = false;

    // --- FUNÇÕES DE CARREGAMENTO INICIAL (MARCAS, CATEGORIAS, VEÍCULOS) ---

    async function carregarMarcas() {
        try {
            const response = await fetch(`${apiUrlBase}/marcas`); // Substitua pela sua rota real de marcas
            if (!response.ok) throw new Error(`Erro ao buscar marcas: ${response.statusText}`);
            const marcas = await response.json();

            marcaSelect.innerHTML = '<option value="">Selecione uma marca...</option>'; // Limpa e adiciona default
            marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.id_marca; // Supondo que sua API retorna id_marca
                option.textContent = marca.nome_marca;
                marcaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Falha ao carregar marcas:', error);
            marcaSelect.innerHTML = '<option value="">Erro ao carregar marcas</option>';
        }
    }

    async function carregarCategorias() {
        try {
            const response = await fetch(`${apiUrlBase}/categorias`);
            if (!response.ok) throw new Error(`Erro ao buscar categorias: ${response.statusText}`);
            const categorias = await response.json();

            categoriaSelect.innerHTML = '<option value="">Selecione uma categoria...</option>';
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id_categoria; // Supondo id_categoria
                option.textContent = categoria.nome_categoria;
                categoriaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Falha ao carregar categorias:', error);
            categoriaSelect.innerHTML = '<option value="">Erro ao carregar categorias</option>';
        }
    }

    async function carregarVeiculos(termoBusca = '') {
        try {
            // Se houver termo de busca, precisaremos de um endpoint de API que o suporte.
            // Por enquanto, vamos carregar todos ou filtrar no frontend (não ideal para muitos dados).
            // A API de /veiculos/categoria/:slugCategoria já existe. Poderíamos ter /veiculos para todos.
            // ASSUMINDO que você terá um endpoint como /api/veiculos que retorna todos os veículos
            // E que ele pode aceitar um query param para busca, ex: /api/veiculos?modelo=Huracan

            let url = `${apiUrlBase}/veiculos`; // Endpoint hipotético para listar todos
            if (termoBusca) {
                 // A forma de passar o termo de busca depende da sua API:
                // url += `?search=${encodeURIComponent(termoBusca)}`; // Exemplo de query param
                // OU, se você filtrar apenas por categoria aqui:
                // url = `${apiUrlBase}/veiculos/categoria/${encodeURIComponent(termoBusca)}`;
                console.warn("A busca no frontend ainda não está implementada para buscar do backend. Listando todos.");
            }

            // Para este exemplo, vamos pegar os veículos de uma categoria padrão ou todos
            // e filtrar no frontend (NÃO RECOMENDADO PARA MUITOS DADOS)
            // A melhor abordagem seria o backend fazer a filtragem
            // Vamos usar o endpoint de categoria que já existe como exemplo:
            // Troque 'esportivos' pela categoria desejada ou um endpoint que liste todos
            const response = await fetch(`${apiUrlBase}/veiculos`); // Carrega todos os veículos // PEGANDO SÓ ESPORTIVOS POR ENQUANTO
            if (!response.ok && response.status !== 404) throw new Error(`Erro HTTP: ${response.status}`);
            
            const veiculos = response.status === 404 ? [] : await response.json();

            corpoTabelaVeiculos.innerHTML = ''; // Limpa a tabela

            if (veiculos.length === 0) {
                const tr = corpoTabelaVeiculos.insertRow();
                const td = tr.insertCell();
                td.colSpan = 8; // Número de colunas na sua tabela
                td.textContent = 'Nenhum veículo encontrado.';
                td.style.textAlign = 'center';
                return;
            }
            
            // Filtro frontend simples (apenas para demonstração se a API não filtrar)
            const veiculosFiltrados = termoBusca ? veiculos.filter(v => v.modelo.toLowerCase().includes(termoBusca.toLowerCase())) : veiculos;


            veiculosFiltrados.forEach(veiculo => {
                const tr = corpoTabelaVeiculos.insertRow();
                tr.innerHTML = `
                    <td>${veiculo.id_veiculo}</td>
                    <td>${veiculo.modelo}</td>
                    <td>${veiculo.nome_marca}</td> {/* Supondo que a API retorna nome_marca */}
                    <td>${veiculo.nome_categoria}</td> {/* Supondo que a API retorna nome_categoria */}
                    <td>${veiculo.ano || 'N/A'}</td>
                    <td>R$ ${parseFloat(veiculo.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${veiculo.disponivel !== undefined ? (veiculo.disponivel ? 'Sim' : 'Não') : 'N/A'}</td>
                    <td>
                        <button class="edit-btn" data-id="${veiculo.id_veiculo}">✏️ Editar</button>
                        <button class="delete-btn" data-id="${veiculo.id_veiculo}">🗑️ Deletar</button>
                    </td>
                `;
                // Adicionar listeners aos botões de editar/deletar
                tr.querySelector('.edit-btn').addEventListener('click', () => popularFormularioParaEdicao(veiculo));
                tr.querySelector('.delete-btn').addEventListener('click', () => deletarVeiculo(veiculo.id_veiculo, veiculo.modelo));
            });
        } catch (error) {
            console.error('Falha ao carregar veículos:', error);
            corpoTabelaVeiculos.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Erro ao carregar veículos.</td></tr>`;
        }
    }


    // --- LÓGICA DO FORMULÁRIO (CRIAR/ATUALIZAR) ---
    formVeiculo.addEventListener('submit', async (event) => {
        event.preventDefault();

        const dadosVeiculo = {
            modelo: modeloInput.value,
            id_marca_fk: parseInt(marcaSelect.value),
            id_categoria_fk: parseInt(categoriaSelect.value),
            ano: anoInput.value ? parseInt(anoInput.value) : null,
            cor: corInput.value || null,
            preco: precoInput.value ? parseFloat(precoInput.value) : null,
            descricao: descricaoTextarea.value || null,
            disponivel: disponivelCheckbox.checked
        };

        const id = veiculoIdInput.value;
        let url = `${apiUrlBase}/veiculos`; // Endpoint para criar
        let method = 'POST';

        if (editando && id) {
            url = `${apiUrlBase}/veiculos/${id}`; // Endpoint para atualizar
            method = 'PUT'; // Ou 'PATCH' dependendo da sua API
            // Adicione o ID ao corpo se sua API de PUT/PATCH precisar dele no corpo também
            // dadosVeiculo.id_veiculo = parseInt(id);
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosVeiculo),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao ${editando ? 'atualizar' : 'salvar'} veículo`);
            }

            const resultado = await response.json();
            alert(`Veículo ${editando ? 'atualizado' : 'salvo'} com sucesso! ID: ${resultado.id || id}`); // Sua API deve retornar o ID
            resetarFormulario();
            carregarVeiculos(); // Recarrega a lista

        } catch (error) {
            console.error(`Erro ao ${editando ? 'atualizar' : 'salvar'} veículo:`, error);
            alert(`Falha: ${error.message}`);
        }
    });

    function resetarFormulario() {
        formVeiculo.reset();
        veiculoIdInput.value = '';
        formTitle.textContent = 'Adicionar Novo Veículo';
        submitButton.textContent = 'Salvar Veículo';
        editando = false;
        disponivelCheckbox.checked = true; // Valor padrão
        modeloInput.focus();
    }

    clearButton.addEventListener('click', resetarFormulario);

    function popularFormularioParaEdicao(veiculo) {
        formTitle.textContent = `Editando Veículo: ${veiculo.modelo}`;
        submitButton.textContent = 'Atualizar Veículo';
        editando = true;

        veiculoIdInput.value = veiculo.id_veiculo;
        modeloInput.value = veiculo.modelo;
        marcaSelect.value = veiculo.id_marca_fk || (veiculo.marca ? veiculo.marca.id_marca : ''); // Adaptar conforme sua API retorna
        categoriaSelect.value = veiculo.id_categoria_fk || (veiculo.categoria ? veiculo.categoria.id_categoria : ''); // Adaptar
        anoInput.value = veiculo.ano || '';
        corInput.value = veiculo.cor || '';
        precoInput.value = veiculo.preco || '';
        descricaoTextarea.value = veiculo.descricao || '';
        disponivelCheckbox.checked = veiculo.disponivel !== undefined ? veiculo.disponivel : true;

        window.scrollTo({ top: formVeiculoSection.offsetTop - 20, behavior: 'smooth' });
        modeloInput.focus();
    }


    // --- LÓGICA PARA DELETAR ---
    async function deletarVeiculo(id, modelo) {
        if (!confirm(`Tem certeza que deseja deletar o veículo "${modelo}" (ID: ${id})?`)) {
            return;
        }
        try {
            const response = await fetch(`${apiUrlBase}/veiculos/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao deletar veículo');
            }
            alert(`Veículo "${modelo}" deletado com sucesso!`);
            carregarVeiculos(); // Recarrega a lista
        } catch (error) {
            console.error('Erro ao deletar veículo:', error);
            alert(`Falha ao deletar: ${error.message}`);
        }
    }

    // --- BUSCA NA TABELA (FILTRO FRONTEND SIMPLES) ---
    searchVeiculoInput.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        // A função carregarVeiculos precisaria ser adaptada para realmente usar o termo no backend,
        // ou você filtra no frontend, o que NÃO é ideal para muitos dados.
        // Por ora, vamos refiltrar os dados já carregados (se for o caso) ou recarregar tudo com o termo.
        carregarVeiculos(termo); // Se sua função carregarVeiculos já lida com filtro frontend.
    });


    // --- INICIALIZAÇÃO DA PÁGINA ---
    function initCrudPage() {
        carregarMarcas();
        carregarCategorias();
        carregarVeiculos(); // Carrega todos os veículos inicialmente (ou da categoria padrão)
        resetarFormulario();
    }

    initCrudPage();
});

// server.js

import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
// import axios from 'axios'; // Se for usar a API de previsão do tempo

dotenv.config();

// ---- CONFIGURAÇÃO DO BANCO DE DADOS SQLITE ----
const dbFile = './imperial_data.db';
const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(`[SERVIDOR] ERRO ao conectar ao banco de dados SQLite '${dbFile}':`, err.message);
    } else {
        console.log(`[SERVIDOR] Conectado com sucesso ao banco de dados SQLite: ${dbFile}`);
        db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
            if (pragmaErr) console.error("[SERVIDOR] ERRO ao ativar PRAGMA foreign_keys:", pragmaErr.message);
            else console.log("[SERVIDOR] PRAGMA foreign_keys ativada.");
        });
    }
});
// ----------------------------------------------

const app = express();
const PORTA_SERVIDOR = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// --- ROTAS DA API PARA O SITE IMPERIAL ---

app.get('/api', (req, res) => {
    res.json({ message: 'Bem-vindo à API do Site IMPERIAL!' });
});

// ==== NOVA ROTA PARA LISTAR MARCAS ====
app.get('/api/marcas', (req, res) => {
    const sql = "SELECT id_marca, nome_marca, logo_url FROM marcas ORDER BY nome_marca ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("[SERVIDOR] Erro ao buscar marcas:", err.message);
            return res.status(500).json({ error: 'Erro ao buscar marcas no servidor.' });
        }
        res.json(rows);
    });
});

// ==== ROTA PARA LISTAR CATEGORIAS (JÁ EXISTENTE, MAS CONFERIR) ====
app.get('/api/categorias', (req, res) => {
    // Modifiquei para incluir a descrição, se você adicionou no DB
    const sql = "SELECT id_categoria, nome_categoria, slug_categoria, descricao_categoria FROM categorias ORDER BY nome_categoria ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("[SERVIDOR] Erro ao buscar categorias:", err.message);
            return res.status(500).json({ error: 'Erro ao buscar categorias no servidor.' });
        }
        res.json(rows);
    });
});


// Rota para listar veículos de uma categoria específica (como antes)
app.get('/api/veiculos/categoria/:slugCategoria', (req, res) => {
    const { slugCategoria } = req.params;
    const sql = `
        SELECT v.id_veiculo, v.modelo, v.ano, v.preco, v.cor, v.disponivel, v.descricao, 
               m.nome_marca, c.nome_categoria
        FROM veiculos v
        JOIN marcas m ON v.id_marca_fk = m.id_marca
        JOIN categorias c ON v.id_categoria_fk = c.id_categoria
        WHERE c.slug_categoria = ?
        ORDER BY v.modelo ASC
    `;
    db.all(sql, [slugCategoria], (err, rows) => {
        if (err) {
            console.error(`[SERVIDOR] Erro ao buscar veículos para '${slugCategoria}':`, err.message);
            return res.status(500).json({ error: 'Erro ao buscar veículos da categoria.' });
        }
        // Aqui você pode adicionar a lógica para buscar as imagens de cada veículo se quiser
        // ou deixar para o endpoint /api/veiculos/:idVeiculo fazer isso.
        res.json(rows);
    });
});

// Rota para buscar detalhes de um veículo específico pelo ID (como antes)
app.get('/api/veiculos/:idVeiculo', (req, res) => {
    const { idVeiculo } = req.params;
    const sqlVeiculo = `
        SELECT v.id_veiculo, v.modelo, v.ano, v.cor, v.preco, v.disponivel, v.descricao,
               m.nome_marca, c.nome_categoria, m.id_marca AS id_marca_fk, c.id_categoria AS id_categoria_fk 
               /* Adicionando IDs de FK para preencher formulário de edição */
        FROM veiculos v
        JOIN marcas m ON v.id_marca_fk = m.id_marca
        JOIN categorias c ON v.id_categoria_fk = c.id_categoria
        WHERE v.id_veiculo = ?
    `;
    const sqlImagens = `SELECT id_imagem, url_imagem, imagem_principal, ordem FROM imagens_veiculos WHERE id_veiculo_fk = ? ORDER BY ordem ASC, imagem_principal DESC`;

    db.get(sqlVeiculo, [idVeiculo], (err, veiculo) => {
        if (err) {
            console.error(`[SERVIDOR] Erro ao buscar veículo ID '${idVeiculo}':`, err.message);
            return res.status(500).json({ error: 'Erro ao buscar detalhes do veículo.' });
        }
        if (!veiculo) {
            return res.status(404).json({ message: `Veículo com ID '${idVeiculo}' não encontrado.` });
        }

        db.all(sqlImagens, [idVeiculo], (errImgs, imagens) => {
            if (errImgs) {
                console.error(`[SERVIDOR] Erro ao buscar imagens para veículo ID '${idVeiculo}':`, errImgs.message);
                veiculo.imagens = [];
            } else {
                veiculo.imagens = imagens;
            }
            res.json(veiculo);
        });
    });
});


// ==== NOVAS ROTAS CRUD PARA VEÍCULOS (Exemplos) ====

// CRIAR um novo veículo (POST)
app.post('/api/veiculos', (req, res) => {
    const { modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, descricao, disponivel } = req.body;

    // Validação básica dos dados recebidos
    if (!modelo || !id_marca_fk || !id_categoria_fk) {
        return res.status(400).json({ error: 'Modelo, ID da Marca e ID da Categoria são obrigatórios.' });
    }

    const sql = `INSERT INTO veiculos (modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, descricao, disponivel)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, descricao, (disponivel !== undefined ? disponivel : true)];

    db.run(sql, params, function(err) { // Usar function() para ter acesso a this.lastID
        if (err) {
            console.error("[SERVIDOR] Erro ao inserir veículo:", err.message);
            return res.status(500).json({ error: 'Erro ao inserir veículo no banco de dados.' });
        }
        res.status(201).json({ id_veiculo: this.lastID, message: 'Veículo criado com sucesso!' });
    });
});

// ATUALIZAR um veículo existente (PUT)
app.put('/api/veiculos/:idVeiculo', (req, res) => {
    const { idVeiculo } = req.params;
    const { modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, descricao, disponivel } = req.body;

    if (!modelo || !id_marca_fk || !id_categoria_fk) {
        return res.status(400).json({ error: 'Modelo, ID da Marca e ID da Categoria são obrigatórios para atualização.' });
    }

    const sql = `UPDATE veiculos 
                 SET modelo = ?, id_marca_fk = ?, id_categoria_fk = ?, ano = ?, cor = ?, 
                     preco = ?, descricao = ?, disponivel = ?
                 WHERE id_veiculo = ?`;
    const params = [modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, descricao, (disponivel !== undefined ? disponivel : true), idVeiculo];

    db.run(sql, params, function(err) {
        if (err) {
            console.error(`[SERVIDOR] Erro ao atualizar veículo ID '${idVeiculo}':`, err.message);
            return res.status(500).json({ error: 'Erro ao atualizar veículo.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: `Veículo com ID '${idVeiculo}' não encontrado para atualização.` });
        }
        res.json({ message: `Veículo ID '${idVeiculo}' atualizado com sucesso!` });
    });
});

// DELETAR um veículo (DELETE)
app.delete('/api/veiculos/:idVeiculo', (req, res) => {
    const { idVeiculo } = req.params;
    // Primeiro deletar imagens associadas (devido ao ON DELETE CASCADE na tabela imagens_veiculos, isso pode não ser estritamente necessário se a constraint funcionar, mas é bom saber)
    // db.run(`DELETE FROM imagens_veiculos WHERE id_veiculo_fk = ?`, [idVeiculo], (errImg) => {
    //     if (errImg) { ... } // Tratar erro de imagens
    // });
    const sql = `DELETE FROM veiculos WHERE id_veiculo = ?`;
    db.run(sql, [idVeiculo], function(err) {
        if (err) {
            console.error(`[SERVIDOR] Erro ao deletar veículo ID '${idVeiculo}':`, err.message);
            // Se o erro for FOREIGN KEY constraint, é porque ON DELETE RESTRICT em outras tabelas o impediu.
            return res.status(500).json({ error: 'Erro ao deletar veículo. Verifique dependências.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: `Veículo com ID '${idVeiculo}' não encontrado para deleção.` });
        }
        res.json({ message: `Veículo ID '${idVeiculo}' deletado com sucesso!` });
    });
});


// Rota de Previsão do Tempo (OPCIONAL, como antes)
const apiKeyOpenWeather = process.env.OPENWEATHER_API_KEY;
if (apiKeyOpenWeather) {
    // ... (código da previsão do tempo, não mudou)
} else {
    console.warn("[SERVIDOR] API de previsão do tempo desativada.");
}


// Middlewares de 404 e Erro Genérico (como antes)
app.use((req, res, next) => { res.status(404).json({ error: `Endpoint não encontrado: ${req.originalUrl}` }); });
app.use((err, req, res, next) => { console.error('[SERVIDOR] Erro não tratado:', err.stack || err); res.status(500).json({ error: 'Erro inesperado no servidor.' }); });

// Inicialização do Servidor (como antes)
app.listen(PORTA_SERVIDOR, () => { /* ... logs ... */ });
process.on('SIGINT', () => { /* ... graceful shutdown ... */ });// crud_script.js (trecho relevante)

// ... (outros seletores e código) ...
const apiUrlBase = 'http://localhost:3002/api'; // CONFIRME ESTA URL E PORTA
const marcaSelect = document.getElementById('marca');
const categoriaSelect = document.getElementById('categoria');

// --- FUNÇÕES DE CARREGAMENTO INICIAL (MARCAS, CATEGORIAS, VEÍCULOS) ---

async function carregarMarcas() {
    try {
        console.log('[CRUD] Tentando carregar marcas de:', `${apiUrlBase}/marcas`); // DEBUG
        const response = await fetch(`${apiUrlBase}/marcas`);
        console.log('[CRUD] Resposta de marcas:', response); // DEBUG

        if (!response.ok) {
            // Tenta ler o corpo do erro se não for ok, para mais detalhes
            let errorBody = 'Detalhes do erro não disponíveis.';
            try {
                errorBody = await response.text(); // Ou response.json() se souber que é JSON
            } catch (e) { /* ignora se não puder ler o corpo */ }
            throw new Error(`Erro HTTP ${response.status} ao buscar marcas: ${response.statusText}. Corpo: ${errorBody}`);
        }
        const marcas = await response.json();
        console.log('[CRUD] Marcas recebidas:', marcas); // DEBUG

        marcaSelect.innerHTML = '<option value="">Selecione uma marca...</option>';
        if (marcas && marcas.length > 0) { // Adiciona verificação se marcas é um array e tem itens
            marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.id_marca;
                option.textContent = marca.nome_marca;
                marcaSelect.appendChild(option);
            });
        } else {
            console.log('[CRUD] Nenhuma marca retornada pela API ou array vazio.');
        }
    } catch (error) {
        console.error('[CRUD] Falha ao carregar marcas:', error);
        marcaSelect.innerHTML = '<option value="">Erro ao carregar marcas</option>';
    }
}

async function carregarCategorias() {
    try {
        console.log('[CRUD] Tentando carregar categorias de:', `${apiUrlBase}/categorias`); // DEBUG
        const response = await fetch(`${apiUrlBase}/categorias`);
        console.log('[CRUD] Resposta de categorias:', response); // DEBUG

        if (!response.ok) {
            let errorBody = 'Detalhes do erro não disponíveis.';
            try { errorBody = await response.text(); } catch (e) {}
            throw new Error(`Erro HTTP ${response.status} ao buscar categorias: ${response.statusText}. Corpo: ${errorBody}`);
        }
        const categorias = await response.json();
        console.log('[CRUD] Categorias recebidas:', categorias); // DEBUG

        categoriaSelect.innerHTML = '<option value="">Selecione uma categoria...</option>';
        if (categorias && categorias.length > 0) { // Adiciona verificação
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id_categoria;
                option.textContent = categoria.nome_categoria;
                categoriaSelect.appendChild(option);
            });
        } else {
             console.log('[CRUD] Nenhuma categoria retornada pela API ou array vazio.');
        }
    } catch (error) {
        console.error('[CRUD] Falha ao carregar categorias:', error);
        categoriaSelect.innerHTML = '<option value="">Erro ao carregar categorias</option>';
    }
}

// ... (resto do seu crud_script.js) ...

// --- INICIALIZAÇÃO DA PÁGINA ---
function initCrudPage() {
    console.log("[CRUD] Inicializando página CRUD..."); // DEBUG
    carregarMarcas();
    carregarCategorias();
    // carregarVeiculos(); // Você pode comentar isso temporariamente para focar nos selects
    resetarFormulario(); // Se esta função existir
}

initCrudPage();

