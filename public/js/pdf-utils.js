// Função para exportar relatório do dashboard como PDF
async function exportarDashboardParaPDF({ incluirGrafico = false } = {}) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 18;

  // Título centralizado
  doc.setFontSize(18);
  doc.text('Relatório do Dashboard', 105, y, { align: 'center' });
  y += 10;

  // Data/hora
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, y, { align: 'center' });
  y += 10;

  // Cards do dashboard em duas colunas
  doc.setFontSize(12);
  doc.setTextColor(30);
  const cards = document.querySelectorAll('#dashboard-cards .card');
  let cardData = [];
  cards.forEach(card => {
    const titulo = card.querySelector('.card-title')?.textContent || '';
    const valor = card.querySelector('.display-4')?.textContent || '';
    cardData.push({ titulo, valor });
  });
  // Exibe em duas colunas
  let cardX1 = 20, cardX2 = 110, cardY = y;
  for (let i = 0; i < cardData.length; i += 2) {
    doc.setFont(undefined, 'bold');
    doc.text(cardData[i].titulo + ':', cardX1, cardY);
    doc.setFont(undefined, 'normal');
    doc.text(String(cardData[i].valor), cardX1 + 50, cardY);
    if (cardData[i + 1]) {
      doc.setFont(undefined, 'bold');
      doc.text(cardData[i + 1].titulo + ':', cardX2, cardY);
      doc.setFont(undefined, 'normal');
      doc.text(String(cardData[i + 1].valor), cardX2 + 50, cardY);
    }
    cardY += 8;
  }
  y = cardY + 5;

  if (incluirGrafico) {
    const canvas = document.getElementById('canvas-movimentacoes');
    if (canvas) {
      await html2canvas(canvas).then(canvasEl => {
        const imgData = canvasEl.toDataURL('image/png');
        // Proporção do canvas: 400x350px ≈ 105x92mm (1px ≈ 0.2646mm)
        const graphWidth = 125;
        const graphHeight = 80;
        const graphX = (210 - graphWidth) / 2; // Centraliza na página A4
        doc.addImage(imgData, 'PNG', graphX, y, graphWidth, graphHeight);
        y += graphHeight + 5;
      });
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
  doc.rect(12, y, 186, 8, 'F');
  doc.setTextColor(50);

  // Defina as posições X de cada coluna
  const colunas = [
    { label: 'Data', x: 14, width: 18 },
    { label: 'Produto', x: 32, width: 28 },
    { label: 'Categoria', x: 60, width: 22 },
    { label: 'Marca', x: 82, width: 18 },
    { label: 'Local', x: 100, width: 18 },
    { label: 'Tipo', x: 118, width: 14 },
    { label: 'Qtd', x: 132, width: 12 },
    { label: 'Resp.', x: 144, width: 22 },
    { label: 'Est.Ant.', x: 166, width: 12 },
    { label: 'Est.Dep.', x: 178, width: 12 },
    { label: 'Motivo', x: 190, width: 18 },
    { label: 'Obs.', x: 208, width: 18 }
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
    if (y > 270) { doc.addPage(); y = 18; }
    doc.setDrawColor(240);
    doc.line(13, y - 2, 197, y - 2);

    doc.text(new Date(mov.created_at).toLocaleDateString('pt-BR'), colunas[0].x, y);
    doc.text(String(mov.produto_nome || '').substring(0, 18), colunas[1].x, y);
    doc.text(String(mov.categoria || '').substring(0, 12), colunas[2].x, y);
    doc.text(String(mov.marca || '').substring(0, 10), colunas[3].x, y);
    doc.text(String(mov.localizacao_fisica || '').substring(0, 10), colunas[4].x, y);
    doc.text(String(mov.tipo || ''), colunas[5].x, y);
    doc.text(String(mov.quantidade || ''), colunas[6].x, y, { align: 'right' });
    doc.text(String(mov.responsavel_nome || '').substring(0, 14), colunas[7].x, y);
    doc.text(String(mov.estoque_atual_anterior ?? ''), colunas[8].x, y);
    doc.text(String(mov.estoque_atual_depois ?? ''), colunas[9].x, y);
    doc.text(String(mov.motivo || '').substring(0, 10), colunas[10].x, y);
    doc.text(String(mov.observacao || '').substring(0, 10), colunas[11].x, y);
    y += 8;
  });

  doc.save('relatorio_dashboard.pdf');
}