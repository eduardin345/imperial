CREATE SCHEMA IF NOT EXISTS `imperial` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Define o banco de dados recém-criado como o padrão para os comandos seguintes.
USE `imperial`;

-- Tabela para armazenar as marcas dos veículos (ex: Ford, BMW).
CREATE TABLE `marcas` (
  `id_marca` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`id_marca`)
);

-- Tabela para as categorias (ex: Esportivos, SUVs).
CREATE TABLE `categorias` (
  `id_categoria` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(80) NOT NULL,
  `url_amigavel` VARCHAR(80) NOT NULL COMMENT 'Armazena a versão do nome para ser usada em links (URLs), melhorando o SEO.',
  PRIMARY KEY (`id_categoria`)
);

-- Tabela para os usuários do sistema.
CREATE TABLE `usuarios` (
  `id_usuario` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome_completo` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `senha_hash` VARCHAR(255) NOT NULL COMMENT 'IMPORTANTE: Nunca salve a senha pura aqui. Salve sempre a versão criptografada (hash).',
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `email_UNICO` (`email` ASC)
);

-- Tabela principal, com os dados de cada veículo.
CREATE TABLE `veiculos` (
  `id_veiculo` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `modelo` VARCHAR(100) NOT NULL,
  `ano` SMALLINT UNSIGNED NULL,
  `condicao` TINYINT NOT NULL DEFAULT 0 COMMENT 'Define a condição do veículo: 0 = Novo, 1 = Usado.',
  `preco` DECIMAL(12, 2) NOT NULL,
  `disponivel` TINYINT NOT NULL DEFAULT 1 COMMENT 'Define se o veículo está disponível para venda: 1 = Sim, 0 = Não.',
  `id_marca_fk` INT UNSIGNED NOT NULL,
  `id_categoria_fk` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_veiculo`),
  CONSTRAINT `fk_veiculo_marca` FOREIGN KEY (`id_marca_fk`) REFERENCES `marcas` (`id_marca`),
  CONSTRAINT `fk_veiculo_categoria` FOREIGN KEY (`id_categoria_fk`) REFERENCES `categorias` (`id_categoria`)
);

-- Tabela para a galeria de fotos de cada veículo.
CREATE TABLE `imagens_veiculos` (
  `id_imagem` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `url_imagem` VARCHAR(255) NOT NULL,
  `imagem_principal` TINYINT NOT NULL DEFAULT 0 COMMENT 'Define a imagem de capa do veículo: 1 = Sim, 0 = Não.',
  `id_veiculo_fk` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_imagem`),
  CONSTRAINT `fk_imagem_veiculo` FOREIGN KEY (`id_veiculo_fk`) REFERENCES `veiculos` (`id_veiculo`)
  -- O comando "ON DELETE CASCADE" é uma automação muito útil.
  -- Se um veículo for deletado da tabela 'veiculos', todas as imagens
  -- associadas a ele nesta tabela serão apagadas automaticamente.
  ON DELETE CASCADE
);


-- DADOS DE EXEMPLO PARA TESTES --
-- Inserir alguns dados ajuda a verificar se a estrutura está correta e facilita os testes iniciais do site.

INSERT INTO `marcas` (`nome`) VALUES ('Lamborghini'), ('BMW'), ('Ford');
INSERT INTO `categorias` (`nome`, `url_amigavel`) VALUES ('Esportivos', 'esportivos'), ('SUVs', 'suvs');

-- Aqui usamos os valores 0 (Novo) e 1 (Usado) para a coluna 'condicao'.
INSERT INTO `veiculos` (`modelo`, `ano`, `condicao`, `preco`, `id_marca_fk`, `id_categoria_fk`) VALUES
('Huracan EVO', 2023, 0, 3500000.00, 1, 1),
('X6', 2020, 1, 650000.00, 2, 2);