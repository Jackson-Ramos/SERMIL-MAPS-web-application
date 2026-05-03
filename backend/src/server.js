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
app.use(cors({ origin: true }));

app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));

// Endpoints públicos para o visitante (sem autenticação).
// Inclui leitura de condomínio/configurações/quadras/lotes e confirmação da visita.
app.use('/api/publica', require('./routes/publicas'));

app.use('/api/condominios', authMiddleware, require('./routes/condominios'));
app.use('/api/quadras',     authMiddleware, require('./routes/quadras'));
app.use('/api/lotes',       authMiddleware, require('./routes/lotes'));
app.use('/api/moradores',   authMiddleware, require('./routes/moradores'));
app.use('/api/usuarios',    authMiddleware, require('./routes/usuarios'));
app.use('/api/visita',      authMiddleware, require('./routes/visitas'));
app.use('/api/visitas',     authMiddleware, require('./routes/visitas'));
app.use('/api/qrcodes',     authMiddleware, require('./routes/qrcodes'));
app.use('/api/morador',     authMiddleware, require('./routes/morador'));
app.use('/api/eventos',     authMiddleware, require('./routes/eventos'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend SERMIL rodando na porta ${PORT}`));
