import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

// 1. CONFIGURAÇÕES INICIAIS
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002; // Porta do servidor (Front deve chamar 3002)

// Configuração de diretórios para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares Globais
app.use(cors()); // Permite acesso do Frontend
app.use(express.json()); // Permite ler JSON no corpo da requisição

// Configuração de Pastas Estáticas (Imagens)
// Permite que http://localhost:3002/uploads/vehicles/foto.jpg funcione
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 2. CONEXÃO COM BANCO DE DADOS
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME || 'imperial_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Teste de conexão ao iniciar
pool.getConnection()
    .then(conn => {
        console.log('✅ Banco de Dados: Conectado com sucesso!');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Banco de Dados: Falha na conexão.', err.message);
    });

// 3. SISTEMA DE UPLOAD (MULTER)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Assegure-se de que a pasta public/uploads/vehicles existe
        cb(null, 'public/uploads/vehicles/'); 
    },
    filename: (req, file, cb) => {
        // Nome único: campo + timestamp + numero random + extensão
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 4. MIDDLEWARES DE SEGURANÇA

// Verifica se é Admin (Para rotas de criar/editar/apagar)
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: 'Acesso negado.' });

    jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao', (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Sessão inválida ou expirada.' });
        
        // Verifica se o usuário tem a permissão 'admin' no banco
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso restrito a administradores.' });
        }
        
        req.user = decoded;
        next();
    });
};

// ========================================================
// ===                 ROTAS DA API                     ===
// ========================================================

/* --- 5. AUTENTICAÇÃO (LOGIN E REGISTRO) --- */

app.post('/api/auth/registrar', async (req, res) => {
    const { nome_completo, email, senha } = req.body;
    try {
        const [exists] = await pool.query('SELECT email FROM usuarios WHERE email = ?', [email]);
        if (exists.length > 0) return res.status(400).json({ error: 'Email já cadastrado.' });

        const hash = await bcrypt.hash(senha, 10);
        // Define 'role' como 'user' por padrão para segurança. Mude no banco para 'admin' manualmente.
        await pool.query('INSERT INTO usuarios (nome_completo, email, senha, role) VALUES (?, ?, ?, ?)', 
            [nome_completo, email, hash, 'user']);
            
        res.status(201).json({ message: 'Conta criada com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Email ou senha inválidos.' });

        const usuario = users[0];
        // 'senha' no DB pode estar como 'senha_hash' ou 'senha'. Verifique seu DB. Aqui uso 'senha' baseado no seed.
        const senhaCol = usuario.senha || usuario.senha_hash; 
        const match = await bcrypt.compare(senha, senhaCol);

        if (!match) return res.status(401).json({ error: 'Email ou senha inválidos.' });

        // Gera token incluindo a role (importante para o front)
        const token = jwt.sign(
            { id: usuario.id_usuario, email: usuario.email, role: usuario.role },
            process.env.JWT_SECRET || 'chave_secreta_padrao',
            { expiresIn: '8h' }
        );

        res.json({ 
            message: 'Bem-vindo!', 
            token, 
            role: usuario.role, // Envia para o JS saber se redireciona pro admin
            usuario: { nome: usuario.nome_completo }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno no login.' });
    }
});

/* --- 6. DADOS PÚBLICOS (PARA O SITE FUNCIONAR) --- */

// Dropdowns de Marcas e Categorias
app.get('/api/marcas', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM marcas ORDER BY nome');
    res.json(rows);
});
app.get('/api/categorias', async (req, res) => {
    const [rows] = await pool.query('SELECT id_categoria, nome AS nome_categoria FROM categorias ORDER BY nome');
    res.json(rows);
});

// LISTAR CARROS (PÚBLICO)
// O cliente precisa ver os carros para comprar, não pode ter 'verifyAdmin' aqui
app.get('/api/veiculos', async (req, res) => {
    try {
        const sql = `
            SELECT v.*, m.nome AS nome_marca, c.nome AS nome_categoria 
            FROM veiculos v
            LEFT JOIN marcas m ON v.id_marca_fk = m.id_marca
            LEFT JOIN categorias c ON v.id_categoria_fk = c.id_categoria
            ORDER BY v.id_veiculo DESC
        `;
        const [rows] = await pool.query(sql);
        
        // Tratamento de dados para o Front
        const formatados = rows.map(v => ({
            ...v,
            imagem: v.imagem_url ? v.imagem_url : null,
            preco: Number(v.preco),
            ano: Number(v.ano),
            disponivel: v.disponivel === 1
        }));
        
        res.json(formatados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar catálogo.' });
    }
});

// DETALHES DE UM CARRO (PÚBLICO)
app.get('/api/veiculos/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM veiculos WHERE id_veiculo = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

/* --- 7. DADOS PRIVADOS (ADMINISTRAÇÃO - CRUD) --- */
// Estas rotas exigem Token + Role 'admin'

// ADICIONAR VEÍCULO
app.post('/api/veiculos', verifyAdmin, upload.single('imagem'), async (req, res) => {
    const { modelo, marca, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel } = req.body;
    const imageUrl = req.file ? `/uploads/vehicles/${req.file.filename}` : null;

    try {
        // Marca Inteligente (Busca ID ou Cria Nova)
        let marcaId;
        const [marcas] = await pool.query('SELECT id_marca FROM marcas WHERE nome = ?', [marca]);
        if (marcas.length > 0) {
            marcaId = marcas[0].id_marca;
        } else {
            const [nova] = await pool.query('INSERT INTO marcas (nome) VALUES (?)', [marca]);
            marcaId = nova.insertId;
        }

        await pool.query(
            `INSERT INTO veiculos (modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel, imagem_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [modelo, marcaId, id_categoria_fk || null, ano, cor, preco, km, motor, descricao, (disponivel === 'true' || disponivel === true) ? 1 : 0, imageUrl]
        );
        
        res.status(201).json({ message: 'Veículo criado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar veículo.' });
    }
});

// EDITAR VEÍCULO
app.put('/api/veiculos/:id', verifyAdmin, upload.single('imagem'), async (req, res) => {
    const { id } = req.params;
    const { modelo, marca, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel } = req.body;
    
    // Lógica da Imagem: Nova (upload) ou Antiga (hidden field)
    const imageUrl = req.file ? `/uploads/vehicles/${req.file.filename}` : req.body.imagem_url_existente;

    try {
        let marcaId;
        const [marcas] = await pool.query('SELECT id_marca FROM marcas WHERE nome = ?', [marca]);
        if (marcas.length > 0) { marcaId = marcas[0].id_marca; }
        else { const [nova] = await pool.query('INSERT INTO marcas (nome) VALUES (?)', [marca]); marcaId = nova.insertId; }

        await pool.query(
            `UPDATE veiculos SET modelo=?, id_marca_fk=?, id_categoria_fk=?, ano=?, cor=?, preco=?, km=?, motor=?, descricao=?, disponivel=?, imagem_url=? 
             WHERE id_veiculo=?`,
            [modelo, marcaId, id_categoria_fk || null, ano, cor, preco, km, motor, descricao, (disponivel === 'true' || disponivel === true) ? 1 : 0, imageUrl, id]
        );
        
        res.json({ message: 'Veículo atualizado!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar veículo.' });
    }
});

// REMOVER VEÍCULO
app.delete('/api/veiculos/:id', verifyAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM veiculos WHERE id_veiculo = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Não encontrado.' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir.' });
    }
});

// 8. START
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 [SERVIDOR] Online: http://localhost:${PORT}`);
    console.log(`🔧 [MODO] CRUD protegido para Admins`);
    console.log(`🌍 [SITE] Catálogo liberado para público`);
    console.log(`=============================================`);
});