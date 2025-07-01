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

// Criar movimentação
router.post('/', async (req, res) => {
  const {
    produto_id, tipo, quantidade, responsavel_id,
    motivo, observacao, dados_anteriores
  } = req.body;
  if (!produto_id || !tipo || !quantidade || !responsavel_id) {
    return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Atualiza o estoque do produto
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
      (produto_id, tipo, quantidade, responsavel_id, motivo, observacao, dados_anteriores)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [produto_id, tipo, quantidade, responsavel_id, motivo, observacao, dados_anteriores]
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

// Atualizar movimentação
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    produto_id, tipo, quantidade, responsavel_id,
    motivo, observacao, dados_anteriores
  } = req.body;
  if (!produto_id || !tipo || !quantidade || !responsavel_id) {
    return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
  }
  try {
    await pool.query(
      `UPDATE movimentacao SET produto_id=?, tipo=?, quantidade=?, responsavel_id=?, motivo=?, observacao=?, dados_anteriores=?
       WHERE id=?`,
      [produto_id, tipo, quantidade, responsavel_id, motivo, observacao, dados_anteriores, id]
    );
    res.json({ message: 'Movimentação atualizada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir movimentação
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM movimentacao WHERE id=?', [req.params.id]);
    res.json({ message: 'Movimentação excluída com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;