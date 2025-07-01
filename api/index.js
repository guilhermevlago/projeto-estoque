const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { autenticar, autorizar } = require('./middlewares/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Rota de login
app.use('/api/login', require('./routes/login'));

// Rotas protegidas
app.use('/api/usuarios', autenticar, autorizar([3]), require('./routes/usuarios'));
app.use('/api/produtos', autenticar, autorizar([1, 2, 3]), require('./routes/produtos'));
app.use('/api/movimentacoes', autenticar, autorizar([1, 2, 3]), require('./routes/movimentacoes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});