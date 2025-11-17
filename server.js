// server.js (VERSÃO FINAL E FUNCIONAL COM CRUD COMPLETO)

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ---- CONFIGURAÇÃO DA CONEXÃO ----
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const app = express();
const PORTA_SERVIDOR = process.env.PORT || 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- ROTAS PÚBLICAS (Leitura de Dados) ---

app.get('/api/categorias', async (req, res) => {
    try {
        const sql = "SELECT id_categoria, nome AS nome_categoria FROM categorias ORDER BY nome ASC";
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
});

// LISTAR TODOS OS VEÍCULOS (para o site e a tabela do CRUD)
app.get('/api/veiculos', async (req, res) => {
    try {
        const sql = `
            SELECT 
                v.*, m.nome AS nome_marca, c.nome AS nome_categoria
            FROM veiculos v
            LEFT JOIN marcas m ON v.id_marca_fk = m.id_marca
            LEFT JOIN categorias c ON v.id_categoria_fk = c.id_categoria
            ORDER BY v.id_veiculo DESC;
        `;
        const [veiculos] = await pool.query(sql);
        res.json(veiculos);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar veículos.' });
    }
});

// BUSCAR UM VEÍCULO ESPECÍFICO (para o botão de editar)
app.get('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                v.*, m.nome AS nome_marca, c.nome AS nome_categoria
            FROM veiculos v
            LEFT JOIN marcas m ON v.id_marca_fk = m.id_marca
            LEFT JOIN categorias c ON v.id_categoria_fk = c.id_categoria
            WHERE v.id_veiculo = ?;
        `;
        const [rows] = await pool.query(sql, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar o veículo.' });
    }
});


// --- ROTAS DO CRUD (Ações de Escrita) ---

// CRIAR UM NOVO VEÍCULO (POST)
app.post('/api/veiculos', async (req, res) => {
    const { modelo, marca, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel } = req.body;

    try {
        // Lógica para encontrar ou criar a marca
        let marcaId;
        const [marcas] = await pool.query('SELECT id_marca FROM marcas WHERE nome = ?', [marca]);
        if (marcas.length > 0) {
            marcaId = marcas[0].id_marca;
        } else {
            const [novaMarca] = await pool.query('INSERT INTO marcas (nome) VALUES (?)', [marca]);
            marcaId = novaMarca.insertId;
        }
        
        const sql = `
            INSERT INTO veiculos (modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const [result] = await pool.query(sql, [modelo, marcaId, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel]);
        
        res.status(201).json({ id: result.insertId, message: 'Veículo criado com sucesso!' });
    } catch (err) {
        console.error("Erro ao criar veículo:", err.message);
        res.status(500).json({ error: 'Erro interno ao criar o veículo.' });
    }
});

// ATUALIZAR UM VEÍCULO (PUT)
app.put('/api/veiculos/:id', async (req, res) => {
    const { id } = req.params;
    const { modelo, marca, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel } = req.body;

    try {
        // Lógica para encontrar ou criar a marca
        let marcaId;
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
                km = ?, motor = ?, descricao = ?, disponivel = ?
            WHERE id_veiculo = ?;
        `;
        await pool.query(sql, [modelo, marcaId, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel, id]);
        
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