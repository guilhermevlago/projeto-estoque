-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS contro_estoque
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Seleciona o banco
USE contro_estoque;

-- Tabela: usuario
CREATE TABLE `usuario` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `perfil` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: localizacao
CREATE TABLE `localizacao` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(100) NOT NULL,
  `descricao` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: produto
CREATE TABLE `produto` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marca` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preco_venda` decimal(10,2) DEFAULT NULL,
  `estoque_minimo` int DEFAULT NULL,
  `eh_kit` tinyint(1) DEFAULT NULL,
  `quantidade_por_kit` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: estoque_local
CREATE TABLE `estoque_local` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `produto_id` BIGINT NOT NULL,
  `localizacao_id` INT NOT NULL,
  `quantidade` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`produto_id`) REFERENCES `produto`(`id`),
  FOREIGN KEY (`localizacao_id`) REFERENCES `localizacao`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: movimentacao
CREATE TABLE `movimentacao` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `produto_id` bigint NOT NULL,
  `tipo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade` int NOT NULL,
  `responsavel_id` bigint NOT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localizacao_id` int DEFAULT NULL,
  `sku_anterior` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nome_anterior` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao_anterior` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria_anterior` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marca_anterior` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preco_venda_anterior` decimal(10,2) DEFAULT NULL,
  `estoque_minimo_anterior` int DEFAULT NULL,
  `eh_kit_anterior` tinyint(1) DEFAULT NULL,
  `quantidade_por_kit_anterior` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_movimentacao_produto` (`produto_id`),
  KEY `fk_movimentacao_responsavel` (`responsavel_id`),
  KEY `fk_movimentacao_localizacao` (`localizacao_id`),
  CONSTRAINT `fk_movimentacao_produto` FOREIGN KEY (`produto_id`) REFERENCES `produto` (`id`),
  CONSTRAINT `fk_movimentacao_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_movimentacao_localizacao` FOREIGN KEY (`localizacao_id`) REFERENCES `localizacao` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
