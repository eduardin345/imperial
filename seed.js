import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

function parsePrice(priceString) {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    return parseFloat(priceString.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
}

function parseKm(kmString) {
    if (!kmString) return 0;
    if (typeof kmString === 'number') return kmString;
    return parseInt(kmString.replace(/\D/g, ''));
}

async function seedDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'imperial_db',
        });
        console.log("✅ Conectado ao banco de dados MySQL.");

        // ==========================================
        // 1. LIMPEZA TOTAL (RESET)
        // ==========================================
        console.log("🔥 Recriando estrutura do banco de dados...");
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Apaga tabelas antigas para evitar erros de coluna
        await connection.query('DROP TABLE IF EXISTS imagens_veiculos');
        await connection.query('DROP TABLE IF EXISTS veiculos');
        await connection.query('DROP TABLE IF EXISTS categorias');
        await connection.query('DROP TABLE IF EXISTS marcas');

        // ==========================================
        // 2. CRIAÇÃO DAS TABELAS (CORRIGIDO)
        // ==========================================
        
        await connection.query(`
            CREATE TABLE marcas (
                id_marca INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL UNIQUE
            )
        `);

        await connection.query(`
            CREATE TABLE categorias (
                id_categoria INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                url_amigavel VARCHAR(100) NOT NULL UNIQUE
            )
        `);

        await connection.query(`
            CREATE TABLE veiculos (
                id_veiculo INT AUTO_INCREMENT PRIMARY KEY,
                modelo VARCHAR(255) NOT NULL,
                id_marca_fk INT NOT NULL,
                id_categoria_fk INT NOT NULL,
                ano INT,
                cor VARCHAR(50),
                preco DECIMAL(15,2),
                km INT,
                motor VARCHAR(100),
                descricao TEXT,
                disponivel BOOLEAN DEFAULT TRUE,
                imagem_url TEXT, -- TEXT aceita links longos da internet
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_marca_fk) REFERENCES marcas(id_marca),
                FOREIGN KEY (id_categoria_fk) REFERENCES categorias(id_categoria)
            )
        `);

        await connection.query(`
            CREATE TABLE imagens_veiculos (
                id_imagem INT AUTO_INCREMENT PRIMARY KEY,
                id_veiculo_fk INT NOT NULL,
                url_imagem TEXT NOT NULL,
                imagem_principal BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (id_veiculo_fk) REFERENCES veiculos(id_veiculo) ON DELETE CASCADE
            )
        `);
        
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("🏗️ Tabelas recriadas com sucesso!");


        // ==========================================
        // 3. INSERÇÃO DOS DADOS (JSON)
        // ==========================================
        const jsonData = await fs.readFile('./carros.json', 'utf-8');
        const veiculos = JSON.parse(jsonData);

        // A. Inserir Marcas
        const brandNames = [...new Set(veiculos.map(v => v.marca).filter(Boolean))];
        const brandMap = new Map();
        console.log("\n🌱 Inserindo marcas...");
        for (const name of brandNames) {
            const [rows] = await connection.query('INSERT INTO marcas (nome) VALUES (?)', [name]);
            brandMap.set(name, rows.insertId);
        }

        // B. Inserir Categorias
        const categorySlugs = [...new Set(veiculos.map(v => v.categoria).filter(Boolean))];
        const categoryMap = new Map();
        console.log("\n🌱 Inserindo categorias...");
        for (const slug of categorySlugs) {
            const name = slug.charAt(0).toUpperCase() + slug.slice(1);
            const [rows] = await connection.query('INSERT INTO categorias (nome, url_amigavel) VALUES (?, ?)', [name, slug]);
            categoryMap.set(slug, rows.insertId);
        }

        // C. Inserir Veículos
        console.log("\n🚗 Inserindo veículos...");
        for (const veiculo of veiculos) {
            const brandId = brandMap.get(veiculo.marca);
            const categoryId = categoryMap.get(veiculo.categoria);

            if (!brandId || !categoryId) continue;

            const [result] = await connection.query(
                `INSERT INTO veiculos (modelo, id_marca_fk, id_categoria_fk, ano, preco, km, motor, cor, descricao, disponivel, imagem_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    veiculo.modelo, 
                    brandId, 
                    categoryId, 
                    veiculo.ano, 
                    parsePrice(veiculo.preco), 
                    parseKm(veiculo.km), 
                    veiculo.motor, 
                    veiculo.cor, 
                    veiculo.descricao, 
                    1, 
                    veiculo.imagem
                ]
            );
        }

        console.log("🎉 TUDO PRONTO! Banco atualizado e populado.");

    } catch (error) {
        console.error("\n❌ ERRO FATAL:", error.message);
    } finally {
        if (connection) await connection.end();
    }
}

seedDatabase();