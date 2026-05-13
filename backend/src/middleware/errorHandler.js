function errorHandler(err, req, res, _next) {
  const status  = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  if (status === 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
