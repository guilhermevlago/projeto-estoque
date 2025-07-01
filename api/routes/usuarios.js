const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, usuario, perfil FROM usuario');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, usuario, perfil FROM usuario WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar usuário
router.post('/', async (req, res) => {
  const { nome, usuario, senha, perfil } = req.body;
  if (!nome || !usuario || !senha || !perfil) {
    return res.status(400).json({ error: 'Dados obrigatórios não informados.' });
  }
  try {
    await pool.query(
      'INSERT INTO usuario (nome, usuario, senha, perfil) VALUES (?, ?, ?, ?)',
      [nome, usuario, senha, perfil]
    );
    res.status(201).json({ message: 'Usuário criado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
  const { nome, usuario, senha, perfil } = req.body;
  if (!nome || !usuario || !perfil) {
    return res.status(400).json({ error: 'Dados obrigatórios não informados.' });
  }
  try {
    // Atualiza senha apenas se enviada
    if (senha) {
      await pool.query(
        'UPDATE usuario SET nome=?, usuario=?, senha=?, perfil=? WHERE id=?',
        [nome, usuario, senha, perfil, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE usuario SET nome=?, usuario=?, perfil=? WHERE id=?',
        [nome, usuario, perfil, req.params.id]
      );
    }
    res.json({ message: 'Usuário atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir usuário
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuario WHERE id=?', [req.params.id]);
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;