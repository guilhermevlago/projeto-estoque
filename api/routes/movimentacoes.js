const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Listar todas as movimentações (agora trazendo o nome do local)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, p.nome as produto_nome, u.nome as responsavel_nome, l.nome as local_nome
       FROM movimentacao m
       JOIN produto p ON m.produto_id = p.id
       JOIN usuario u ON m.responsavel_id = u.id
       LEFT JOIN localizacao l ON m.localizacao_id = l.id
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
      `SELECT m.*, p.nome as produto_nome, u.nome as responsavel_nome, l.nome as local_nome
       FROM movimentacao m
       JOIN produto p ON m.produto_id = p.id
       JOIN usuario u ON m.responsavel_id = u.id
       LEFT JOIN localizacao l ON m.localizacao_id = l.id
       WHERE m.id = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Movimentação não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar movimentação (entrada/saída)
router.post('/', async (req, res) => {
  const {
    produto_id, tipo, quantidade, responsavel_id,
    motivo, observacao, localizacao_id,
    sku_anterior, nome_anterior, descricao_anterior, categoria_anterior, marca_anterior,
    preco_venda_anterior, estoque_minimo_anterior,
    eh_kit_anterior, quantidade_por_kit_anterior
  } = req.body;

  if (!produto_id || !tipo || !quantidade || !responsavel_id || !localizacao_id) {
    return res.status(400).json({ error: 'Campos obrigatórios não informados.' });
  }
  if (quantidade <= 0) {
    return res.status(400).json({ error: 'Quantidade deve ser maior que zero.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Validação de estoque por local na saída
    if (tipo === 'saida') {
      const [[estoqueLocal]] = await conn.query(
        'SELECT quantidade FROM estoque_local WHERE produto_id = ? AND localizacao_id = ?',
        [produto_id, localizacao_id]
      );
      if (!estoqueLocal || estoqueLocal.quantidade < quantidade) {
        await conn.rollback();
        return res.status(400).json({ error: 'Estoque insuficiente neste local.' });
      }
    }

    // Registra a movimentação
    await conn.query(
      `INSERT INTO movimentacao 
      (produto_id, tipo, quantidade, responsavel_id, motivo, observacao,
       localizacao_id,
       sku_anterior, nome_anterior, descricao_anterior, categoria_anterior, marca_anterior,
       preco_venda_anterior, estoque_minimo_anterior,
       eh_kit_anterior, quantidade_por_kit_anterior)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        produto_id, tipo, quantidade, responsavel_id, motivo, observacao,
        localizacao_id,
        sku_anterior, nome_anterior, descricao_anterior, categoria_anterior, marca_anterior,
        preco_venda_anterior, estoque_minimo_anterior,
        eh_kit_anterior, quantidade_por_kit_anterior
      ]
    );

    // Atualiza estoque_local conforme o tipo
    if (tipo === 'entrada') {
      await conn.query(
        `INSERT INTO estoque_local (produto_id, localizacao_id, quantidade)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)`,
        [produto_id, localizacao_id, quantidade]
      );
    } else if (tipo === 'saida') {
      await conn.query(
        `UPDATE estoque_local SET quantidade = quantidade - ? WHERE produto_id = ? AND localizacao_id = ?`,
        [quantidade, produto_id, localizacao_id]
      );
    }

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