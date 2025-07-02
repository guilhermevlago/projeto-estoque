export function gerarCSVMovimentacoes(movs) {
  const header = [
    'Data',
    'Produto',
    'Categoria',
    'Marca',
    'Localização',
    'Tipo',
    'Quantidade',
    'Responsável',
    'Estoque Antes',
    'Estoque Depois',
    'Motivo',
    'Observação'
  ];
  let csv = header.join(',') + '\n';

  movs.forEach(mov => {
    csv += [
      new Date(mov.created_at).toLocaleDateString('pt-BR'),
      `"${mov.produto_nome || ''}"`,
      `"${mov.categoria || ''}"`,
      `"${mov.marca || ''}"`,
      `"${mov.localizacao_fisica || ''}"`,
      mov.tipo,
      mov.quantidade,
      `"${mov.responsavel_nome || ''}"`,
      mov.estoque_atual_anterior != null ? mov.estoque_atual_anterior : '',
      mov.estoque_atual_depois != null ? mov.estoque_atual_depois : '',
      `"${mov.motivo || ''}"`,
      `"${mov.observacao || ''}"`
    ].join(',') + '\n';
  });

  return csv;
}