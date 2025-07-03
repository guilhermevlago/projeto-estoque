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

// Preenche datalists de categoria, marca e localização física
async function preencherDatalistsProdutos(token) {
  try {
    const produtos = await fetchProdutos(token);
    // Categoria
    const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
    if (document.getElementById('listaCategorias')) {
      document.getElementById('listaCategorias').innerHTML = categorias.map(c => `<option value="${c}">`).join('');
    }
    // Marca
    const marcas = [...new Set(produtos.map(p => p.marca).filter(Boolean))];
    if (document.getElementById('listaMarcas')) {
      document.getElementById('listaMarcas').innerHTML = marcas.map(m => `<option value="${m}">`).join('');
    }
    // Localização física
    const locais = [...new Set(produtos.map(p => p.localizacao_fisica).filter(Boolean))];
    if (document.getElementById('listaLocalizacoes')) {
      document.getElementById('listaLocalizacoes').innerHTML = locais.map(l => `<option value="${l}">`).join('');
    }
  } catch {}
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