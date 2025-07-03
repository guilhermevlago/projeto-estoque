const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Retorna o saldo por local de um produto
router.get('/:produto_id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT el.quantidade, el.localizacao_id, l.nome as local_nome
       FROM estoque_local el
       JOIN localizacao l ON el.localizacao_id = l.id
       WHERE el.produto_id = ?`,
      [req.params.produto_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Opcional) Retorna todos os estoques por local (para relatórios, etc)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT el.produto_id, el.localizacao_id, l.nome as local_nome, el.quantidade
       FROM estoque_local el
       JOIN localizacao l ON el.localizacao_id = l.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;