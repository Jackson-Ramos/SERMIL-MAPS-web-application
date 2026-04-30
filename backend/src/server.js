require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const authMiddleware = require('./middleware/auth');
const errorHandler   = require('./middleware/errorHandler');

require('./db'); // inicializa o SQLite (cria/popula na primeira execução)

const app = express();

app.use(helmet());

// CORS: aceita uma lista separada por vírgula em FRONTEND_URL.
// Em dev, o padrão cobre as portas que o Vite costuma usar.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error(`Origem ${origin} não permitida pelo CORS`));
  },
}));

app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));

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
