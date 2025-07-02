const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Listar todas as movimentações
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, p.nome as produto_nome, u.nome as responsavel_nome
       FROM movimentacao m
       JOIN produto p ON m.produto_id = p.id
       JOIN usuario u ON m.responsavel_id = u.id
       ORDER BY m.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar movimentação por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, p.nome as produto_nome, u.nome as responsavel_nome
       FROM movimentacao m
       JOIN produto p ON m.produto_id = p.id
       JOIN usuario u ON m.responsavel_id = u.id
       WHERE m.id = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Movimentação não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar movimentação (exemplo para edição de produto)
router.post('/', async (req, res) => {
  const {
    produto_id, tipo, quantidade, responsavel_id,
    motivo, observacao,
    sku_anterior, nome_anterior, descricao_anterior, categoria_anterior, marca_anterior,
    localizacao_fisica_anterior, preco_venda_anterior, estoque_atual_anterior, estoque_minimo_anterior,
    eh_kit_anterior, quantidade_por_kit_anterior
  } = req.body;

  if (!produto_id || !tipo || !quantidade || !responsavel_id) {
    return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
  }
  if (quantidade <= 0) {
    return res.status(400).json({ error: 'Quantidade deve ser maior que zero.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verifica estoque antes de saída
    if (tipo === 'saida') {
      const [[produto]] = await conn.query('SELECT estoque_atual FROM produto WHERE id = ?', [produto_id]);
      if (!produto) {
        await conn.rollback();
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }
      if (produto.estoque_atual < quantidade) {
        await conn.rollback();
        return res.status(400).json({ error: 'Estoque insuficiente para saída.' });
      }
    }

    // Atualiza o estoque do produto se for entrada/saída
    let sqlEstoque = '';
    if (tipo === 'entrada') {
      sqlEstoque = 'UPDATE produto SET estoque_atual = estoque_atual + ? WHERE id = ?';
    } else if (tipo === 'saida') {
      sqlEstoque = 'UPDATE produto SET estoque_atual = estoque_atual - ? WHERE id = ?';
    }
    if (sqlEstoque) {
      await conn.query(sqlEstoque, [quantidade, produto_id]);
    }

    // Registra a movimentação
    await conn.query(
      `INSERT INTO movimentacao 
      (produto_id, tipo, quantidade, responsavel_id, motivo, observacao,
       sku_anterior, nome_anterior, descricao_anterior, categoria_anterior, marca_anterior,
       localizacao_fisica_anterior, preco_venda_anterior, estoque_atual_anterior, estoque_minimo_anterior,
       eh_kit_anterior, quantidade_por_kit_anterior)
      VALUES (?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?)`,
      [
        produto_id, tipo, quantidade, responsavel_id, motivo, observacao,
        sku_anterior, nome_anterior, descricao_anterior, categoria_anterior, marca_anterior,
        localizacao_fisica_anterior, preco_venda_anterior, estoque_atual_anterior, estoque_minimo_anterior,
        eh_kit_anterior, quantidade_por_kit_anterior
      ]
    );

    await conn.commit();
    res.status(201).json({ message: 'Movimentação registrada com sucesso.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;