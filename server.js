// server.js (VERSÃO FINAL COMPLETA)

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ---- CONFIGURAÇÃO DA CONEXÃO ----
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'IFPR',
    database: process.env.DB_NAME || 'imperial1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const app = express();
const PORTA_SERVIDOR = process.env.PORT || 3002;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
// Essencial para o navegador encontrar suas imagens na pasta `public`
app.use(express.static('public'));

// --- ROTAS DA API ---

// ROTA PARA LISTAR MARCAS
app.get('/api/marcas', async (req, res) => {
    try {
        const sql = "SELECT id, name AS nome_marca FROM brands ORDER BY name ASC";
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
        const sql = "SELECT id, name AS nome_categoria, slug AS slug_categoria FROM categories ORDER BY name ASC";
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        console.error("[SERVIDOR] Erro ao buscar categorias:", err.message);
        res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
});

// ROTA PRINCIPAL (PÁGINA COMPRAR, CRUD, FINANCIAMENTO)
app.get('/api/veiculos', async (req, res) => {
    try {
        // Renomeamos as colunas no SQL para corresponder ao que o frontend antigo esperava
        const sql = `
            SELECT 
                v.id AS id,
                v.model AS modelo,
                v.year AS ano,
                v.price AS preco,
                b.name AS marca, 
                c.slug AS categoria, 
                (SELECT img.image_url 
                 FROM vehicle_images img 
                 WHERE img.vehicle_id = v.id AND img.is_main = 1 
                 LIMIT 1) AS imagem
            FROM vehicles v
            LEFT JOIN brands b ON v.brand_id = b.id
            LEFT JOIN categories c ON v.category_id = c.id
            WHERE v.is_available = 1
            ORDER BY v.price DESC;
        `;
        const [veiculos] = await pool.query(sql);
        res.json(veiculos);
    } catch (err) {
        console.error("[SERVIDOR] Erro ao buscar todos os veículos:", err.message);
        return res.status(500).json({ error: 'Erro ao buscar veículos.' });
    }
});

// ... Suas outras rotas de CRUD podem vir aqui se precisar delas.

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORTA_SERVIDOR, () => {
    console.log(`[SERVIDOR] Servidor rodando em: http://localhost:${PORTA_SERVIDOR}`);
});