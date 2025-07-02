// Função para exportar relatório do dashboard como PDF
async function exportarDashboardParaPDF({ incluirGrafico = false } = {}) {
  const { jsPDF } = window.jspdf;
  // Altere aqui para paisagem: 'l' (landscape)
  const doc = new jsPDF('l', 'mm', 'a4');
  let y = 18;

  // Título centralizado
  doc.setFontSize(18);
  doc.text('Relatório do Dashboard', 148.5, y, { align: 'center' }); // 297mm / 2 = 148.5mm para centralizar
  y += 10;

  // Data/hora
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 148.5, y, { align: 'center' });
  y += 10;

  if (incluirGrafico) {
    const canvas = document.getElementById('canvas-movimentacoes');
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      const graphWidth = 180;
      const graphHeight = 80;
      const graphX = (297 - graphWidth) / 2; // Centraliza na página A4 paisagem
      doc.addImage(imgData, 'PNG', graphX, y, graphWidth, graphHeight);
      y += graphHeight + 5;
    }
  }

  // Tabela de movimentações
  doc.setFontSize(13);
  doc.setTextColor(30);
  doc.text('Movimentações Recentes', 14, y + 8);
  y += 12;

  // Cabeçalho da tabela
  doc.setFontSize(10);
  doc.setFillColor(230, 230, 230);
  doc.rect(12, y, 273, 8, 'F'); // 273mm = 297mm - 24mm (margens)
  doc.setTextColor(50);

  // Defina as posições X de cada coluna (ajustadas para paisagem)
  const colunas = [
    { label: 'Data', x: 14, width: 22 },
    { label: 'Produto', x: 36, width: 36 },
    { label: 'Categoria', x: 72, width: 28 },
    { label: 'Marca', x: 100, width: 22 },
    { label: 'Local', x: 122, width: 22 },
    { label: 'Tipo', x: 144, width: 16 },
    { label: 'Qtd', x: 160, width: 14 },
    { label: 'Resp.', x: 174, width: 30 },
    { label: 'Est.Ant.', x: 204, width: 16 },
    { label: 'Est.Dep.', x: 220, width: 16 },
    { label: 'Motivo', x: 236, width: 20 },
    { label: 'Obs.', x: 256, width: 27 }
  ];

  // Cabeçalho
  colunas.forEach(col => {
    doc.text(col.label, col.x, y + 6);
  });
  y += 9;

  // Busca movimentações
  const token = localStorage.getItem('token');
  const res = await fetch('https://projeto-estoque-production.up.railway.app/api/movimentacoes', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) {
    alert('Erro ao buscar dados');
    return;
  }
  const movs = await res.json();

  // --- FILTROS IGUAIS AO CSV ---
  const tipoSelecionados = [];
  if (document.getElementById('relatorio-entrada')?.checked) tipoSelecionados.push('entrada');
  if (document.getElementById('relatorio-saida')?.checked) tipoSelecionados.push('saida');
  if (document.getElementById('relatorio-cadastro')?.checked) tipoSelecionados.push('cadastro');

  const dataInicio = document.getElementById('relatorio-data-inicio')?.value;
  const dataFim = document.getElementById('relatorio-data-fim')?.value;

  const movsFiltrados = movs.filter(mov => {
    const tipoOk = tipoSelecionados.includes(mov.tipo);
    let dataOk = true;
    if (dataInicio) dataOk = dataOk && new Date(mov.created_at) >= new Date(dataInicio);
    if (dataFim) dataOk = dataOk && new Date(mov.created_at) <= new Date(dataFim + 'T23:59:59');
    return tipoOk && dataOk;
  });

  doc.setFontSize(9);
  doc.setTextColor(80);
  // Linhas da tabela
  movsFiltrados.slice(0, 25).forEach(mov => {
    if (y > 190) { doc.addPage(); y = 18; } // ajuste para paisagem
    doc.setDrawColor(240);
    doc.line(13, y - 2, 285, y - 2);

    doc.text(new Date(mov.created_at).toLocaleDateString('pt-BR'), colunas[0].x, y);
    doc.text(String(mov.produto_nome || '').substring(0, 22), colunas[1].x, y);
    doc.text(String(mov.categoria || '').substring(0, 16), colunas[2].x, y);
    doc.text(String(mov.marca || '').substring(0, 12), colunas[3].x, y);
    doc.text(String(mov.localizacao_fisica || '').substring(0, 12), colunas[4].x, y);
    doc.text(String(mov.tipo || ''), colunas[5].x, y);
    doc.text(String(mov.quantidade || ''), colunas[6].x, y, { align: 'right' });
    doc.text(String(mov.responsavel_nome || '').substring(0, 18), colunas[7].x, y);
    doc.text(String(mov.estoque_atual_anterior ?? ''), colunas[8].x, y);
    doc.text(String(mov.estoque_atual_depois ?? ''), colunas[9].x, y);
    doc.text(String(mov.motivo || '').substring(0, 14), colunas[10].x, y);
    doc.text(String(mov.observacao || '').substring(0, 18), colunas[11].x, y);
    y += 8;
  });

  doc.save('relatorio_dashboard.pdf');
}