-- Migração inicial: criação das tabelas do SM Pinturas

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS tb_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL DEFAULT 'ENCARREGADO',
    deletado BOOLEAN NOT NULL DEFAULT FALSE,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
    "atualizadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS tb_clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    "cpfCnpj" VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(200),
    endereco VARCHAR(300),
    deletado BOOLEAN NOT NULL DEFAULT FALSE,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
    "atualizadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de obras
CREATE TABLE IF NOT EXISTS tb_obras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao VARCHAR(200) NOT NULL,
    endereco VARCHAR(300),
    "dataInicio" DATE,
    "dataPrevisaoFim" DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'EM_ANDAMENTO',
    cliente_id UUID REFERENCES tb_clientes(id),
    "clienteId" UUID,
    deletado BOOLEAN NOT NULL DEFAULT FALSE,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
    "atualizadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de colaboradores
CREATE TABLE IF NOT EXISTS tb_colaboradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(20),
    telefone VARCHAR(20),
    perfil VARCHAR(20) NOT NULL DEFAULT 'ENCARREGADO',
    deletado BOOLEAN NOT NULL DEFAULT FALSE,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
    "atualizadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de catálogo de serviços (usa serial int como PK)
CREATE TABLE IF NOT EXISTS tb_servicos_catalogo (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(200) NOT NULL,
    unidade VARCHAR(50),
    "precoCusto" DECIMAL(10,2),
    "precoVenda" DECIMAL(10,2),
    deletado BOOLEAN NOT NULL DEFAULT FALSE,
    "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
    "atualizadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
);
