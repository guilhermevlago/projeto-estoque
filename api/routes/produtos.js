const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { autorizar } = require('../middlewares/auth');

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM produto');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM produto WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cadastro de produto
router.post('/', autorizar([2, 3]), async (req, res) => {
  const {
    sku, nome, descricao, categoria, marca,
    localizacao_fisica, preco_venda, estoque_atual,
    estoque_minimo, eh_kit, quantidade_por_kit
  } = req.body;

  if (!sku || !nome || isNaN(preco_venda) || preco_venda <= 0) {
    return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
  }

  try {
    // Insere o produto
    const [result] = await pool.query(
      `INSERT INTO produto (sku, nome, descricao, categoria, marca, localizacao_fisica, preco_venda, estoque_atual, estoque_minimo, eh_kit, quantidade_por_kit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, nome, descricao, categoria, marca, localizacao_fisica, preco_venda, estoque_atual, estoque_minimo, eh_kit, quantidade_por_kit]
    );
    const novoProdutoId = result.insertId;

    // Registra movimentação de cadastro
    await pool.query(
      `INSERT INTO movimentacao 
        (produto_id, tipo, quantidade, responsavel_id, motivo, observacao, dados_anteriores)
        VALUES (?, 'cadastro', ?, ?, 'Cadastro de produto', '', NULL)`,
      [
        novoProdutoId,
        estoque_atual || 0,
        req.user.id, // O id do usuário logado (vem do middleware auth)
      ]
    );

    res.status(201).json({ message: 'Produto cadastrado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar produto
router.put('/:id', autorizar([2, 3]), async (req, res) => {
  const { id } = req.params;
  const {
    sku, nome, descricao, categoria, marca, localizacao_fisica,
    preco_venda, estoque_atual, estoque_minimo, eh_kit, quantidade_por_kit
  } = req.body;
  try {
    await pool.query(
      `UPDATE produto SET sku=?, nome=?, descricao=?, categoria=?, marca=?, localizacao_fisica=?, preco_venda=?, estoque_atual=?, estoque_minimo=?, eh_kit=?, quantidade_por_kit=?
      WHERE id=?`,
      [sku, nome, descricao, categoria, marca, localizacao_fisica, preco_venda, estoque_atual, estoque_minimo, eh_kit, quantidade_por_kit, id]
    );
    res.json({ message: 'Produto atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir produto
router.delete('/:id', autorizar([3]), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produto WHERE id=?', [id]);
    res.json({ message: 'Produto excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;