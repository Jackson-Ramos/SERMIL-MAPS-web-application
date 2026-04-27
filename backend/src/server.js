const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const authMiddleware = require('./middleware/auth');
const errorHandler   = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Health check — usado pelo depends_on do docker-compose
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

// Rotas públicas
app.use('/api/auth', require('./routes/auth'));

// Rotas protegidas por JWT
app.use('/api/condominios', authMiddleware, require('./routes/condominios'));
app.use('/api/quadras',     authMiddleware, require('./routes/quadras'));
app.use('/api/lotes',       authMiddleware, require('./routes/lotes'));
app.use('/api/moradores',   authMiddleware, require('./routes/moradores'));
app.use('/api/usuarios',    authMiddleware, require('./routes/usuarios'));
app.use('/api/visita',      authMiddleware, require('./routes/visitas'));
app.use('/api/visitas',     authMiddleware, require('./routes/visitas'));
app.use('/api/qrcodes',     authMiddleware, require('./routes/qrcodes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend SERMIL rodando na porta ${PORT}`));
