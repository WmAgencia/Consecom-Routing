# Contribuição

## Fluxo

1. Crie uma branch a partir de `main`.
2. Faça mudanças pequenas e relacionadas.
3. Execute `npm run check`.
4. Abra um pull request descrevendo comportamento, risco e validação.
5. Aguarde a verificação automática antes de integrar.

## Commits

Use mensagens objetivas:

- `feat:` nova capacidade;
- `fix:` correção de comportamento;
- `docs:` documentação;
- `chore:` manutenção;
- `security:` correção de segurança.

## Regras de segurança

- Nunca inclua valores reais de variáveis.
- Nunca copie cookies ou respostas de autenticação para arquivos.
- Não registre corpos completos de requisições que possam conter prompts ou chaves.
- Use dados fictícios nos testes.
- Mudanças em autenticação, cobrança e revelação de chaves exigem revisão adicional.

## Implantação

Um merge não deve alterar a Railway sem uma etapa explícita de implantação. Consulte `docs/DEPLOYMENT.md`.

