-- PASSO 1: APAGA E CRIA O BANCO DE DADOS PARA COMEÇAR DO ZERO
DROP SCHEMA IF EXISTS `imperial1`;
CREATE SCHEMA `imperial1`;
USE `imperial1`;

-- PASSO 2: CRIA AS TABELAS QUE NÃO DEPENDEM DE NINGUÉM
CREATE TABLE `brands` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`id`)
);

-- PASSO 3: CRIA A TABELA `vehicles` (AGORA VAI FUNCIONAR)
CREATE TABLE `vehicles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `model` VARCHAR(100) NOT NULL,
  `year` SMALLINT UNSIGNED NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `is_available` TINYINT NOT NULL DEFAULT 1, -- Removido o "(1)" para não dar o aviso
  `brand_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_vehicle_brand`
    FOREIGN KEY (`brand_id`)
    REFERENCES `brands` (`id`),
  CONSTRAINT `fk_vehicle_category`
    FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`)
);

-- PASSO 4: CRIA A TABELA `vehicle_images` (AGORA VAI FUNCIONAR)
CREATE TABLE `vehicle_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `vehicle_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `is_main` TINYINT NOT NULL DEFAULT 0, -- Removido o "(1)" para não dar o aviso
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_image_vehicle`
    FOREIGN KEY (`vehicle_id`)
    REFERENCES `vehicles` (`id`)
    ON DELETE CASCADE
);

-- PASSO 5: CRIA A TABELA DE USUÁRIOS
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
);

