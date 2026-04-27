# =============================================================================
# SERMIL MAPS — n8n com Oracle Instant Client
#
# Base: node:20-slim (Debian/glibc) para compatibilidade com Oracle Instant
# Client, que é compilado contra glibc. A imagem oficial n8nio/n8n usa Alpine
# (musl libc) e não é compatível sem shims instáveis.
#
# Modo Thin (oracledb v6+): se o oracledb instalado com o n8n for v6 ou superior,
# o Oracle Instant Client NÃO é necessário. Comente o bloco marcado "THICK MODE"
# abaixo e remova libaio1, curl e unzip das dependências para uma imagem menor.
# =============================================================================

FROM node:20-slim

# Dependências de sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libaio1 \
    curl \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# THICK MODE — Oracle Instant Client 21.9 Basic Lite
# Comente este bloco inteiro se oracledb v6+ estiver em uso (modo Thin).
# Para verificar a versão: docker exec sermil_n8n node -e "require('oracledb').versionString"
# Para baixar outra versão: https://www.oracle.com/database/technologies/instant-client/downloads.html
# =============================================================================
RUN curl -fsSL \
      "https://download.oracle.com/otn_software/linux/instantclient/219000/instantclient-basiclite-linux.x64-21.9.0.0.0dbru.zip" \
      -o /tmp/ic.zip \
    && unzip /tmp/ic.zip -d /opt/oracle \
    && rm /tmp/ic.zip \
    && echo "/opt/oracle/instantclient_21_9" > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_9
ENV ORACLE_HOME=/opt/oracle/instantclient_21_9
# =============================================================================

# Instala n8n globalmente (inclui n8n-nodes-base com o nó Oracle Database)
RUN npm install -g n8n

# Diretório de dados do n8n e pasta de workflows para importação
RUN mkdir -p /home/node/.n8n /home/node/workflows \
    && chown -R node:node /home/node

USER node
WORKDIR /home/node

EXPOSE 5678

# Importa todos os workflows da pasta montada e inicia o n8n.
# O "2>/dev/null || true" evita falha se a pasta estiver vazia na primeira run.
CMD ["sh", "-c", "n8n import:workflow --separate --input=/home/node/workflows/ 2>/dev/null || true; n8n start"]
