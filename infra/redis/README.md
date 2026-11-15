# Redis

Imagem atual: `redis:8.2`, fixada por digest no manifesto Railway.

O serviço exige `REDIS_PASSWORD`, escuta apenas na rede privada e monta `redis-volume` em `/data`.

A configuração atual desabilita AOF e snapshots. O Redis deve ser tratado como cache descartável.

