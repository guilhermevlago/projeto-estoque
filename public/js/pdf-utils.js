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
  doc.setFontSize(11);
  doc.setFillColor(230, 230, 230);
  doc.rect(12, y, 186, 9, 'F');
  doc.setTextColor(50);
  doc.text('Data', 15, y + 6);
  doc.text('Produto', 38, y + 6);
  doc.text('Tipo', 98, y + 6);
  doc.text('Qtd', 120, y + 6);
  doc.text('Responsável', 135, y + 6);
  doc.text('Obs.', 175, y + 6);
  y += 11;

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

  doc.setFontSize(10);
  doc.setTextColor(80);
  movs.slice(0, 25).forEach(mov => {
    if (y > 270) { doc.addPage(); y = 18; }
    // Pequeno espaçamento entre linhas (linha em branco)
    doc.setDrawColor(240);
    doc.line(13, y - 2, 197, y - 2);
    doc.text(new Date(mov.created_at).toLocaleDateString('pt-BR'), 15, y);
    doc.text(String(mov.produto_nome || '').substring(0, 25), 38, y);
    doc.text(String(mov.tipo || ''), 98, y);
    doc.text(String(mov.quantidade || ''), 120, y, { align: 'right' });
    doc.text(String(mov.responsavel_nome || '').substring(0, 22), 135, y);
    doc.text(String(mov.observacao || '').substring(0, 22), 175, y);
    y += 9; // aumenta o espaçamento entre as linhas
  });

  doc.save('relatorio_dashboard.pdf');
}