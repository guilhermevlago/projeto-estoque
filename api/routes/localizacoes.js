const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Listar todas as localizações
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM localizacao');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cadastrar nova localização
router.post('/', async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório.' });
  try {
    await pool.query('INSERT INTO localizacao (nome, descricao) VALUES (?, ?)', [nome, descricao]);
    res.status(201).json({ message: 'Local cadastrado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar localização
router.put('/:id', async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório.' });
  try {
    await pool.query('UPDATE localizacao SET nome=?, descricao=? WHERE id=?', [nome, descricao, req.params.id]);
    res.json({ message: 'Local atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remover localização
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM localizacao WHERE id=?', [req.params.id]);
    res.json({ message: 'Local removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;