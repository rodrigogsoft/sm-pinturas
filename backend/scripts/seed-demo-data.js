const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PASSWORD_HASH = '$2b$12$vPUX3Ju2NOz7792hBVtLQuo6KAoBbEPisn6jq5DX.Xj6A9.f3K9cu'; // Demo@2026

const LEGACY_OBRA_IDS = [
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000004',
];

function deterministicUuid(seed) {
  const hex = crypto.createHash('sha1').update(String(seed)).digest('hex');
  const versioned = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  return versioned;
}

const IDS = {
  perfis: [1, 2, 3, 4],
  users: {
    admin: '10000000-0000-4000-8000-000000000001',
    gestor: '10000000-0000-4000-8000-000000000002',
    financeiro: '10000000-0000-4000-8000-000000000003',
    encarregado1: '10000000-0000-4000-8000-000000000004',
    encarregado2: '10000000-0000-4000-8000-000000000005',
  },
  clientes: [
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000006',
  ],
  colaboradores: [
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000008',
  ],
  obras: [
    '40000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000004',
  ],
  tabelaPrecos: [
    '50000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000005',
    '50000000-0000-4000-8000-000000000006',
    '50000000-0000-4000-8000-000000000007',
    '50000000-0000-4000-8000-000000000008',
  ],
  pavimentos: [
    '60000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000003',
    '60000000-0000-4000-8000-000000000004',
    '60000000-0000-4000-8000-000000000005',
    '60000000-0000-4000-8000-000000000006',
    '60000000-0000-4000-8000-000000000007',
    '60000000-0000-4000-8000-000000000008',
  ],
  ambientes: [
    '70000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000003',
    '70000000-0000-4000-8000-000000000004',
    '70000000-0000-4000-8000-000000000005',
    '70000000-0000-4000-8000-000000000006',
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000008',
    '70000000-0000-4000-8000-000000000009',
    '70000000-0000-4000-8000-000000000010',
    '70000000-0000-4000-8000-000000000011',
    '70000000-0000-4000-8000-000000000012',
  ],
  itens: [
    '80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000002',
    '80000000-0000-4000-8000-000000000003',
    '80000000-0000-4000-8000-000000000004',
    '80000000-0000-4000-8000-000000000005',
    '80000000-0000-4000-8000-000000000006',
    '80000000-0000-4000-8000-000000000007',
    '80000000-0000-4000-8000-000000000008',
    '80000000-0000-4000-8000-000000000009',
    '80000000-0000-4000-8000-000000000010',
    '80000000-0000-4000-8000-000000000011',
    '80000000-0000-4000-8000-000000000012',
  ],
  sessoes: [
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000003',
    '90000000-0000-4000-8000-000000000004',
  ],
  alocacoesItens: [
    '91000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000002',
    '91000000-0000-4000-8000-000000000003',
    '91000000-0000-4000-8000-000000000004',
    '91000000-0000-4000-8000-000000000005',
    '91000000-0000-4000-8000-000000000006',
    '91000000-0000-4000-8000-000000000007',
    '91000000-0000-4000-8000-000000000008',
  ],
  alocacoesTarefa: [
    '91100000-0000-4000-8000-000000000001',
    '91100000-0000-4000-8000-000000000002',
    '91100000-0000-4000-8000-000000000003',
    '91100000-0000-4000-8000-000000000004',
    '91100000-0000-4000-8000-000000000005',
    '91100000-0000-4000-8000-000000000006',
    '91100000-0000-4000-8000-000000000007',
    '91100000-0000-4000-8000-000000000008',
  ],
  medicoesColaborador: [
    '92000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000002',
    '92000000-0000-4000-8000-000000000003',
    '92000000-0000-4000-8000-000000000004',
    '92000000-0000-4000-8000-000000000005',
    '92000000-0000-4000-8000-000000000006',
    '92000000-0000-4000-8000-000000000007',
    '92000000-0000-4000-8000-000000000008',
  ],
  medicoesLegacy: [
    '92100000-0000-4000-8000-000000000001',
    '92100000-0000-4000-8000-000000000002',
    '92100000-0000-4000-8000-000000000003',
    '92100000-0000-4000-8000-000000000004',
    '92100000-0000-4000-8000-000000000005',
    '92100000-0000-4000-8000-000000000006',
    '92100000-0000-4000-8000-000000000007',
    '92100000-0000-4000-8000-000000000008',
  ],
  lotes: {
    aberto: '93000000-0000-4000-8000-000000000001',
    pago: '93000000-0000-4000-8000-000000000002',
  },
  apropriacoes: [
    '94000000-0000-4000-8000-000000000001',
    '94000000-0000-4000-8000-000000000002',
    '94000000-0000-4000-8000-000000000003',
    '94000000-0000-4000-8000-000000000004',
    '94000000-0000-4000-8000-000000000005',
    '94000000-0000-4000-8000-000000000006',
    '94000000-0000-4000-8000-000000000007',
    '94000000-0000-4000-8000-000000000008',
  ],
  notificationEvents: [
    '95000000-0000-4000-8000-000000000001',
    '95000000-0000-4000-8000-000000000002',
    '95000000-0000-4000-8000-000000000003',
    '95000000-0000-4000-8000-000000000004',
  ],
  notificacoes: [
    '96000000-0000-4000-8000-000000000001',
    '96000000-0000-4000-8000-000000000002',
    '96000000-0000-4000-8000-000000000003',
    '96000000-0000-4000-8000-000000000004',
    '96000000-0000-4000-8000-000000000005',
    '96000000-0000-4000-8000-000000000006',
    '96000000-0000-4000-8000-000000000007',
    '96000000-0000-4000-8000-000000000008',
    '96000000-0000-4000-8000-000000000009',
    '96000000-0000-4000-8000-000000000010',
    '96000000-0000-4000-8000-000000000011',
    '96000000-0000-4000-8000-000000000012',
  ],
};

const services = [
  { id: 9001, nome: 'Pintura Latex 2 Demaos', unidade: 'M2', categoria: 'PINTURA', descricao: 'Pintura interna padrao em duas demaos.' },
  { id: 9002, nome: 'Pintura Latex 3 Demaos', unidade: 'M2', categoria: 'PINTURA', descricao: 'Pintura premium interna em tres demaos.' },
  { id: 9003, nome: 'Grafiato Externo', unidade: 'M2', categoria: 'ACABAMENTO', descricao: 'Aplicacao de textura grafiato externa.' },
  { id: 9004, nome: 'Massa Corrida e Selador', unidade: 'M2', categoria: 'ACABAMENTO', descricao: 'Regularizacao com massa e selador.' },
  { id: 9005, nome: 'Pintura de Teto', unidade: 'M2', categoria: 'PINTURA', descricao: 'Pintura de forro e laje.' },
  { id: 9006, nome: 'Pintura Esmalte', unidade: 'M2', categoria: 'PINTURA', descricao: 'Esmalte para metal e madeira.' },
  { id: 9007, nome: 'Impermeabilizacao', unidade: 'M2', categoria: 'OUTROS', descricao: 'Tratamento impermeabilizante.' },
  { id: 9008, nome: 'Acabamento Fino de Rodape', unidade: 'ML', categoria: 'ACABAMENTO', descricao: 'Acabamento e pintura de rodape.' },
];

const prices = [
  { id: IDS.tabelaPrecos[0], servicoId: 9001, custo: 18.5, venda: 29.0 },
  { id: IDS.tabelaPrecos[1], servicoId: 9002, custo: 24.0, venda: 36.5 },
  { id: IDS.tabelaPrecos[2], servicoId: 9003, custo: 30.0, venda: 46.0 },
  { id: IDS.tabelaPrecos[3], servicoId: 9004, custo: 15.0, venda: 24.5 },
  { id: IDS.tabelaPrecos[4], servicoId: 9005, custo: 20.0, venda: 31.0 },
  { id: IDS.tabelaPrecos[5], servicoId: 9006, custo: 22.0, venda: 34.0 },
  { id: IDS.tabelaPrecos[6], servicoId: 9007, custo: 27.0, venda: 41.0 },
  { id: IDS.tabelaPrecos[7], servicoId: 9008, custo: 6.5, venda: 11.0 },
];

function encryptBankData(payload) {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    return null;
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const text = JSON.stringify(payload);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS ok`,
    [tableName],
  );
  return Boolean(rows[0]?.ok);
}

async function cleanupDemoRows(client) {
  const hasDeliveries = await tableExists(client, 'tb_notification_deliveries');
  if (hasDeliveries) {
    await client.query('DELETE FROM tb_notification_deliveries WHERE id_notificacao = ANY($1::uuid[])', [IDS.notificacoes]);
  }

  await client.query('DELETE FROM tb_notificacoes WHERE id = ANY($1::uuid[])', [IDS.notificacoes]);

  const hasEvents = await tableExists(client, 'tb_notification_events');
  if (hasEvents) {
    await client.query('DELETE FROM tb_notification_events WHERE id = ANY($1::uuid[])', [IDS.notificationEvents]);
  }

  const hasAprop = await tableExists(client, 'tb_apropriacoes_financeiras');
  if (hasAprop) {
    await client.query(
      `DELETE FROM tb_apropriacoes_financeiras
       WHERE id = ANY($1::uuid[])
          OR id_medicao_colaborador = ANY($2::uuid[])
          OR id_obra = ANY($3::uuid[])`,
      [IDS.apropriacoes, IDS.medicoesColaborador, [...IDS.obras, ...LEGACY_OBRA_IDS]],
    );
  }

  await client.query(
    `DELETE FROM tb_medicoes
     WHERE id = ANY($1::uuid[])
        OR id_alocacao = ANY($2::uuid[])
        OR id_obra = ANY($3::uuid[])`,
    [IDS.medicoesLegacy, IDS.alocacoesTarefa, [...IDS.obras, ...LEGACY_OBRA_IDS]],
  );

  await client.query(
    `DELETE FROM tb_medicoes_colaborador
     WHERE id = ANY($1::uuid[])
        OR id_item_ambiente = ANY($2::uuid[])
        OR id_alocacao_item = ANY($3::uuid[])
        OR id_colaborador = ANY($4::uuid[])`,
    [IDS.medicoesColaborador, IDS.itens, IDS.alocacoesItens, IDS.colaboradores],
  );

  await client.query(
    `DELETE FROM tb_alocacoes_tarefa
     WHERE id = ANY($1::uuid[])
        OR id_item_ambiente = ANY($2::uuid[])
        OR id_sessao = ANY($3::uuid[])
        OR id_colaborador = ANY($4::uuid[])`,
    [IDS.alocacoesTarefa, IDS.itens, IDS.sessoes, IDS.colaboradores],
  );

  await client.query(
    `DELETE FROM tb_alocacoes_itens
     WHERE id = ANY($1::uuid[])
        OR id_item_ambiente = ANY($2::uuid[])
        OR id_sessao = ANY($3::uuid[])
        OR id_colaborador = ANY($4::uuid[])`,
    [IDS.alocacoesItens, IDS.itens, IDS.sessoes, IDS.colaboradores],
  );

  await client.query(
    `DELETE FROM tb_sessoes_diarias
     WHERE id = ANY($1::uuid[])
        OR id_obra = ANY($2::uuid[])`,
    [IDS.sessoes, [...IDS.obras, ...LEGACY_OBRA_IDS]],
  );

  await client.query('DELETE FROM tb_itens_ambiente WHERE id = ANY($1::uuid[])', [IDS.itens]);
  await client.query('DELETE FROM tb_ambientes WHERE id = ANY($1::uuid[])', [IDS.ambientes]);
  await client.query('DELETE FROM tb_pavimentos WHERE id = ANY($1::uuid[])', [IDS.pavimentos]);
  await client.query('DELETE FROM tb_lotes_pagamento WHERE id = ANY($1::uuid[])', [[IDS.lotes.aberto, IDS.lotes.pago]]);
  await client.query('DELETE FROM tb_tabela_precos WHERE id = ANY($1::uuid[])', [IDS.tabelaPrecos]);
  await client.query('DELETE FROM tb_obras WHERE id = ANY($1::uuid[])', [[...IDS.obras, ...LEGACY_OBRA_IDS]]);
  await client.query('DELETE FROM tb_colaboradores WHERE id = ANY($1::uuid[])', [IDS.colaboradores]);
  await client.query('DELETE FROM tb_clientes WHERE id = ANY($1::uuid[])', [IDS.clientes]);

  await client.query('DELETE FROM tb_servicos_catalogo WHERE id BETWEEN 9001 AND 9008');
}

async function seedPerfisAndUsers(client) {
  const fullPermissions = {
    obras: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    pavimentos: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    ambientes: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    itensAmbiente: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    sessoes: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    clientes: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    colaboradores: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    servicos: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    precos: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    financeiro: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    usuarios: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    auditoria: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    permissoes: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
    configuracoes: { ativo: true, acoes: { visualizar: true, criar: true, editar: true, apagar: true } },
  };

  const perfis = [
    { id: 1, nome: 'ADMIN', descricao: 'Administrador de teste' },
    { id: 2, nome: 'GESTOR', descricao: 'Gestor de teste' },
    { id: 3, nome: 'FINANCEIRO', descricao: 'Financeiro de teste' },
    { id: 4, nome: 'ENCARREGADO', descricao: 'Encarregado de teste' },
  ];

  for (const p of perfis) {
    await client.query(
      `INSERT INTO tb_perfis (id, nome, descricao, permissoes_modulos)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id)
       DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, permissoes_modulos = EXCLUDED.permissoes_modulos`,
      [p.id, p.nome, p.descricao, JSON.stringify(fullPermissions)],
    );
  }

  const users = [
    { id: IDS.users.admin, nome: 'Admin Demo', email: 'admin.demo@jbpinturas.com.br', perfil: 1 },
    { id: IDS.users.gestor, nome: 'Gestor Demo', email: 'gestor.demo@jbpinturas.com.br', perfil: 2 },
    { id: IDS.users.financeiro, nome: 'Financeiro Demo', email: 'financeiro.demo@jbpinturas.com.br', perfil: 3 },
    { id: IDS.users.encarregado1, nome: 'Encarregado Demo 1', email: 'encarregado1.demo@jbpinturas.com.br', perfil: 4 },
    { id: IDS.users.encarregado2, nome: 'Encarregado Demo 2', email: 'encarregado2.demo@jbpinturas.com.br', perfil: 4 },
  ];

  for (const u of users) {
    await client.query(
      `INSERT INTO tb_usuarios (id, nome_completo, email, senha_hash, id_perfil, ativo, mfa_habilitado, deletado)
       VALUES ($1, $2, $3, $4, $5, TRUE, FALSE, FALSE)
       ON CONFLICT (email)
       DO UPDATE SET nome_completo = EXCLUDED.nome_completo,
                     senha_hash = EXCLUDED.senha_hash,
                     id_perfil = EXCLUDED.id_perfil,
                     ativo = TRUE,
                     deletado = FALSE`,
      [u.id, u.nome, u.email, PASSWORD_HASH, u.perfil],
    );
  }
}

async function seedClientes(client) {
  const rows = [
    [IDS.clientes[0], 'Construtora Horizonte Sul LTDA', '41.330.912/0001-10', 'contato@horizontesul.com.br', '(11) 3333-1001', 'Av. Paulista, 1200 - Sao Paulo/SP', 5, "NOW() - INTERVAL '120 days'"],
    [IDS.clientes[1], 'Incorp Nova Era SPE', '12.774.081/0001-58', 'obra@novaera.com.br', '(11) 3333-1002', 'Rua Augusta, 900 - Sao Paulo/SP', 10, "NOW() - INTERVAL '110 days'"],
    [IDS.clientes[2], 'Grupo Predial Atlantico', '73.551.402/0001-39', 'financeiro@atlantico.com.br', '(21) 3333-2001', 'Av. Atlantica, 2100 - Rio de Janeiro/RJ', 15, "NOW() - INTERVAL '95 days'"],
    [IDS.clientes[3], 'Alfa Engenharia e Obras SA', '09.842.601/0001-33', 'pm@alfaengenharia.com.br', '(31) 3333-3001', 'Rua da Bahia, 1500 - Belo Horizonte/MG', 20, "NOW() - INTERVAL '90 days'"],
    [IDS.clientes[4], 'Residencial Jardim Aurora', '22.408.918/0001-44', 'adm@jardimaurora.com.br', '(41) 3333-4001', 'Rua XV de Novembro, 700 - Curitiba/PR', 25, "NOW() - INTERVAL '80 days'"],
    [IDS.clientes[5], 'Complexo Empresarial Oeste', '58.662.741/0001-82', 'suprimentos@ceoeste.com.br', '(51) 3333-5001', 'Av. Carlos Gomes, 850 - Porto Alegre/RS', 28, "NOW() - INTERVAL '70 days'"],
  ];

  for (const [id, razao, cnpj, email, tel, endereco, diaCorte, createdAtSql] of rows) {
    await client.query(
      `INSERT INTO tb_clientes (id, razao_social, cnpj_nif, email, telefone, endereco, dia_corte, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, ${createdAtSql}, NOW())
       ON CONFLICT (id)
       DO UPDATE SET razao_social = EXCLUDED.razao_social,
                     cnpj_nif = EXCLUDED.cnpj_nif,
                     email = EXCLUDED.email,
                     telefone = EXCLUDED.telefone,
                     endereco = EXCLUDED.endereco,
                     dia_corte = EXCLUDED.dia_corte,
                     deletado = FALSE,
                     updated_at = NOW()`,
      [id, razao, cnpj, email, tel, endereco, diaCorte],
    );
  }
}

async function seedColaboradores(client) {
  const base = [
    ['Joao Carlos Lima', '31455512001', 'Pintor', 'Nubank', '0001', '123456-7'],
    ['Fernanda Rocha', '31455512002', 'Pintora', 'Itau', '3321', '445566-0'],
    ['Marcos Vinicius', '31455512003', 'Grafiato', 'Bradesco', '8877', '998877-1'],
    ['Paula Nunes', '31455512004', 'Acabamento', 'Santander', '1020', '776655-2'],
    ['Ricardo Souza', '31455512005', 'Impermeabilizacao', 'Caixa', '3003', '554433-9'],
    ['Aline Martins', '31455512006', 'Pintora', 'Banco do Brasil', '1111', '221100-4'],
    ['Diego Ferreira', '31455512007', 'Pintor', 'Inter', '0777', '889900-1'],
    ['Luciana Prado', '31455512008', 'Acabamento', 'Sicredi', '4545', '778899-5'],
  ];

  for (let i = 0; i < base.length; i += 1) {
    const [nome, cpf, funcao, banco, agencia, conta] = base[i];
    const encryptedBank = encryptBankData({ banco, agencia, conta, tipo_conta: 'corrente' });

    await client.query(
      `INSERT INTO tb_colaboradores (
        id, nome_completo, cpf_nif, email, telefone, data_nascimento, endereco, dados_bancarios_enc, ativo, deletado, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6::date, $7, $8, TRUE, FALSE, NOW() - make_interval(days => $9::int), NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET nome_completo = EXCLUDED.nome_completo,
                    cpf_nif = EXCLUDED.cpf_nif,
                    email = EXCLUDED.email,
                    telefone = EXCLUDED.telefone,
                    data_nascimento = EXCLUDED.data_nascimento,
                    endereco = EXCLUDED.endereco,
                    dados_bancarios_enc = EXCLUDED.dados_bancarios_enc,
                    ativo = TRUE,
                    deletado = FALSE,
                    updated_at = NOW()`,
      [
        IDS.colaboradores[i],
        `${nome} - ${funcao}`,
        cpf,
        `colab${i + 1}.demo@jbpinturas.com.br`,
        `(11) 98${String(i + 10).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
        `199${i}-0${(i % 9) + 1}-1${(i % 8) + 1}`,
        `Rua Demo ${i + 1}, ${100 + i} - Sao Paulo/SP`,
        encryptedBank,
        200 - i * 10,
      ],
    );
  }
}

async function seedServicos(client) {
  for (const s of services) {
    await client.query(
      `INSERT INTO tb_servicos_catalogo (id, nome, unidade_medida, categoria, descricao, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, NOW() - INTERVAL '180 days', NOW())
       ON CONFLICT (id)
       DO UPDATE SET nome = EXCLUDED.nome,
                     unidade_medida = EXCLUDED.unidade_medida,
                     categoria = EXCLUDED.categoria,
                     descricao = EXCLUDED.descricao,
                     deletado = FALSE,
                     updated_at = NOW()`,
      [s.id, s.nome, s.unidade, s.categoria, s.descricao],
    );
  }
}

async function seedObrasEstrutura(client) {
  const obras = [
    [IDS.obras[0], 'DEMO - Residencial Aurora', IDS.clientes[0], 'ATIVA', '2026-01-10', '2026-08-30', -23.564, -46.652],
    [IDS.obras[1], 'DEMO - Comercial Downtown', IDS.clientes[1], 'ATIVA', '2026-02-05', '2026-09-20', -23.548, -46.638],
    [IDS.obras[2], 'DEMO - Hotel Vista Mar', IDS.clientes[2], 'ATIVA', '2026-01-25', '2026-10-10', -22.971, -43.182],
    [IDS.obras[3], 'DEMO - Torre Empresarial Prime', IDS.clientes[3], 'ATIVA', '2026-03-01', '2026-12-15', -19.924, -43.94],
  ];

  for (const [id, nome, idCliente, status, inicio, previsao, lat, lng] of obras) {
    await client.query(
      `INSERT INTO tb_obras (
        id, nome, endereco_completo, status, data_inicio, data_previsao_fim, observacoes,
        geo_lat, geo_long, margem_minima_percentual, progresso, id_cliente, id_usuario_criador, deletado, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, 20.00, 0, $10, $11, FALSE, NOW() - INTERVAL '120 days', NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET nome = EXCLUDED.nome,
                    endereco_completo = EXCLUDED.endereco_completo,
                    status = EXCLUDED.status,
                    data_inicio = EXCLUDED.data_inicio,
                    data_previsao_fim = EXCLUDED.data_previsao_fim,
                    observacoes = EXCLUDED.observacoes,
                    geo_lat = EXCLUDED.geo_lat,
                    geo_long = EXCLUDED.geo_long,
                    id_cliente = EXCLUDED.id_cliente,
                    id_usuario_criador = EXCLUDED.id_usuario_criador,
                    deletado = FALSE,
                    updated_at = NOW()`,
      [
        id,
        nome,
        `Endereco demo de ${nome}`,
        status,
        inicio,
        previsao,
        `Obra sintetica para demonstracao completa: dashboards, folha, contas e notificacoes (${nome}).`,
        lat,
        lng,
        idCliente,
        IDS.users.admin,
      ],
    );
  }

  const pavs = [
    [IDS.pavimentos[0], IDS.obras[0], 'Terreo', 0],
    [IDS.pavimentos[1], IDS.obras[0], '1 Pavimento', 1],
    [IDS.pavimentos[2], IDS.obras[1], 'Terreo', 0],
    [IDS.pavimentos[3], IDS.obras[1], '2 Pavimento', 2],
    [IDS.pavimentos[4], IDS.obras[2], 'Terreo', 0],
    [IDS.pavimentos[5], IDS.obras[2], 'Ala Norte', 1],
    [IDS.pavimentos[6], IDS.obras[3], 'Terreo', 0],
    [IDS.pavimentos[7], IDS.obras[3], 'Cobertura Tecnica', 5],
  ];

  for (const [id, idObra, nome, ordem] of pavs) {
    await client.query(
      `INSERT INTO tb_pavimentos (id, id_obra, nome, ordem, nivel, is_cobertura, progresso, status_progresso, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4, $5, 0, 'ABERTO', FALSE, NOW() - INTERVAL '90 days', NOW())
       ON CONFLICT (id)
       DO UPDATE SET id_obra = EXCLUDED.id_obra,
                     nome = EXCLUDED.nome,
                     ordem = EXCLUDED.ordem,
                     nivel = EXCLUDED.nivel,
                     is_cobertura = EXCLUDED.is_cobertura,
                     deletado = FALSE,
                     updated_at = NOW()`,
      [id, idObra, nome, ordem, nome.toLowerCase().includes('cobertura')],
    );
  }

  const ambs = [
    [IDS.ambientes[0], IDS.pavimentos[0], 'Recepcao Principal', 95],
    [IDS.ambientes[1], IDS.pavimentos[0], 'Hall Social', 60],
    [IDS.ambientes[2], IDS.pavimentos[1], 'Apto 101 Sala', 48],
    [IDS.ambientes[3], IDS.pavimentos[1], 'Apto 101 Quarto', 22],
    [IDS.ambientes[4], IDS.pavimentos[2], 'Loja 01', 140],
    [IDS.ambientes[5], IDS.pavimentos[2], 'Loja 02', 125],
    [IDS.ambientes[6], IDS.pavimentos[3], 'Praca de Alimentacao', 180],
    [IDS.ambientes[7], IDS.pavimentos[4], 'Lobby Hotel', 130],
    [IDS.ambientes[8], IDS.pavimentos[5], 'Corredor Ala Norte', 90],
    [IDS.ambientes[9], IDS.pavimentos[6], 'Recepcao Torre', 110],
    [IDS.ambientes[10], IDS.pavimentos[7], 'Casa de Maquinas', 75],
    [IDS.ambientes[11], IDS.pavimentos[7], 'Reservatorio Superior', 65],
  ];

  for (const [id, idPav, nome, area] of ambs) {
    await client.query(
      `INSERT INTO tb_ambientes (id, id_pavimento, nome, area_m2, descricao, progresso, status_progresso, deletado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, 'ABERTO', FALSE, NOW() - INTERVAL '75 days', NOW())
       ON CONFLICT (id)
       DO UPDATE SET id_pavimento = EXCLUDED.id_pavimento,
                     nome = EXCLUDED.nome,
                     area_m2 = EXCLUDED.area_m2,
                     descricao = EXCLUDED.descricao,
                     deletado = FALSE,
                     updated_at = NOW()`,
      [id, idPav, nome, area, `Ambiente demo ${nome}`],
    );
  }

}

async function seedItensAmbiente(client) {
  for (let i = 0; i < IDS.itens.length; i += 1) {
    const id = IDS.itens[i];
    const idAmbiente = IDS.ambientes[i];
    const preco = prices[i % prices.length];
    const areaPlanejada = 40 + i * 7;

    await client.query(
      `INSERT INTO tb_itens_ambiente (
        id, id_ambiente, nome_elemento, id_tabela_preco, area_planejada, area_medida_total,
        progresso, status, deletado, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 0, 0, 'ABERTO', FALSE, NOW() - INTERVAL '70 days', NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET id_ambiente = EXCLUDED.id_ambiente,
                    nome_elemento = EXCLUDED.nome_elemento,
                    id_tabela_preco = EXCLUDED.id_tabela_preco,
                    area_planejada = EXCLUDED.area_planejada,
                    area_medida_total = 0,
                    progresso = 0,
                    status = 'ABERTO',
                    deletado = FALSE,
                    updated_at = NOW()`,
      [id, idAmbiente, `Elemento ${services[i % services.length].nome}`, preco.id, areaPlanejada],
    );
  }
}

async function seedPrecos(client) {
  for (const p of prices) {
    await client.query(
      `INSERT INTO tb_tabela_precos (
        id, id_obra, id_servico_catalogo, preco_custo, preco_venda, margem_percentual,
        status_aprovacao, data_submissao, id_usuario_submissor, data_aprovacao, id_usuario_aprovador,
        observacoes, deletado, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        ROUND(((($5::numeric - $4::numeric) / NULLIF($4::numeric,0)) * 100)::numeric, 2),
        'APROVADO',
        NOW() - INTERVAL '40 days',
        $6::uuid,
        NOW() - INTERVAL '35 days',
        $6::uuid,
        'Preco sintetico para demonstracao',
        FALSE,
        NOW() - INTERVAL '45 days',
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET id_obra = EXCLUDED.id_obra,
                    id_servico_catalogo = EXCLUDED.id_servico_catalogo,
                    preco_custo = EXCLUDED.preco_custo,
                    preco_venda = EXCLUDED.preco_venda,
                    margem_percentual = EXCLUDED.margem_percentual,
                    status_aprovacao = 'APROVADO',
                    data_aprovacao = EXCLUDED.data_aprovacao,
                    id_usuario_aprovador = EXCLUDED.id_usuario_aprovador,
                    observacoes = EXCLUDED.observacoes,
                    deletado = FALSE,
                    updated_at = NOW()`,
      [p.id, IDS.obras[0], p.servicoId, p.custo, p.venda, IDS.users.gestor],
    );
  }
}

async function seedOSAndMedicoes(client) {
  const sessoes = [
    [IDS.sessoes[0], IDS.users.encarregado1, IDS.obras[0], 2, 'ABERTA'],
    [IDS.sessoes[1], IDS.users.encarregado1, IDS.obras[1], 8, 'ENCERRADA'],
    [IDS.sessoes[2], IDS.users.encarregado2, IDS.obras[2], 15, 'ENCERRADA'],
    [IDS.sessoes[3], IDS.users.encarregado2, IDS.obras[3], 27, 'ENCERRADA'],
  ];

  for (const [id, encarregado, obra, daysAgo, status] of sessoes) {
    await client.query(
      `INSERT INTO tb_sessoes_diarias (
        id, id_encarregado, id_obra, data_sessao, hora_inicio, hora_fim,
        geo_lat, geo_long, nome_assinante, cpf_assinante, observacoes, status, deletado, created_at, updated_at
      ) VALUES (
        $1, $2, $3,
        (CURRENT_DATE - make_interval(days => $4::int))::date,
        NOW() - make_interval(days => $4::int),
        CASE WHEN $5 = 'ENCERRADA' THEN NOW() - make_interval(days => ($4::int - 1)) ELSE NULL END,
        -23.55,
        -46.63,
        'Responsavel Demo',
        '12345678900',
        'OS sintetica para demonstracao',
        $5::tb_sessoes_diarias_status_enum,
        FALSE,
        NOW() - make_interval(days => $4::int),
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET id_encarregado = EXCLUDED.id_encarregado,
                    id_obra = EXCLUDED.id_obra,
                    data_sessao = EXCLUDED.data_sessao,
                    hora_inicio = EXCLUDED.hora_inicio,
                    hora_fim = EXCLUDED.hora_fim,
                    status = EXCLUDED.status,
                    deletado = FALSE,
                    updated_at = NOW()`,
      [id, encarregado, obra, daysAgo, status],
    );
  }

  const alocacoes = [
    [IDS.alocacoesItens[0], IDS.sessoes[0], IDS.ambientes[0], IDS.itens[0], IDS.colaboradores[0], 'EM_ANDAMENTO', 2],
    [IDS.alocacoesItens[1], IDS.sessoes[0], IDS.ambientes[1], IDS.itens[1], IDS.colaboradores[1], 'EM_ANDAMENTO', 2],
    [IDS.alocacoesItens[2], IDS.sessoes[1], IDS.ambientes[2], IDS.itens[2], IDS.colaboradores[2], 'CONCLUIDO', 8],
    [IDS.alocacoesItens[3], IDS.sessoes[1], IDS.ambientes[3], IDS.itens[3], IDS.colaboradores[3], 'CONCLUIDO', 8],
    [IDS.alocacoesItens[4], IDS.sessoes[2], IDS.ambientes[4], IDS.itens[4], IDS.colaboradores[4], 'CONCLUIDO', 15],
    [IDS.alocacoesItens[5], IDS.sessoes[2], IDS.ambientes[5], IDS.itens[5], IDS.colaboradores[5], 'PAUSADO', 15],
    [IDS.alocacoesItens[6], IDS.sessoes[3], IDS.ambientes[6], IDS.itens[6], IDS.colaboradores[6], 'CONCLUIDO', 27],
    [IDS.alocacoesItens[7], IDS.sessoes[3], IDS.ambientes[7], IDS.itens[7], IDS.colaboradores[7], 'CONCLUIDO', 27],
  ];

  for (const [id, sessao, ambiente, item, colaborador, status, daysAgo] of alocacoes) {
    await client.query(
      `INSERT INTO tb_alocacoes_itens (
        id, id_sessao, id_ambiente, id_item_ambiente, id_colaborador, id_tabela_preco,
        status, hora_inicio, hora_fim, observacoes, deletado, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        (SELECT id_tabela_preco FROM tb_itens_ambiente WHERE id = $4),
        $6::varchar,
        NOW() - make_interval(days => $7::int),
        CASE WHEN $6::varchar = 'EM_ANDAMENTO' THEN NULL ELSE NOW() - make_interval(days => ($7::int - 1)) END,
        'Alocacao item demo',
        FALSE,
        NOW() - make_interval(days => $7::int),
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET id_sessao = EXCLUDED.id_sessao,
                    id_ambiente = EXCLUDED.id_ambiente,
                    id_item_ambiente = EXCLUDED.id_item_ambiente,
                    id_colaborador = EXCLUDED.id_colaborador,
                    id_tabela_preco = EXCLUDED.id_tabela_preco,
                    status = EXCLUDED.status,
                    hora_inicio = EXCLUDED.hora_inicio,
                    hora_fim = EXCLUDED.hora_fim,
                    observacoes = EXCLUDED.observacoes,
                    deletado = FALSE,
                    updated_at = NOW()`,
      [id, sessao, ambiente, item, colaborador, status, daysAgo],
    );
  }

  const medicoes = [
    [IDS.medicoesColaborador[0], IDS.alocacoesItens[0], IDS.colaboradores[0], IDS.itens[0], 18.5, 'ABERTO', 2],
    [IDS.medicoesColaborador[1], IDS.alocacoesItens[1], IDS.colaboradores[1], IDS.itens[1], 12.0, 'ABERTO', 2],
    [IDS.medicoesColaborador[2], IDS.alocacoesItens[2], IDS.colaboradores[2], IDS.itens[2], 30.0, 'ABERTO', 8],
    [IDS.medicoesColaborador[3], IDS.alocacoesItens[3], IDS.colaboradores[3], IDS.itens[3], 20.0, 'PAGO', 8],
    [IDS.medicoesColaborador[4], IDS.alocacoesItens[4], IDS.colaboradores[4], IDS.itens[4], 42.0, 'PAGO', 15],
    [IDS.medicoesColaborador[5], IDS.alocacoesItens[5], IDS.colaboradores[5], IDS.itens[5], 16.5, 'ABERTO', 15],
    [IDS.medicoesColaborador[6], IDS.alocacoesItens[6], IDS.colaboradores[6], IDS.itens[6], 27.0, 'ABERTO', 27],
    [IDS.medicoesColaborador[7], IDS.alocacoesItens[7], IDS.colaboradores[7], IDS.itens[7], 35.0, 'PAGO', 27],
  ];

  const alocacoesTarefa = [
    [IDS.alocacoesTarefa[0], IDS.sessoes[0], IDS.ambientes[0], IDS.itens[0], IDS.colaboradores[0], 9001, 'EM_ANDAMENTO', 2],
    [IDS.alocacoesTarefa[1], IDS.sessoes[0], IDS.ambientes[1], IDS.itens[1], IDS.colaboradores[1], 9002, 'EM_ANDAMENTO', 2],
    [IDS.alocacoesTarefa[2], IDS.sessoes[1], IDS.ambientes[2], IDS.itens[2], IDS.colaboradores[2], 9003, 'CONCLUIDO', 8],
    [IDS.alocacoesTarefa[3], IDS.sessoes[1], IDS.ambientes[3], IDS.itens[3], IDS.colaboradores[3], 9004, 'CONCLUIDO', 8],
    [IDS.alocacoesTarefa[4], IDS.sessoes[2], IDS.ambientes[4], IDS.itens[4], IDS.colaboradores[4], 9005, 'CONCLUIDO', 15],
    [IDS.alocacoesTarefa[5], IDS.sessoes[2], IDS.ambientes[5], IDS.itens[5], IDS.colaboradores[5], 9006, 'PAUSADO', 15],
    [IDS.alocacoesTarefa[6], IDS.sessoes[3], IDS.ambientes[6], IDS.itens[6], IDS.colaboradores[6], 9007, 'CONCLUIDO', 27],
    [IDS.alocacoesTarefa[7], IDS.sessoes[3], IDS.ambientes[7], IDS.itens[7], IDS.colaboradores[7], 9008, 'CONCLUIDO', 27],
  ];

  for (const [id, sessao, ambiente, item, colaborador, servicoCatalogo, status, daysAgo] of alocacoesTarefa) {
    await client.query(
      `INSERT INTO tb_alocacoes_tarefa (
        id, id_sessao, id_ambiente, id_item_ambiente, id_colaborador, id_servico_catalogo,
        status, hora_inicio, hora_fim, observacoes, deletado, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7::tb_alocacoes_tarefa_status_enum,
        NOW() - make_interval(days => $8::int),
        CASE
          WHEN $7::tb_alocacoes_tarefa_status_enum = 'EM_ANDAMENTO'::tb_alocacoes_tarefa_status_enum
            THEN NULL
          ELSE NOW() - make_interval(days => ($8::int - 1))
        END,
        'Alocacao tarefa demo para relatorios',
        FALSE,
        NOW() - make_interval(days => $8::int),
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET id_sessao = EXCLUDED.id_sessao,
                    id_ambiente = EXCLUDED.id_ambiente,
                    id_item_ambiente = EXCLUDED.id_item_ambiente,
                    id_colaborador = EXCLUDED.id_colaborador,
                    id_servico_catalogo = EXCLUDED.id_servico_catalogo,
                    status = EXCLUDED.status,
                    hora_inicio = EXCLUDED.hora_inicio,
                    hora_fim = EXCLUDED.hora_fim,
                    observacoes = EXCLUDED.observacoes,
                    deletado = FALSE,
                    updated_at = NOW()`,
      [id, sessao, ambiente, item, colaborador, servicoCatalogo, status, daysAgo],
    );
  }

  for (const [id, alocacaoItem, colaborador, item, qtd, statusPagamento, daysAgo] of medicoes) {
    await client.query(
      `INSERT INTO tb_medicoes_colaborador (
        id, id_alocacao_item, id_colaborador, id_item_ambiente,
        qtd_executada, area_planejada, percentual_conclusao_item,
        flag_excedente, justificativa, status_pagamento, data_medicao,
        deletado, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5,
        (SELECT area_planejada FROM tb_itens_ambiente WHERE id = $4),
        ROUND(($5 / NULLIF((SELECT area_planejada FROM tb_itens_ambiente WHERE id = $4),0) * 100)::numeric, 2),
        FALSE,
        'Medicao sintetica para demonstracao',
        $6,
        (CURRENT_DATE - make_interval(days => $7::int))::date,
        FALSE,
        NOW() - make_interval(days => $7::int),
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET id_alocacao_item = EXCLUDED.id_alocacao_item,
                    id_colaborador = EXCLUDED.id_colaborador,
                    id_item_ambiente = EXCLUDED.id_item_ambiente,
                    qtd_executada = EXCLUDED.qtd_executada,
                    area_planejada = EXCLUDED.area_planejada,
                    percentual_conclusao_item = EXCLUDED.percentual_conclusao_item,
                    status_pagamento = EXCLUDED.status_pagamento,
                    data_medicao = EXCLUDED.data_medicao,
                    deletado = FALSE,
                    updated_at = NOW()`,
      [id, alocacaoItem, colaborador, item, qtd, statusPagamento, daysAgo],
    );
  }

  const medicoesLegacy = [
    [IDS.medicoesLegacy[0], IDS.alocacoesTarefa[0], 18.5, 'ABERTO', 2],
    [IDS.medicoesLegacy[1], IDS.alocacoesTarefa[1], 12.0, 'ABERTO', 2],
    [IDS.medicoesLegacy[2], IDS.alocacoesTarefa[2], 30.0, 'ABERTO', 8],
    [IDS.medicoesLegacy[3], IDS.alocacoesTarefa[3], 20.0, 'PAGO', 8],
    [IDS.medicoesLegacy[4], IDS.alocacoesTarefa[4], 42.0, 'PAGO', 15],
    [IDS.medicoesLegacy[5], IDS.alocacoesTarefa[5], 16.5, 'ABERTO', 15],
    [IDS.medicoesLegacy[6], IDS.alocacoesTarefa[6], 27.0, 'ABERTO', 27],
    [IDS.medicoesLegacy[7], IDS.alocacoesTarefa[7], 35.0, 'PAGO', 27],
  ];

  for (const [id, alocacaoTarefa, qtd, statusPagamento, daysAgo] of medicoesLegacy) {
    await client.query(
      `INSERT INTO tb_medicoes (
        id, id_alocacao, qtd_executada, area_planejada, flag_excedente,
        justificativa, status_pagamento, id_lote_pagamento, valor_calculado,
        data_medicao, id_obra, deletado, created_at, updated_at
      )
      SELECT
        $1,
        at.id,
        $2,
        ia.area_planejada,
        FALSE,
        'Medicao demo legada para relatorios financeiros',
        $3,
        NULL,
        ROUND(($2::numeric * COALESCE(tp.preco_venda, 0))::numeric, 2),
        (CURRENT_DATE - make_interval(days => $4::int))::date,
        sd.id_obra,
        FALSE,
        NOW() - make_interval(days => $4::int),
        NOW()
      FROM tb_alocacoes_tarefa at
      JOIN tb_itens_ambiente ia ON ia.id = at.id_item_ambiente
      LEFT JOIN tb_tabela_precos tp ON tp.id = ia.id_tabela_preco
      JOIN tb_sessoes_diarias sd ON sd.id = at.id_sessao
      WHERE at.id = $5
      ON CONFLICT (id)
      DO UPDATE SET id_alocacao = EXCLUDED.id_alocacao,
                    qtd_executada = EXCLUDED.qtd_executada,
                    area_planejada = EXCLUDED.area_planejada,
                    flag_excedente = EXCLUDED.flag_excedente,
                    justificativa = EXCLUDED.justificativa,
                    status_pagamento = EXCLUDED.status_pagamento,
                    valor_calculado = EXCLUDED.valor_calculado,
                    data_medicao = EXCLUDED.data_medicao,
                    id_obra = EXCLUDED.id_obra,
                    id_lote_pagamento = NULL,
                    deletado = FALSE,
                    updated_at = NOW()`,
      [id, qtd, statusPagamento, daysAgo, alocacaoTarefa],
    );
  }
}

async function seedFinanceiro(client) {
  await client.query(
    `INSERT INTO tb_lotes_pagamento (
      id, descricao, data_competencia, data_pagamento, valor_total, qtd_medicoes,
      status, tipo_pagamento, id_criado_por, id_aprovado_por, observacoes, deletado, created_at, updated_at
    ) VALUES
      ($1, 'Lote Aberto - Competencia Atual', (CURRENT_DATE - INTERVAL '10 days')::date, NULL, 0, 0,
       'ABERTO', NULL, $3, NULL, 'Lote em aberto para testes de filtro', FALSE, NOW() - INTERVAL '9 days', NOW()),
      ($2, 'Lote Pago - Competencia Anterior', (CURRENT_DATE - INTERVAL '35 days')::date, (CURRENT_DATE - INTERVAL '20 days')::date, 0, 0,
       'PAGO', 'PIX', $3, $4, 'Lote pago para demonstracao de historico', FALSE, NOW() - INTERVAL '34 days', NOW())
    ON CONFLICT (id)
    DO UPDATE SET descricao = EXCLUDED.descricao,
                  data_competencia = EXCLUDED.data_competencia,
                  data_pagamento = EXCLUDED.data_pagamento,
                  status = EXCLUDED.status,
                  tipo_pagamento = EXCLUDED.tipo_pagamento,
                  id_criado_por = EXCLUDED.id_criado_por,
                  id_aprovado_por = EXCLUDED.id_aprovado_por,
                  observacoes = EXCLUDED.observacoes,
                  deletado = FALSE,
                  updated_at = NOW()`,
    [IDS.lotes.aberto, IDS.lotes.pago, IDS.users.financeiro, IDS.users.gestor],
  );

  await client.query(
    `UPDATE tb_medicoes_colaborador
     SET id_lote_pagamento = CASE
       WHEN id = ANY($1::uuid[]) THEN $2::uuid
       WHEN id = ANY($3::uuid[]) THEN $4::uuid
       ELSE NULL
     END,
     status_pagamento = CASE
      WHEN id = ANY($1::uuid[]) THEN 'ABERTO'
       WHEN id = ANY($3::uuid[]) THEN 'PAGO'
       ELSE status_pagamento
     END,
     updated_at = NOW()
     WHERE id = ANY($5::uuid[])`,
    [
      [IDS.medicoesColaborador[0], IDS.medicoesColaborador[2], IDS.medicoesColaborador[6]],
      IDS.lotes.aberto,
      [IDS.medicoesColaborador[3], IDS.medicoesColaborador[4], IDS.medicoesColaborador[7]],
      IDS.lotes.pago,
      IDS.medicoesColaborador,
    ],
  );

  await client.query(
    `UPDATE tb_medicoes
     SET id_lote_pagamento = CASE
       WHEN id = ANY($1::uuid[]) THEN $2::uuid
       WHEN id = ANY($3::uuid[]) THEN $4::uuid
       ELSE NULL
     END,
     status_pagamento = CASE
      WHEN id = ANY($1::uuid[]) THEN 'ABERTO'
       WHEN id = ANY($3::uuid[]) THEN 'PAGO'
       ELSE status_pagamento
     END,
     updated_at = NOW()
     WHERE id = ANY($5::uuid[])`,
    [
      [IDS.medicoesLegacy[0], IDS.medicoesLegacy[2], IDS.medicoesLegacy[6]],
      IDS.lotes.aberto,
      [IDS.medicoesLegacy[3], IDS.medicoesLegacy[4], IDS.medicoesLegacy[7]],
      IDS.lotes.pago,
      IDS.medicoesLegacy,
    ],
  );

  await client.query(
    `UPDATE tb_lotes_pagamento lp
     SET valor_total = COALESCE(src.total, 0),
         qtd_medicoes = COALESCE(src.qtd, 0),
         updated_at = NOW()
     FROM (
       SELECT
         mc.id_lote_pagamento AS lote_id,
         COUNT(*)::int AS qtd,
         ROUND(SUM(mc.qtd_executada * tp.preco_custo)::numeric, 2) AS total
       FROM tb_medicoes_colaborador mc
       JOIN tb_itens_ambiente ia ON ia.id = mc.id_item_ambiente
       JOIN tb_tabela_precos tp ON tp.id = ia.id_tabela_preco
       WHERE mc.id_lote_pagamento IS NOT NULL
       GROUP BY mc.id_lote_pagamento
     ) src
     WHERE lp.id = src.lote_id`);

  const hasAprop = await tableExists(client, 'tb_apropriacoes_financeiras');
  if (hasAprop) {
    for (let i = 0; i < IDS.medicoesColaborador.length; i += 1) {
      const medicaoId = IDS.medicoesColaborador[i];
      const apropId = IDS.apropriacoes[i];
      const status = i % 3 === 0 ? 'PAGO' : i % 3 === 1 ? 'PENDENTE' : 'APROVADO';

      await client.query(
        `INSERT INTO tb_apropriacoes_financeiras (
          id, id_medicao_colaborador, id_colaborador, id_obra,
          preco_venda_unitario, area_executada, valor_calculado,
          competencia, status, id_aprovado_por, data_aprovacao,
          deletado, created_at, updated_at
        )
        SELECT
          $1,
          mc.id,
          mc.id_colaborador,
          o.id,
          tp.preco_venda,
          mc.qtd_executada,
          ROUND((mc.qtd_executada * tp.preco_venda)::numeric, 2),
          date_trunc('month', mc.data_medicao)::date,
          $2::varchar,
          CASE WHEN $2::varchar IN ('APROVADO', 'PAGO') THEN $3::uuid ELSE NULL END,
          CASE WHEN $2::varchar IN ('APROVADO', 'PAGO') THEN CURRENT_DATE - INTERVAL '5 days' ELSE NULL END,
          FALSE,
          NOW() - INTERVAL '20 days',
          NOW()
        FROM tb_medicoes_colaborador mc
        JOIN tb_itens_ambiente ia ON ia.id = mc.id_item_ambiente
        JOIN tb_tabela_precos tp ON tp.id = ia.id_tabela_preco
        JOIN tb_ambientes a ON a.id = ia.id_ambiente
        JOIN tb_pavimentos p ON p.id = a.id_pavimento
        JOIN tb_obras o ON o.id = p.id_obra
        WHERE mc.id = $4
        ON CONFLICT (id)
        DO UPDATE SET id_medicao_colaborador = EXCLUDED.id_medicao_colaborador,
                      id_colaborador = EXCLUDED.id_colaborador,
                      id_obra = EXCLUDED.id_obra,
                      preco_venda_unitario = EXCLUDED.preco_venda_unitario,
                      area_executada = EXCLUDED.area_executada,
                      valor_calculado = EXCLUDED.valor_calculado,
                      competencia = EXCLUDED.competencia,
                      status = EXCLUDED.status,
                      id_aprovado_por = EXCLUDED.id_aprovado_por,
                      data_aprovacao = EXCLUDED.data_aprovacao,
                      deletado = FALSE,
                      updated_at = NOW()`,
        [apropId, status, IDS.users.gestor, medicaoId],
      );
    }
  }
}

async function recalcProgress(client) {
  await client.query(
    `WITH item_stats AS (
       SELECT
         ia.id,
         COALESCE((
           SELECT SUM(mc.qtd_executada)
           FROM tb_medicoes_colaborador mc
           WHERE mc.id_item_ambiente = ia.id
             AND mc.deletado = FALSE
         ), 0) AS soma
       FROM tb_itens_ambiente ia
       WHERE ia.id = ANY($1::uuid[])
     )
     UPDATE tb_itens_ambiente ia
     SET area_medida_total = item_stats.soma,
         progresso = ROUND(LEAST(100, item_stats.soma / NULLIF(ia.area_planejada, 0) * 100)::numeric, 2),
         status = CASE
           WHEN item_stats.soma = 0 THEN 'ABERTO'
           WHEN item_stats.soma >= ia.area_planejada THEN 'CONCLUIDO'
           ELSE 'EM_PROGRESSO'
         END,
         updated_at = NOW()
     FROM item_stats
     WHERE ia.id = item_stats.id`,
    [IDS.itens],
  );

  await client.query(
    `UPDATE tb_ambientes a
     SET progresso = COALESCE(src.progresso, 0),
         status_progresso = CASE
           WHEN COALESCE(src.progresso, 0) = 0 THEN 'ABERTO'
           WHEN COALESCE(src.progresso, 0) >= 100 THEN 'CONCLUIDO'
           ELSE 'EM_PROGRESSO'
         END,
         updated_at = NOW()
     FROM (
       SELECT id_ambiente, ROUND(AVG(progresso)::numeric, 2) AS progresso
       FROM tb_itens_ambiente
       WHERE deletado = FALSE
       GROUP BY id_ambiente
     ) src
     WHERE a.id = src.id_ambiente`);

  await client.query(
    `UPDATE tb_pavimentos p
     SET progresso = COALESCE(src.progresso, 0),
         status_progresso = CASE
           WHEN COALESCE(src.progresso, 0) = 0 THEN 'ABERTO'
           WHEN COALESCE(src.progresso, 0) >= 100 THEN 'CONCLUIDO'
           ELSE 'EM_PROGRESSO'
         END,
         updated_at = NOW()
     FROM (
       SELECT id_pavimento, ROUND(AVG(progresso)::numeric, 2) AS progresso
       FROM tb_ambientes
       WHERE deletado = FALSE
       GROUP BY id_pavimento
     ) src
     WHERE p.id = src.id_pavimento`);

  await client.query(
    `UPDATE tb_obras o
     SET progresso = COALESCE(src.progresso, 0),
         updated_at = NOW()
     FROM (
       SELECT id_obra, ROUND(AVG(progresso)::numeric, 2) AS progresso
       FROM tb_pavimentos
       WHERE deletado = FALSE
       GROUP BY id_obra
     ) src
     WHERE o.id = src.id_obra`);
}

async function seedNotificacoes(client) {
  const hasEvents = await tableExists(client, 'tb_notification_events');

  const eventDefs = [
    [IDS.notificationEvents[0], 'CONTA_PAGAR_ABERTA', 'financeiro', 'tb_lotes_pagamento', IDS.lotes.aberto, { lote: IDS.lotes.aberto, valor_total: 'aberto' }],
    [IDS.notificationEvents[1], 'CONTA_RECEBER_ABERTA', 'financeiro', 'tb_apropriacoes_financeiras', IDS.apropriacoes[1], { apropriacao: IDS.apropriacoes[1], status: 'PENDENTE' }],
    [IDS.notificationEvents[2], 'OS_ABERTA', 'sessoes', 'tb_sessoes_diarias', IDS.sessoes[0], { sessao: IDS.sessoes[0], obra: IDS.obras[0] }],
    [IDS.notificationEvents[3], 'PRECO_APROVACAO_PENDENTE', 'precos', 'tb_tabela_precos', IDS.tabelaPrecos[2], { preco: IDS.tabelaPrecos[2], status: 'PENDENTE' }],
  ];

  if (hasEvents) {
    for (let i = 0; i < eventDefs.length; i += 1) {
      const [id, type, moduleName, entityType, entityId, payload] = eventDefs[i];
      await client.query(
        `INSERT INTO tb_notification_events (
          id, event_type, source_module, entity_type, entity_id, payload, occurred_at,
          idempotency_key, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, NOW() - make_interval(days => $7::int),
          $8, 'PROCESSADO', NOW(), NOW()
        )
        ON CONFLICT (id)
        DO UPDATE SET event_type = EXCLUDED.event_type,
                      source_module = EXCLUDED.source_module,
                      entity_type = EXCLUDED.entity_type,
                      entity_id = EXCLUDED.entity_id,
                      payload = EXCLUDED.payload,
                      status = EXCLUDED.status,
                      updated_at = NOW()`,
        [id, type, moduleName, entityType, entityId, JSON.stringify(payload), 14 - i * 3, `demo-${type.toLowerCase()}-20260406`],
      );
    }
  }

  const recipientsResult = await client.query(
    `SELECT id
     FROM tb_usuarios
     WHERE ativo = TRUE
       AND deletado = FALSE
       AND id_perfil = ANY($1::int[])`,
    [[1, 2, 3]],
  );
  const recipients = recipientsResult.rows.map((row) => row.id);
  const cards = [
    ['SISTEMA', 'Conta a pagar em aberto', 'Novo lote aguardando aprovacao financeira.', IDS.lotes.aberto, 'tb_lotes_pagamento', IDS.notificationEvents[0]],
    ['SISTEMA', 'Conta a receber em aberto', 'Recebivel pendente para acompanhamento.', IDS.apropriacoes[1], 'tb_apropriacoes_financeiras', IDS.notificationEvents[1]],
    ['SISTEMA', 'OS aberta para execucao', 'Sessao diaria iniciada com alocacoes em andamento.', IDS.sessoes[0], 'tb_sessoes_diarias', IDS.notificationEvents[2]],
    ['SISTEMA', 'Preco pendente de aprovacao', 'Tabela de preco aguardando aprovacao do gestor.', IDS.tabelaPrecos[2], 'tb_tabela_precos', IDS.notificationEvents[3]],
  ];

  let idx = 0;
  for (const r of recipients) {
    for (let c = 0; c < cards.length; c += 1) {
      const notifId = IDS.notificacoes[idx] || deterministicUuid(`seed-notificacao-${r}-${c}`);
      const card = cards[c];

      await client.query(
        `INSERT INTO tb_notificacoes (
          id, id_usuario_destinatario, tipo, titulo, mensagem, prioridade,
          lida, clicada, lida_em, clicada_em, id_evento, dados_extras,
          id_entidade_relacionada, tipo_entidade, deletado, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'ALTA',
          $6, $7,
          CASE WHEN $6 THEN NOW() - INTERVAL '2 days' ELSE NULL END,
          CASE WHEN $7 THEN NOW() - INTERVAL '1 day' ELSE NULL END,
          $8, $9::jsonb,
          $10, $11, FALSE,
          NOW() - make_interval(days => $12::int),
          NOW()
        )
        ON CONFLICT (id)
        DO UPDATE SET id_usuario_destinatario = EXCLUDED.id_usuario_destinatario,
                      tipo = EXCLUDED.tipo,
                      titulo = EXCLUDED.titulo,
                      mensagem = EXCLUDED.mensagem,
                      prioridade = EXCLUDED.prioridade,
                      lida = EXCLUDED.lida,
                      clicada = EXCLUDED.clicada,
                      lida_em = EXCLUDED.lida_em,
                      clicada_em = EXCLUDED.clicada_em,
                      id_evento = EXCLUDED.id_evento,
                      dados_extras = EXCLUDED.dados_extras,
                      id_entidade_relacionada = EXCLUDED.id_entidade_relacionada,
                      tipo_entidade = EXCLUDED.tipo_entidade,
                      deletado = FALSE,
                      updated_at = NOW()`,
        [
          notifId,
          r,
          card[0],
          card[1],
          card[2],
          c % 2 === 0,
          c === 0,
          card[6],
          JSON.stringify({ origem: 'seed-demo', card: c + 1, perfil_destino: r }),
          card[3],
          card[4],
          6 + c,
        ],
      );

      idx += 1;
    }
  }
}

async function printSummary(client) {
  const summaryQueries = [
    ['clientes', 'SELECT COUNT(*)::int AS v FROM tb_clientes WHERE id = ANY($1::uuid[])', IDS.clientes],
    ['colaboradores', 'SELECT COUNT(*)::int AS v FROM tb_colaboradores WHERE id = ANY($1::uuid[])', IDS.colaboradores],
    ['servicos', 'SELECT COUNT(*)::int AS v FROM tb_servicos_catalogo WHERE id BETWEEN 9001 AND 9008', null],
    ['obras', 'SELECT COUNT(*)::int AS v FROM tb_obras WHERE id = ANY($1::uuid[])', IDS.obras],
    ['itens_ambiente', 'SELECT COUNT(*)::int AS v FROM tb_itens_ambiente WHERE id = ANY($1::uuid[])', IDS.itens],
    ['sessoes_os', 'SELECT COUNT(*)::int AS v FROM tb_sessoes_diarias WHERE id = ANY($1::uuid[])', IDS.sessoes],
    ['alocacoes_tarefa', 'SELECT COUNT(*)::int AS v FROM tb_alocacoes_tarefa WHERE id = ANY($1::uuid[])', IDS.alocacoesTarefa],
    ['medicoes_legado', 'SELECT COUNT(*)::int AS v FROM tb_medicoes WHERE id = ANY($1::uuid[])', IDS.medicoesLegacy],
    ['medicoes_colaborador', 'SELECT COUNT(*)::int AS v FROM tb_medicoes_colaborador WHERE id = ANY($1::uuid[])', IDS.medicoesColaborador],
    ['lotes_pagamento', 'SELECT COUNT(*)::int AS v FROM tb_lotes_pagamento WHERE id = ANY($1::uuid[])', [IDS.lotes.aberto, IDS.lotes.pago]],
    ['apropriacoes_financeiras', 'SELECT COUNT(*)::int AS v FROM tb_apropriacoes_financeiras WHERE id = ANY($1::uuid[])', IDS.apropriacoes],
    ['notificacoes', 'SELECT COUNT(*)::int AS v FROM tb_notificacoes WHERE id = ANY($1::uuid[])', IDS.notificacoes],
  ];

  const out = {};
  for (const [k, sql, arr] of summaryQueries) {
    try {
      const { rows } = arr ? await client.query(sql, [arr]) : await client.query(sql);
      out[k] = rows[0]?.v ?? 0;
    } catch {
      out[k] = 'n/a';
    }
  }

  console.log('SEED_DEMO_OK');
  console.log(JSON.stringify(out, null, 2));
  console.log('Credenciais demo (senha: Demo@2026):');
  console.log('- admin.demo@jbpinturas.com.br');
  console.log('- gestor.demo@jbpinturas.com.br');
  console.log('- financeiro.demo@jbpinturas.com.br');
  console.log('- encarregado1.demo@jbpinturas.com.br');
  console.log('- encarregado2.demo@jbpinturas.com.br');
}

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'postgres',
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    await cleanupDemoRows(client);
    await seedPerfisAndUsers(client);
    await seedClientes(client);
    await seedColaboradores(client);
    await seedServicos(client);
    await seedObrasEstrutura(client);
    await seedPrecos(client);
    await seedItensAmbiente(client);
    await seedOSAndMedicoes(client);
    await seedFinanceiro(client);
    await recalcProgress(client);
    await seedNotificacoes(client);

    await client.query('COMMIT');
    await printSummary(client);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
