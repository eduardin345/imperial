// server.js (VERSÃO FINAL E COMPLETA - SERVIDOR DA API)

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Importa as futuras ferramentas de segurança (já deixamos preparado)
// ATENÇÃO: Essas linhas darão erro se você não tiver rodado 'npm install bcryptjs jsonwebtoken'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

// ---- CONFIGURAÇÃO DA CONEXÃO ----
// Este bloco se conecta ao seu banco de dados MySQL usando as credenciais do arquivo .env
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
const PORTA_SERVIDOR = process.env.PORT || 3002;

// --- MIDDLEWARES ---
// Configurações essenciais para a API funcionar corretamente
app.use(cors()); // Permite que o frontend acesse a API
app.use(express.json()); // Permite que a API entenda o formato JSON

// --- ROTAS PÚBLICAS DA API (DADOS PARA O SITE) ---

// ROTA DE TESTE - Para verificar se o servidor está online
app.get('/', (req, res) => {
    res.status(200).send('<h1>API da Concessionária IMPERIAL está no ar!</h1><p>Acesse rotas como /api/veiculos para ver os dados.</p>');
});

// ROTA PARA LISTAR MARCAS
app.get('/api/marcas', async (req, res) => {
    try {
        const sql = "SELECT id_marca AS id, nome AS nome_marca FROM marcas ORDER BY nome ASC";
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        console.error("[SERVIDOR] Erro ao buscar marcas:", err.message);
        res.status(500).json({ error: 'Erro ao buscar marcas.' });
    }
});

// ROTA PARA LISTAR CATEGORIAS
app.get('/api/categorias', async (req, res) => {
    try {
        const sql = "SELECT id_categoria AS id, nome AS nome_categoria, url_amigavel AS slug_categoria FROM categorias ORDER BY nome ASC";
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        console.error("[SERVIDOR] Erro ao buscar categorias:", err.message);
        res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
});

// ROTA PRINCIPAL PARA LISTAR VEÍCULOS
app.get('/api/veiculos', async (req, res) => {
    try {
        const sql = `
            SELECT 
                v.id_veiculo AS id, v.modelo, v.ano, v.preco, v.km, v.motor, v.cor, v.descricao,
                m.nome AS marca, 
                c.url_amigavel AS categoria, 
                (SELECT img.url_imagem 
                 FROM imagens_veiculos img 
                 WHERE img.id_veiculo_fk = v.id_veiculo AND img.imagem_principal = 1 
                 LIMIT 1) AS imagem
            FROM veiculos v
            LEFT JOIN marcas m ON v.id_marca_fk = m.id_marca
            LEFT JOIN categorias c ON v.id_categoria_fk = c.id_categoria
            WHERE v.disponivel = 1
            ORDER BY v.preco DESC;
        `;
        const [veiculos] = await pool.query(sql);
        res.json(veiculos);
    } catch (err) {
        console.error("[SERVIDOR] Erro ao buscar todos os veículos:", err.message);
        return res.status(500).json({ error: 'Erro ao buscar veículos.' });
    }
});

// --- ROTAS DE AUTENTICAÇÃO E CRUD (ESTRUTURA PARA O FUTURO) ---
// Estas rotas ainda não fazem nada, mas respondem para não dar erro "404".

app.post('/api/auth/register', async (req, res) => {
    console.log("Tentativa de registro recebida:", req.body);
    res.status(501).json({ message: "Endpoint de registro ainda não implementado." });
});

app.post('/api/auth/login', async (req, res) => {
    console.log("Tentativa de login recebida:", req.body);
    res.status(501).json({ message: "Endpoint de login ainda não implementado." });
});

// --- ROTAS DO CRUD DE VEÍCULOS (ESTRUTURA PARA O FUTURO) ---

app.post('/api/veiculos', async (req, res) => {
    console.log("Recebida requisição para CRIAR veículo:", req.body);
    res.status(501).json({ message: "Endpoint de criação de veículo não implementado." });
});

app.put('/api/veiculos/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Recebida requisição para ATUALIZAR veículo ID ${id}:`, req.body);
    res.status(501).json({ message: `Endpoint de atualização para veículo ${id} não implementado.` });
});

app.delete('/api/veiculos/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Recebida requisição para DELETAR veículo ID ${id}`);
    res.status(501).json({ message: `Endpoint de deleção para veículo ${id} não implementado.` });
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
// Este é o comando que efetivamente "liga" a API
app.listen(PORTA_SERVIDOR, () => {
    console.log(`[SERVIDOR] Servidor rodando em: http://localhost:${PORTA_SERVIDOR}`);
});