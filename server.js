import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import multer from 'multer'; // NOVO: Importa o multer
import path from 'path';     // NOVO: Ferramenta para lidar com caminhos de arquivos

dotenv.config();

// ---- CONFIGURAÇÃO DA CONEXÃO ----
const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    waitForConnections: true, connectionLimit: 10, queueLimit: 0
});

const app = express();
const PORTA_SERVIDOR = process.env.PORT || 3002;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
// NOVO: Torna a pasta 'public' acessível publicamente para o navegador encontrar as imagens
app.use(express.static('public'));

// --- CONFIGURAÇÃO DO MULTER (UPLOAD DE ARQUIVOS) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/vehicles'); // Pasta onde as imagens serão salvas
    },
    filename: (req, file, cb) => {
        // Cria um nome de arquivo único para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- ROTAS (Com as alterações para imagem) ---

// ... (Suas rotas GET para categorias e buscar veículos permanecem as mesmas) ...
app.get('/api/categorias', async (req, res) => { /* ...código sem alteração... */ });
app.get('/api/veiculos', async (req, res) => { /* ...código sem alteração... */ });
app.get('/api/veiculos/:id', async (req, res) => { /* ...código sem alteração... */ });


// CRIAR VEÍCULO - ALTERADO para aceitar uma imagem
app.post('/api/veiculos', upload.single('imagem'), async (req, res) => {
    const { modelo, marca, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel } = req.body;
    
    // NOVO: Pega o caminho do arquivo, se ele foi enviado
    const imageUrl = req.file ? `/uploads/vehicles/${req.file.filename}` : null;

    try {
        let marcaId;
        const [marcas] = await pool.query('SELECT id_marca FROM marcas WHERE nome = ?', [marca]);
        if (marcas.length > 0) {
            marcaId = marcas[0].id_marca;
        } else {
            const [novaMarca] = await pool.query('INSERT INTO marcas (nome) VALUES (?)', [marca]);
            marcaId = novaMarca.insertId;
        }
        
        const sql = `
            INSERT INTO veiculos (modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel, imagem_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const [result] = await pool.query(sql, [modelo, marcaId, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel, imageUrl]);
        
        res.status(201).json({ id: result.insertId, message: 'Veículo criado com sucesso!' });
    } catch (err) {
        console.error("Erro ao criar veículo:", err.message);
        res.status(500).json({ error: 'Erro interno ao criar o veículo.' });
    }
});

// ATUALIZAR VEÍCULO - ALTERADO para aceitar uma imagem
app.put('/api/veiculos/:id', upload.single('imagem'), async (req, res) => {
    const { id } = req.params;
    const { modelo, marca, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel } = req.body;
    
    // NOVO: Se uma nova imagem for enviada, `req.file` existirá.
    const imageUrl = req.file ? `/uploads/vehicles/${req.file.filename}` : req.body.imagem_url_existente;

    try {
        let marcaId;
        // ... (lógica da marca sem alteração) ...
        const [marcas] = await pool.query('SELECT id_marca FROM marcas WHERE nome = ?', [marca]);
        if (marcas.length > 0) {
            marcaId = marcas[0].id_marca;
        } else {
            const [novaMarca] = await pool.query('INSERT INTO marcas (nome) VALUES (?)', [marca]);
            marcaId = novaMarca.insertId;
        }

        const sql = `
            UPDATE veiculos SET 
                modelo = ?, id_marca_fk = ?, id_categoria_fk = ?, ano = ?, cor = ?, preco = ?, 
                km = ?, motor = ?, descricao = ?, disponivel = ?, imagem_url = ?
            WHERE id_veiculo = ?;
        `;
        await pool.query(sql, [modelo, marcaId, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel, imageUrl, id]);
        
        res.status(200).json({ message: 'Veículo atualizado com sucesso!' });
    } catch (err) {
        console.error("Erro ao atualizar veículo:", err.message);
        res.status(500).json({ error: 'Erro interno ao atualizar o veículo.' });
    }
});

// DELETAR UM VEÍCULO (DELETE)
app.delete('/api/veiculos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'DELETE FROM veiculos WHERE id_veiculo = ?;';
        const [result] = await pool.query(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Veículo não encontrado para deletar.' });
        }
        
        res.status(204).send(); // 204 No Content é a resposta padrão para sucesso em DELETE
    } catch (err) {
        console.error("Erro ao deletar veículo:", err.message);
        res.status(500).json({ error: 'Erro interno ao deletar o veículo.' });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORTA_SERVIDOR, () => {
    console.log(`[SERVIDOR] Servidor rodando em: http://localhost:${PORTA_SERVIDOR}`);
});