-- A contabilidade de tokens não é reproduzível a partir deste repositório.
-- Criar uma tabela vazia aqui faria o bloqueio de franquias falhar em silêncio.
DO $$
BEGIN
  IF to_regclass('consecom_usage_accounted') IS NULL THEN
    RAISE EXCEPTION 'consecom_usage_accounted ausente: restaure a definição de produção (pg_dump --schema-only -t consecom_usage_accounted) antes de iniciar os serviços';
  END IF;
END
$$;
