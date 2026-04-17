param(
  [string]$BaseUrl = 'http://localhost:3005/api/v1',
  [string]$Email = 'admin@jbpinturas.com.br',
  [string]$Password = 'Admin@2026',
  [switch]$Cleanup
)

$ErrorActionPreference = 'Stop'

function Get-Collection {
  param([object]$resp)
  if ($null -eq $resp) { return @() }
  if ($resp -is [array]) { return @($resp) }
  if ($resp.items) { return @($resp.items) }
  if ($resp.data) { return @($resp.data) }
  return @($resp)
}

function Try-Invoke {
  param(
    [scriptblock]$Action,
    [string]$Step
  )
  try {
    & $Action
  } catch {
    $message = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      $message = $_.ErrorDetails.Message
    }
    throw "[$Step] $message"
  }
}

$created = [ordered]@{
  sessao_id = $null
  created_sessao = $false
  item_ambiente_id = $null
  created_item_ambiente = $false
  alocacao_item_id = $null
  medicao_colaborador_id = $null
  vale_id = $null
  colaborador_id = $null
  aprovador_id = $null
}

Write-Host '== ERS 4.1 WRITE FLOW TEST =='
Write-Host "BaseUrl: $BaseUrl"

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Try-Invoke -Step 'auth/login' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'
}
$headers = @{ Authorization = "Bearer $($login.access_token)" }

$me = Try-Invoke -Step 'auth/me' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Method Get -Headers $headers
}
Write-Host "USER_ID=$($me.id)"

$usuarios = Get-Collection (Try-Invoke -Step 'usuarios/listar' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/usuarios" -Method Get -Headers $headers
})
$uuidV4Regex = '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
$aprovador = $usuarios | Where-Object { $_.id -match $uuidV4Regex } | Select-Object -First 1
if ($null -eq $aprovador) {
  throw 'Nenhum usuario com UUID v4 encontrado para aprovacao de vale'
}
$created.aprovador_id = $aprovador.id
Write-Host "APROVADOR_ID=$($created.aprovador_id)"

$colaboradores = Get-Collection (Try-Invoke -Step 'colaboradores/listar' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/colaboradores" -Method Get -Headers $headers
})
if ($colaboradores.Count -eq 0) {
  throw 'Sem colaboradores no ambiente'
}

$ambientes = Get-Collection (Try-Invoke -Step 'ambientes/listar' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/ambientes" -Method Get -Headers $headers
})
if ($ambientes.Count -eq 0) {
  throw 'Sem ambientes no ambiente'
}
$ambiente = $ambientes[0]
Write-Host "AMBIENTE_ID=$($ambiente.id)"

$itens = Get-Collection (Try-Invoke -Step 'itens-ambiente/ambiente' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/itens-ambiente/ambiente/$($ambiente.id)" -Method Get -Headers $headers
})
$item = $null
if ($itens.Count -gt 0) {
  $item = $itens[0]
  Write-Host "ITEM_AMBIENTE_EXISTENTE_ID=$($item.id)"
} else {
  $precos = Get-Collection (Try-Invoke -Step 'precos/listar' -Action {
    Invoke-RestMethod -Uri "$BaseUrl/precos" -Method Get -Headers $headers
  })
  if ($precos.Count -eq 0) {
    throw 'Sem precos para criar item de ambiente'
  }

  $novoItemBody = @{
    id_ambiente = $ambiente.id
    id_tabela_preco = $precos[0].id
    area_planejada = 10
  } | ConvertTo-Json

  $item = Try-Invoke -Step 'itens-ambiente/criar' -Action {
    Invoke-RestMethod -Uri "$BaseUrl/itens-ambiente" -Method Post -Headers $headers -Body $novoItemBody -ContentType 'application/json'
  }
  $created.created_item_ambiente = $true
  Write-Host "ITEM_AMBIENTE_CRIADO_ID=$($item.id)"
}
$created.item_ambiente_id = $item.id

$sessoesAbertas = Get-Collection (Try-Invoke -Step 'sessoes/listar-abertas' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/sessoes?status=ABERTA" -Method Get -Headers $headers
})

$sessao = $null
if ($sessoesAbertas.Count -gt 0) {
  $sessao = $sessoesAbertas[0]
  Write-Host "SESSAO_ABERTA_ID=$($sessao.id)"
} else {
  $agora = Get-Date
  $payloadSessao = @{
    data_sessao = $agora.ToString('yyyy-MM-dd')
    hora_inicio = $agora.ToString('yyyy-MM-ddTHH:mm:ssZ')
    assinatura_url = 'data:image/png;base64,test'
    observacoes = 'Teste automatizado ERS 4.1 write-flow'
  }
  if ($ambiente.id_obra) {
    $payloadSessao.id_obra = $ambiente.id_obra
  }

  $sessao = Try-Invoke -Step 'sessoes/criar' -Action {
    Invoke-RestMethod -Uri "$BaseUrl/sessoes" -Method Post -Headers $headers -Body ($payloadSessao | ConvertTo-Json) -ContentType 'application/json'
  }
  $created.created_sessao = $true
  Write-Host "SESSAO_CRIADA_ID=$($sessao.id)"
}
$created.sessao_id = $sessao.id

$alocacao = $null
foreach ($c in $colaboradores) {
  $payloadAloc = @{
    id_sessao = $created.sessao_id
    id_ambiente = $ambiente.id
    id_item_ambiente = $created.item_ambiente_id
    id_colaborador = $c.id
    observacoes = 'Teste automatizado ERS 4.1 write-flow'
  } | ConvertTo-Json

  try {
    $alocacao = Invoke-RestMethod -Uri "$BaseUrl/alocacoes-itens" -Method Post -Headers $headers -Body $payloadAloc -ContentType 'application/json'
    $created.colaborador_id = $c.id
    break
  } catch {
    $detail = $_.ErrorDetails.Message
    if ($detail -and $detail -match 'COLABORADOR_EM_CONFLITO_OPERACIONAL') {
      Write-Host "COLABORADOR_CONFLITO_ID=$($c.id)"
      continue
    }
    throw
  }
}

if ($null -eq $alocacao) {
  throw 'Nenhum colaborador elegivel para alocacao por item'
}
$created.alocacao_item_id = $alocacao.id
Write-Host "COLAB_ID=$($created.colaborador_id)"
Write-Host "ALOCACAO_ITEM_ID=$($created.alocacao_item_id)"

$payloadMedicao = @{
  id_alocacao_item = $created.alocacao_item_id
  id_colaborador = $created.colaborador_id
  id_item_ambiente = $created.item_ambiente_id
  qtd_executada = 1
  area_planejada = 10
  justificativa = 'Teste automatizado'
  foto_evidencia_url = 'https://example.com/evidencia.jpg'
  data_medicao = (Get-Date).ToString('yyyy-MM-dd')
} | ConvertTo-Json

$medicao = Try-Invoke -Step 'medicoes-colaborador/criar' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/medicoes-colaborador" -Method Post -Headers $headers -Body $payloadMedicao -ContentType 'application/json'
}
$created.medicao_colaborador_id = $medicao.id
Write-Host "MEDICAO_COLAB_ID=$($created.medicao_colaborador_id)"

$payloadVale = @{
  id_colaborador = $created.colaborador_id
  valor_solicitado = 200
  motivo = 'Teste automatizado ERS 4.1'
  qtd_parcelas_auto = 2
  data_primeira_parcela = (Get-Date).AddMonths(1).ToString('yyyy-MM-dd')
} | ConvertTo-Json

$vale = Try-Invoke -Step 'vale-adiantamento/criar' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/vale-adiantamento" -Method Post -Headers $headers -Body $payloadVale -ContentType 'application/json'
}
$created.vale_id = $vale.id
Write-Host "VALE_ID=$($created.vale_id) STATUS=$($vale.status)"

$payloadAprovar = @{
  id_aprovado_por = $created.aprovador_id
  valor_aprovado = 200
} | ConvertTo-Json
$valeAprovado = Try-Invoke -Step 'vale-adiantamento/aprovar' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/vale-adiantamento/$($created.vale_id)/aprovar" -Method Patch -Headers $headers -Body $payloadAprovar -ContentType 'application/json'
}
Write-Host "VALE_APROVADO_STATUS=$($valeAprovado.status)"

$valeLancado = Try-Invoke -Step 'vale-adiantamento/lancar' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/vale-adiantamento/$($created.vale_id)/lancar" -Method Patch -Headers $headers
}
Write-Host "VALE_LANCADO_STATUS=$($valeLancado.status)"

$payloadDesconto = @{
  valor_desconto = 100
  observacoes = 'Desconto parcial automatizado'
} | ConvertTo-Json
$valeDescontado = Try-Invoke -Step 'vale-adiantamento/descontar' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/vale-adiantamento/$($created.vale_id)/descontar" -Method Patch -Headers $headers -Body $payloadDesconto -ContentType 'application/json'
}
Write-Host "VALE_DESCONTADO_STATUS=$($valeDescontado.status)"

$resumo = Try-Invoke -Step 'vale-adiantamento/resumo' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/vale-adiantamento/$($created.vale_id)/resumo" -Method Get -Headers $headers
}
Write-Host "RESUMO_SALDO_DEVEDOR=$($resumo.saldo_devedor)"

$paraLote = Try-Invoke -Step 'financeiro/para-lote' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/financeiro/medicoes-colaborador/para-lote?id_colaborador=$($created.colaborador_id)" -Method Get -Headers $headers
}
$medicoesParaLote = @()
if ($null -ne $paraLote.medicoes) {
  $medicoesParaLote = @(Get-Collection $paraLote.medicoes)
} else {
  $medicoesParaLote = @(Get-Collection $paraLote)
}
Write-Host "PARA_LOTE_QTD=$($medicoesParaLote.Count)"

$apropriacao = Try-Invoke -Step 'financeiro/apropriacao-detalhada' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/financeiro/apropriacao-detalhada?id_colaborador=$($created.colaborador_id)&id_item_ambiente=$($created.item_ambiente_id)&page=1&limit=10" -Method Get -Headers $headers
}
Write-Host "APROPRIACAO_TOTAL_REGISTROS=$($apropriacao.paginacao.total_registros)"

$folha = Try-Invoke -Step 'financeiro/folha-individual' -Action {
  Invoke-RestMethod -Uri "$BaseUrl/financeiro/folha-individual?id_colaborador=$($created.colaborador_id)&page=1&limit=10" -Method Get -Headers $headers
}
Write-Host "FOLHA_TOTAL_REGISTROS=$($folha.paginacao.total_registros)"

Write-Host 'RESULT=PASS'

if ($Cleanup) {
  Write-Host '== CLEANUP =='

  if ($created.vale_id) {
    try {
      $cancelado = Invoke-RestMethod -Uri "$BaseUrl/vale-adiantamento/$($created.vale_id)/cancelar" -Method Patch -Headers $headers
      Write-Host "CLEANUP_VALE_STATUS=$($cancelado.status)"
    } catch {
      Write-Host "CLEANUP_VALE_WARN=$($_.Exception.Message)"
    }
  }

  if ($created.medicao_colaborador_id) {
    try {
      Invoke-RestMethod -Uri "$BaseUrl/medicoes-colaborador/$($created.medicao_colaborador_id)" -Method Delete -Headers $headers | Out-Null
      Write-Host 'CLEANUP_MEDICAO_OK=true'
    } catch {
      Write-Host "CLEANUP_MEDICAO_WARN=$($_.Exception.Message)"
    }
  }

  if ($created.alocacao_item_id) {
    try {
      Invoke-RestMethod -Uri "$BaseUrl/alocacoes-itens/$($created.alocacao_item_id)" -Method Delete -Headers $headers | Out-Null
      Write-Host 'CLEANUP_ALOCACAO_OK=true'
    } catch {
      Write-Host "CLEANUP_ALOCACAO_WARN=$($_.Exception.Message)"
    }
  }

  if ($created.created_item_ambiente -and $created.item_ambiente_id) {
    try {
      Invoke-RestMethod -Uri "$BaseUrl/itens-ambiente/$($created.item_ambiente_id)" -Method Delete -Headers $headers | Out-Null
      Write-Host 'CLEANUP_ITEM_AMBIENTE_OK=true'
    } catch {
      Write-Host "CLEANUP_ITEM_AMBIENTE_WARN=$($_.Exception.Message)"
    }
  }

  if ($created.created_sessao -and $created.sessao_id) {
    try {
      Invoke-RestMethod -Uri "$BaseUrl/sessoes/$($created.sessao_id)" -Method Delete -Headers $headers | Out-Null
      Write-Host 'CLEANUP_SESSAO_OK=true'
    } catch {
      Write-Host "CLEANUP_SESSAO_WARN=$($_.Exception.Message)"
    }
  }
}
