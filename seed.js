import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

function parsePrice(priceString) {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    return parseFloat(priceString.toString().replace(/[^0-9,]/g, '').replace(',', '.'));
}

function parseKm(kmString) {
    if (!kmString) return 0;
    if (typeof kmString === 'number') return kmString;
    return parseInt(kmString.toString().replace(/\D/g, ''));
}

async function seedDatabase() {
    let connection;
    try {
        // Conecta direto na raiz para poder apagar o banco se precisar
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
        });
        
        const dbName = process.env.DB_NAME || 'imperial_db';

        console.log(`💣 MODO DESTRUIDOR: Resetando banco '${dbName}'...`);
        
        // 1. Destruir e recriar o Banco
        await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
        await connection.query(`CREATE DATABASE ${dbName}`);
        await connection.query(`USE ${dbName}`);
        
        console.log("✅ Banco recriado. Criando tabelas blindadas...");

        // 2. Criar tabelas (usando LONGTEXT para links gigantes)
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
                imagem_url LONGTEXT,  -- AQUI ESTÁ O SEGREDO: LONGTEXT
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_marca_fk) REFERENCES marcas(id_marca),
                FOREIGN KEY (id_categoria_fk) REFERENCES categorias(id_categoria)
            )
        `);
        
        await connection.query(`
            CREATE TABLE usuarios (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                nome_completo VARCHAR(255),
                email VARCHAR(255),
                senha VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user'
            )
        `);

        console.log("🏗️ Tabelas prontas. Lendo dados...");

        // 3. Ler dados do JSON
        const jsonData = await fs.readFile('./carros.json', 'utf-8');
        const veiculos = JSON.parse(jsonData);

        // 4. Inserir Dados
        for (const car of veiculos) {
            // Insere/Pega Marca
            await connection.query('INSERT IGNORE INTO marcas (nome) VALUES (?)', [car.marca]);
            const [mRows] = await connection.query('SELECT id_marca FROM marcas WHERE nome = ?', [car.marca]);
            
            // Insere/Pega Categoria
            const catName = car.categoria.charAt(0).toUpperCase() + car.categoria.slice(1);
            await connection.query('INSERT IGNORE INTO categorias (nome, url_amigavel) VALUES (?, ?)', [catName, car.categoria]);
            const [cRows] = await connection.query('SELECT id_categoria FROM categorias WHERE url_amigavel = ?', [car.categoria]);

            // Insere Carro
            if(mRows[0] && cRows[0]) {
                await connection.query(
                    `INSERT INTO veiculos 
                    (modelo, id_marca_fk, id_categoria_fk, ano, cor, preco, km, motor, descricao, disponivel, imagem_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        car.modelo,
                        mRows[0].id_marca,
                        cRows[0].id_categoria,
                        car.ano,
                        car.cor || '',
                        parsePrice(car.preco),
                        parseKm(car.km),
                        car.motor || '',
                        car.descricao || '',
                        1,
                        car.imagem // Link gigante entra aqui sem cortar
                    ]
                );
            }
        }

        console.log(`🎉 SUCESSO! ${veiculos.length} veículos com fotos carregados!`);

    } catch (error) {
        console.error("❌ ERRO FATAL:", error);
    } finally {
        if (connection) await connection.end();
    }
}

seedDatabase();