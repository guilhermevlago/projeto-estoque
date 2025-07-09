// Redireciona se não estiver logado ou não tiver perfil permitido
function verificarLogin({ redirect = '../index.html', perfilPermitido = null } = {}) {
  const token = localStorage.getItem('token');
  const perfil = localStorage.getItem('perfil');
  if (!token || (perfilPermitido && !perfilPermitido.includes(perfil))) {
    window.location.href = redirect;
  }
}

// Busca produtos da API
async function fetchProdutos(token) {
  const res = await fetch('https://projeto-estoque-production.up.railway.app/api/produtos', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('Erro ao buscar produtos');
  return res.json();
}

// Função para buscar locais ativos
async function fetchLocaisAtivos(token) {
  const res = await fetch('https://projeto-estoque-production.up.railway.app/api/locais', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('Erro ao buscar locais');
  const locais = await res.json();
  return locais.filter(l => l.ativo);
}

// Preenche um <select> com produtos (usado em entrada/saida)
async function preencherSelectProdutos(selectId, token) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const produtos = await fetchProdutos(token);
    select.innerHTML = '<option value="">Selecione um produto</option>' +
      produtos.map(p => `<option value="${p.id}">${p.nome} (${p.sku}) — Qtde: ${p.estoque_atual ?? 0}</option>`).join('');
  } catch {
    select.innerHTML = '<option value="">Erro ao carregar produtos</option>';
  }
}

// Preenche um <select> com locais ativos (usado no cadastro)
async function preencherSelectLocais(selectId, token) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const locais = await fetchLocaisAtivos(token);
    select.innerHTML = '<option value="">Selecione um local</option>' +
      locais.map(l => `<option value="${l.nome}">${l.nome}</option>`).join('');
  } catch {
    select.innerHTML = '<option value="">Erro ao carregar locais</option>';
  }
}

// Exibe mensagem de erro ou sucesso
function exibirMensagem(id, texto, tipo = 'erro') {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = texto;
    el.className = tipo === 'erro' ? 'text-danger mb-3 fw-semibold' : 'text-success mb-3 fw-semibold';
  }
}

// Limpa mensagens de vários ids
function limparMensagens(ids = []) {
  ids.forEach(id => exibirMensagem(id, '', 'erro'));
}

// Decodifica o payload do JWT para pegar o id do usuário
function getIdUsuarioLogado() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch {
    return null;
  }
}

// Formata moeda para exibição
function formatarMoeda(valor) {
  return valor !== undefined && valor !== null
    ? 'R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : '-';
}

function logout() {
  localStorage.clear();
  window.location.href = '../index.html';
}