// database_setup.js
const sqlite3 = require('sqlite3').verbose();
const dbFile = './imperial_data.db';

const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        return console.error("Erro ao abrir/criar banco de dados:", err.message);
    }
    console.log(`Conectado ao banco de dados SQLite: ${dbFile}`);
    criarTabelasEPopular(); // Mudamos o nome da função
});

function criarTabelasEPopular() { // Nome da função alterado
    db.serialize(() => {
        console.log("Iniciando criação/verificação de tabelas...");

        // --- CRIAÇÃO DAS TABELAS (como antes) ---
        db.run(`
            CREATE TABLE IF NOT EXISTS marcas (
                id_marca INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_marca TEXT NOT NULL UNIQUE,
                logo_url TEXT, /* Adicionei de volta o logo_url, opcional */
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP /* Exemplo de coluna útil */
            )
        `, (err) => {
            if (err) return console.error("Erro Tabela Marcas:", err.message);
            console.log("Tabela 'marcas' OK.");
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS categorias (
                id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_categoria TEXT NOT NULL UNIQUE,
                slug_categoria TEXT NOT NULL UNIQUE, /* Para URLs amigáveis */
                descricao_categoria TEXT /* Opcional */
            )
        `, (err) => {
            if (err) return console.error("Erro Tabela Categorias:", err.message);
            console.log("Tabela 'categorias' OK.");
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS veiculos (
                id_veiculo INTEGER PRIMARY KEY AUTOINCREMENT,
                id_marca_fk INTEGER NOT NULL,
                id_categoria_fk INTEGER NOT NULL,
                modelo TEXT NOT NULL,
                ano INTEGER,
                cor TEXT, /* Adicionei cor, opcional */
                preco REAL,
                descricao TEXT,
                disponivel BOOLEAN DEFAULT TRUE, /* Adicionei disponível */
                data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP, /* Exemplo de coluna útil */
                FOREIGN KEY (id_marca_fk) REFERENCES marcas (id_marca) ON DELETE RESTRICT ON UPDATE CASCADE,
                FOREIGN KEY (id_categoria_fk) REFERENCES categorias (id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `, (err) => {
            if (err) return console.error("Erro Tabela Veiculos:", err.message);
            console.log("Tabela 'veiculos' OK.");
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS imagens_veiculos (
                id_imagem INTEGER PRIMARY KEY AUTOINCREMENT,
                id_veiculo_fk INTEGER NOT NULL,
                url_imagem TEXT NOT NULL,
                imagem_principal BOOLEAN DEFAULT FALSE,
                ordem INTEGER DEFAULT 0, /* Para ordenar imagens */
                FOREIGN KEY (id_veiculo_fk) REFERENCES veiculos (id_veiculo)
                    ON DELETE CASCADE ON UPDATE CASCADE
            )
        `, (err) => {
            if (err) return console.error("Erro Tabela Imagens:", err.message);
            console.log("Tabela 'imagens_veiculos' OK.");
             // Este callback é para a última criação de tabela, agora vamos popular
            popularDadosIniciais();
        });
    });
}


function popularDadosIniciais() {
    console.log("Populando dados iniciais (se necessário)...");

    // --- POPULAR MARCAS ---
    const marcasPadrao = [
        { nome: 'Ford', logo: 'url_logo_ford.png' }, // Adicione URLs reais se tiver
        { nome: 'Chevrolet', logo: null },
        { nome: 'Volkswagen', logo: null },
        { nome: 'Fiat', logo: null },
        { nome: 'Honda', logo: null },
        { nome: 'Toyota', logo: null },
        { nome: 'Hyundai', logo: null },
        { nome: 'BMW', logo: 'url_logo_bmw.png' },
        { nome: 'Mercedes-Benz', logo: null },
        { nome: 'Audi', logo: null },
        { nome: 'Lamborghini', logo: null },
        { nome: 'Ferrari', logo: null },
        { nome: 'Porsche', logo: null }
    ];
    const stmtMarca = db.prepare("INSERT OR IGNORE INTO marcas (nome_marca, logo_url) VALUES (?, ?)");
    for (const marca of marcasPadrao) {
        stmtMarca.run(marca.nome, marca.logo);
    }
    stmtMarca.finalize((err) => { // Finalizar a query preparada
        if(err) return console.error("Erro ao popular marcas:", err.message);
        console.log("Marcas padrão verificadas/inseridas.");
    });


    // --- POPULAR CATEGORIAS ---
    const categoriasPadrao = [
        { nome: 'SUV', slug: 'suvs', descricao: 'Veículos Utilitários Esportivos.' },
        { nome: 'Picape', slug: 'picapes', descricao: 'Caminhonetes para trabalho e lazer.' },
        { nome: 'Esportivo', slug: 'esportivos', descricao: 'Carros com foco em performance e design.' },
        { nome: 'Sedan', slug: 'sedans', descricao: 'Carros de passeio com porta-malas separado.' },
        { nome: 'Hatch', slug: 'hatchs', descricao: 'Carros compactos com porta-malas integrado.' },
        { nome: 'Conversível', slug: 'conversiveis', descricao: 'Carros com teto retrátil.' }
        // Você tinha 'Carro' como categoria genérica antes, decida se mantém ou usa 'Sedan'/'Hatch'
    ];
    const stmtCat = db.prepare("INSERT OR IGNORE INTO categorias (nome_categoria, slug_categoria, descricao_categoria) VALUES (?, ?, ?)");
    for (const cat of categoriasPadrao) {
        stmtCat.run(cat.nome, cat.slug, cat.descricao);
    }
    stmtCat.finalize((err) => {
        if(err) return console.error("Erro ao popular categorias:", err.message);
        console.log("Categorias padrão verificadas/inseridas.");

        // Fechar o banco após todas as operações de setup e população.
        // db.close((closeErr) => {
        //     if (closeErr) return console.error(closeErr.message);
        //     console.log('Conexão com o banco de dados fechada após setup e população.');
        // });
        // Removi o close aqui para o caso de você rodar o server.js logo em seguida
        // Se este script for SOMENTE para setup, pode descomentar o close.
    });

    console.log("Processo de população de dados iniciais concluído.");
}


// --- Não esqueça de recriar o banco de dados se necessário
// --- antes de rodar este script para que as tabelas sejam criadas corretamente.
// --- Ou certifique-se que a lógica IF NOT EXISTS está funcionando como esperado.