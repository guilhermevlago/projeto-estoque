const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { autorizar } = require('../middlewares/auth');

// Listar todos os locais
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM local_estoque ORDER BY nome');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar local
router.post('/', autorizar([2, 3]), async (req, res) => {
  const { nome } = req.body;
  
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Nome do local é obrigatório.' });
  }

  try {
    await pool.query('INSERT INTO local_estoque (nome) VALUES (?)', [nome.trim()]);
    res.status(201).json({ message: 'Local criado com sucesso.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe um local com este nome.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Atualizar local
router.put('/:id', autorizar([2, 3]), async (req, res) => {
  const { nome, ativo } = req.body;
  
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Nome do local é obrigatório.' });
  }

  try {
    await pool.query(
      'UPDATE local_estoque SET nome=?, ativo=? WHERE id=?',
      [nome.trim(), ativo, req.params.id]
    );
    res.json({ message: 'Local atualizado com sucesso.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe um local com este nome.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Excluir local
router.delete('/:id', autorizar([3]), async (req, res) => {
  try {
    await pool.query('DELETE FROM local_estoque WHERE id=?', [req.params.id]);
    res.json({ message: 'Local excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;