# LiteLLM

O LiteLLM fornece a camada interna de compatibilidade, autenticação, contabilização e roteamento.

Sua configuração de modelos fica na variável selada `LITELLM_CONFIG_YAML`. O arquivo `config.example.yaml` documenta somente a estrutura e não contém credenciais.

O serviço deve usar o healthcheck `/health/readiness` e pelo menos 2 GB de memória para operação com folga.

