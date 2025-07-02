const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Listar todos os usuários (exceto admin)
router.get('/', async (req, res) => {
  try {
    // Supondo que o admin tem usuario = 'admin'
    const [rows] = await pool.query('SELECT id, nome, usuario, perfil FROM usuario WHERE usuario <> "admin"');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar usuário por ID (exceto admin)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, usuario, perfil FROM usuario WHERE id = ? AND usuario <> "admin"', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar usuário (solicita senha do usuário logado)
router.post('/', async (req, res) => {
  const { nome, usuario, senha, perfil, senha_confirmacao, usuario_logado_id } = req.body;
  if (!nome || !usuario || !senha || !perfil || !senha_confirmacao || !usuario_logado_id) {
    return res.status(400).json({ error: 'Dados obrigatórios não informados.' });
  }
  try {
    // Verifica senha do usuário logado
    const [userRows] = await pool.query('SELECT senha FROM usuario WHERE id=?', [usuario_logado_id]);
    if (!userRows.length) return res.status(401).json({ error: 'Usuário logado não encontrado.' });
    if (senha_confirmacao !== userRows[0].senha) {
      return res.status(401).json({ error: 'Senha de confirmação incorreta.' });
    }
    await pool.query(
      'INSERT INTO usuario (nome, usuario, senha, perfil) VALUES (?, ?, ?, ?)',
      [nome, usuario, senha, perfil]
    );
    res.status(201).json({ message: 'Usuário criado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar usuário (solicita senha do usuário logado)
router.put('/:id', async (req, res) => {
  const { nome, usuario, senha, perfil, senha_confirmacao, usuario_logado_id } = req.body;
  if (!nome || !usuario || !perfil || !senha_confirmacao || !usuario_logado_id) {
    return res.status(400).json({ error: 'Dados obrigatórios não informados.' });
  }
  try {
    // Não permite editar o admin
    const [rows] = await pool.query('SELECT usuario FROM usuario WHERE id=?', [req.params.id]);
    if (rows.length && rows[0].usuario === 'admin') {
      return res.status(403).json({ error: 'Usuário admin só pode ser editado diretamente no banco.' });
    }
    // Verifica senha do usuário logado
    const [userRows] = await pool.query('SELECT senha FROM usuario WHERE id=?', [usuario_logado_id]);
    if (!userRows.length) return res.status(401).json({ error: 'Usuário logado não encontrado.' });
    if (senha_confirmacao !== userRows[0].senha) {
      return res.status(401).json({ error: 'Senha de confirmação incorreta.' });
    }
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

// Excluir usuário (solicita senha do usuário logado)
router.delete('/:id', async (req, res) => {
  const { senha_confirmacao, usuario_logado_id } = req.body;
  if (!senha_confirmacao || !usuario_logado_id) {
    return res.status(400).json({ error: 'Confirmação de senha obrigatória.' });
  }
  try {
    // Não permite excluir o admin
    const [rows] = await pool.query('SELECT usuario FROM usuario WHERE id=?', [req.params.id]);
    if (rows.length && rows[0].usuario === 'admin') {
      return res.status(403).json({ error: 'Não é permitido excluir o usuário administrador.' });
    }
    // Verifica senha do usuário logado
    const [userRows] = await pool.query('SELECT senha FROM usuario WHERE id=?', [usuario_logado_id]);
    if (!userRows.length) return res.status(401).json({ error: 'Usuário logado não encontrado.' });
    if (senha_confirmacao !== userRows[0].senha) {
      return res.status(401).json({ error: 'Senha de confirmação incorreta.' });
    }
    await pool.query('DELETE FROM usuario WHERE id=?', [req.params.id]);
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;