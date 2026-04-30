-- =============================================================================
-- SERMIL MAPS — Dados Iniciais (Seed)
-- Aplicado por backend/src/db.js após o schema.
--
-- SENHA PADRÃO DO ADMIN: Sermil@2026
-- Para gerar um novo hash:
--   node -e "const b=require('bcryptjs'); console.log(b.hashSync('SuaSenha', 10));"
-- =============================================================================

INSERT INTO condominios (nome, cidade, estado, ramal_portaria)
VALUES ('Residencial Jardim das Flores', 'Brasília', 'DF', '9000');

INSERT INTO configuracoes (
    cond_id, tempo_maximo_visita,
    mapa_interno_ativo, google_maps_ativo, waze_ativo,
    ramal_flutuante_ativo, expiracao_automatica_ativa
) VALUES (1, 60, 1, 1, 1, 1, 1);

INSERT INTO quadras (cond_id, nome) VALUES (1, 'A');
INSERT INTO quadras (cond_id, nome) VALUES (1, 'B');
INSERT INTO quadras (cond_id, nome) VALUES (1, 'C');
INSERT INTO quadras (cond_id, nome) VALUES (1, 'D');

-- Lotes Quadra A
INSERT INTO lotes (quadra_id, numero, latitude, longitude) VALUES (1, '01', -15.7942287, -47.8821658);
INSERT INTO lotes (quadra_id, numero, latitude, longitude) VALUES (1, '02', -15.7943100, -47.8822400);
INSERT INTO lotes (quadra_id, numero, latitude, longitude) VALUES (1, '03', -15.7944000, -47.8823200);
INSERT INTO lotes (quadra_id, numero, latitude, longitude) VALUES (1, '04', -15.7944900, -47.8824000);

-- Lotes Quadra B
INSERT INTO lotes (quadra_id, numero, latitude, longitude) VALUES (2, '01', -15.7950000, -47.8830000);
INSERT INTO lotes (quadra_id, numero, latitude, longitude) VALUES (2, '02', -15.7951000, -47.8831000);

-- Usuários (senha: Sermil@2026)
INSERT INTO usuarios (cond_id, nome, email, senha_hash, role, ativo)
VALUES (1, 'Administrador', 'admin@sermilmaps.com',
        '$2a$10$S8QHFCr4ipWsua3s166aMOMGX9RYFcHf1z3W0u1LxJHcTYc1Cisba',
        'admin', 1);

INSERT INTO usuarios (cond_id, nome, email, senha_hash, role, ativo)
VALUES (1, 'Porteiro Principal', 'porteiro@sermilmaps.com',
        '$2a$10$S8QHFCr4ipWsua3s166aMOMGX9RYFcHf1z3W0u1LxJHcTYc1Cisba',
        'porteiro', 1);

-- Moradores
INSERT INTO moradores (lote_id, nome, cpf, ramal) VALUES (1, 'Carlos Alberto Souza',  '123.456.789-00', '9001');
INSERT INTO moradores (lote_id, nome, cpf, ramal) VALUES (2, 'Mariana Ferreira Lima', '987.654.321-00', '9002');
INSERT INTO moradores (lote_id, nome, cpf, ramal) VALUES (3, 'Roberto Alves Costa',   '456.789.123-00', '9003');

-- QR Codes de exemplo
INSERT INTO qr_codes (cond_id, criado_por, nome_portao, token, url, ativo, uso_unico)
VALUES (1, 1, 'Portão Principal',
        'sermil-token-portao-principal-exemplo-0001',
        'http://localhost:3000/v/entrada?token=sermil-token-portao-principal-exemplo-0001',
        1, 0);

INSERT INTO qr_codes (cond_id, criado_por, nome_portao, token, url, ativo, uso_unico)
VALUES (1, 1, 'Portão Lateral',
        'sermil-token-portao-lateral-exemplo-0002',
        'http://localhost:3000/v/entrada?token=sermil-token-portao-lateral-exemplo-0002',
        1, 0);
