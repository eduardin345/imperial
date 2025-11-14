// seed.js (VERSÃO FINAL COMPLETA - Importa todos os dados)

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

// Funções auxiliares
function parsePrice(priceString) {
    if (!priceString || typeof priceString !== 'string') return 0;
    return parseFloat(priceString.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
}

function parseKm(kmString) {
    if (!kmString || typeof kmString !== 'string') return 0;
    return parseInt(kmString.replace(/\D/g, '')); // Remove " KM" e "."
}

async function seedDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST, user: process.env.DB_USER,
            password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
        });
        console.log("✅ Conectado ao banco de dados MySQL.");

        // Limpa as tabelas antes de inserir para evitar duplicatas
        console.log("\n🧹 Limpando tabelas antigas...");
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
        await connection.execute('TRUNCATE TABLE imagens_veiculos;');
        await connection.execute('TRUNCATE TABLE veiculos;');
        await connection.execute('TRUNCATE TABLE categorias;');
        await connection.execute('TRUNCATE TABLE marcas;');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
        console.log("👍 Tabelas limpas.");

        const jsonData = await fs.readFile('./carros.json', 'utf-8');
        const veiculos = JSON.parse(jsonData);

        // Inserir Marcas
        const brandNames = [...new Set(veiculos.map(v => v.marca).filter(Boolean))];
        const brandMap = new Map();
        console.log("\n🌱 Inserindo marcas...");
        for (const name of brandNames) {
            await connection.execute('INSERT IGNORE INTO marcas (nome) VALUES (?)', [name]);
            const [rows] = await connection.execute('SELECT id_marca FROM marcas WHERE nome = ?', [name]);
            brandMap.set(name, rows[0].id_marca);
        }
        console.log(`👍 Marcas inseridas: ${brandMap.size}`);

        // Inserir Categorias
        const categorySlugs = [...new Set(veiculos.map(v => v.categoria).filter(Boolean))];
        const categoryMap = new Map();
        console.log("\n🌱 Inserindo categorias...");
        for (const slug of categorySlugs) {
            const name = slug.charAt(0).toUpperCase() + slug.slice(1);
            await connection.execute('INSERT IGNORE INTO categorias (nome, url_amigavel) VALUES (?, ?)', [name, slug]);
            const [rows] = await connection.execute('SELECT id_categoria FROM categorias WHERE url_amigavel = ?', [slug]);
            categoryMap.set(slug, rows[0].id_categoria);
        }
        console.log(`👍 Categorias inseridas: ${categoryMap.size}`);

        // Inserir Veículos com todos os detalhes
        console.log("\n🚗 Inserindo veículos e imagens...");
        for (const veiculo of veiculos) {
            const brandId = brandMap.get(veiculo.marca);
            if (!brandId) { console.warn(`⚠️ Marca "${veiculo.marca}" não encontrada. Pulando veículo.`); continue; }

            const categoryId = categoryMap.get(veiculo.categoria);
            if (!categoryId) { console.warn(`⚠️ Categoria "${veiculo.categoria}" não encontrada. Pulando veículo.`); continue; }

            const [vehicleResult] = await connection.execute(
                `INSERT INTO veiculos (modelo, ano, preco, condicao, km, motor, cor, descricao, id_marca_fk, id_categoria_fk) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    veiculo.modelo, veiculo.ano, parsePrice(veiculo.preco),
                    parseKm(veiculo.km) > 0 ? 1 : 0, // Condição: 1=Usado, 0=Novo
                    parseKm(veiculo.km), veiculo.motor, veiculo.cor, veiculo.descricao,
                    brandId, categoryId
                ]
            );
            const newVehicleId = vehicleResult.insertId;

            if (veiculo.imagem) {
                await connection.execute(
                    'INSERT INTO imagens_veiculos (id_veiculo_fk, url_imagem, imagem_principal) VALUES (?, ?, ?)',
                    [newVehicleId, veiculo.imagem, true]
                );
            }
        }
        console.log(`👍 Veículos inseridos: ${veiculos.length}`);
        console.log("\n🎉 Processo de seeding concluído com sucesso!");

    } catch (error) {
        console.error("\n❌ ERRO DURANTE O PROCESSO DE SEEDING:", error);
    } finally {
        if (connection) {
            await connection.end();
            console.log("\n🔌 Conexão com o banco de dados fechada.");
        }
    }
}

seedDatabase();