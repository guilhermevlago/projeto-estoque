const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post('/', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM usuario WHERE usuario = ?', [usuario]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });

    const user = rows[0];

    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });

    const token = jwt.sign(
      { id: user.id, perfil: user.perfil, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, perfil: user.perfil, nome: user.nome });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;