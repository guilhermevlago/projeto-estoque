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
    preco_venda, estoque_atual,
    estoque_minimo, eh_kit, quantidade_por_kit, localizacao_id // novo: localizacao_id para estoque inicial
  } = req.body;

  if (!sku || !nome || isNaN(preco_venda) || preco_venda <= 0 || (estoque_atual !== undefined && estoque_atual < 0) || (estoque_minimo !== undefined && estoque_minimo < 0)) {
    return res.status(400).json({ error: 'Campos obrigatórios não informados ou valores negativos.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insere o produto (sem campo localizacao_fisica)
    const [result] = await conn.query(
      `INSERT INTO produto (sku, nome, descricao, categoria, marca, preco_venda, estoque_minimo, eh_kit, quantidade_por_kit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, nome, descricao, categoria, marca, preco_venda, estoque_minimo, eh_kit, quantidade_por_kit]
    );
    const novoProdutoId = result.insertId;

    // Se informado estoque inicial e local, insere em estoque_local
    if (estoque_atual && localizacao_id) {
      await conn.query(
        `INSERT INTO estoque_local (produto_id, localizacao_id, quantidade)
         VALUES (?, ?, ?)`,
        [novoProdutoId, localizacao_id, estoque_atual]
      );
    }

    // Registra movimentação de cadastro
    await conn.query(
      `INSERT INTO movimentacao 
        (produto_id, tipo, quantidade, responsavel_id, motivo, observacao)
        VALUES (?, 'cadastro', ?, ?, 'Cadastro de produto', '')`,
      [
        novoProdutoId,
        estoque_atual || 0,
        req.user.id, // O id do usuário logado (vem do middleware auth)
      ]
    );

    await conn.commit();
    res.status(201).json({ message: 'Produto cadastrado com sucesso.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Atualizar produto
router.put('/:id', autorizar([2, 3]), async (req, res) => {
  const { id } = req.params;
  const {
    sku, nome, descricao, categoria, marca,
    preco_venda, estoque_minimo, eh_kit, quantidade_por_kit
  } = req.body;
  try {
    // Busca dados atuais do produto
    const [rows] = await pool.query('SELECT * FROM produto WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    const dadosAnteriores = rows[0];

    // Atualiza o produto (sem campo localizacao_fisica, sem estoque_atual)
    await pool.query(
      `UPDATE produto SET sku=?, nome=?, descricao=?, categoria=?, marca=?, preco_venda=?, estoque_minimo=?, eh_kit=?, quantidade_por_kit=?
      WHERE id=?`,
      [sku, nome, descricao, categoria, marca, preco_venda, estoque_minimo, eh_kit, quantidade_por_kit, id]
    );

    // Registra movimentação de edição
    await pool.query(
      `INSERT INTO movimentacao 
        (produto_id, tipo, quantidade, responsavel_id, motivo, observacao,
         sku_anterior, nome_anterior, descricao_anterior, categoria_anterior, marca_anterior,
         preco_venda_anterior, estoque_minimo_anterior, eh_kit_anterior, quantidade_por_kit_anterior)
        VALUES (?, 'edicao', 0, ?, 'Edição de produto', '',
         ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        dadosAnteriores.sku,
        dadosAnteriores.nome,
        dadosAnteriores.descricao,
        dadosAnteriores.categoria,
        dadosAnteriores.marca,
        dadosAnteriores.preco_venda,
        dadosAnteriores.estoque_minimo,
        dadosAnteriores.eh_kit,
        dadosAnteriores.quantidade_por_kit
      ]
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
    // Exclui todas as movimentações do produto antes de excluir o produto (para evitar erro de FK)
    await pool.query('DELETE FROM movimentacao WHERE produto_id=?', [id]);
    await pool.query('DELETE FROM estoque_local WHERE produto_id=?', [id]);
    await pool.query('DELETE FROM produto WHERE id=?', [id]);
    res.json({ message: 'Produto excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;