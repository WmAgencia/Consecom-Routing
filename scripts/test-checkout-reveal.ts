import { revealEncryptedKey } from "../services/consecom-checkout/index.tsx";

let failures = 0;
function check(condition: boolean, label: string) {
  if (condition) {
    console.log("PASS " + label);
    return;
  }
  failures++;
  console.error("FAIL " + label);
}

function makeDb(initial: Array<{ encrypted_key: string }>, opts: { consume?: boolean } = {}) {
  const state = {
    rows: initial.map((row) => ({ ...row })),
    updates: 0,
    sql: [] as string[],
    updateValues: [] as unknown[],
  };
  const db = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.join("?");
    state.sql.push(sql);
    if (sql.includes("SELECT encrypted_key")) return state.rows.map((row) => ({ ...row }));
    if (sql.includes("SET encrypted_key=NULL")) {
      state.updates++;
      state.updateValues = values;
      const matches = state.rows.length > 0 && values.includes(state.rows[0].encrypted_key);
      if (opts.consume === false || !matches) return [];
      state.rows = [];
      return [{ id: values[0] }];
    }
    throw new Error("consulta inesperada: " + sql);
  };
  return { db: db as any, state };
}

const ciphertext = "Y2lwaGVydGV4dA==";
const orderId = "11111111-1111-1111-1111-111111111111";
const userId = "22222222-2222-2222-2222-222222222222";

// 1. A failed decryption must never consume the key.
{
  const { db, state } = makeDb([{ encrypted_key: ciphertext }]);
  const out = await revealEncryptedKey(db, userId, orderId, () => {
    throw new Error("bad secret");
  });
  check(out.status === "decrypt_failed", "falha na decriptação retorna decrypt_failed");
  check(state.updates === 0, "falha na decriptação não executa UPDATE");
  check(state.rows.length === 1, "falha na decriptação preserva o ciphertext");
}

// 2. Success reveals once and consumes the ciphertext.
{
  const { db, state } = makeDb([{ encrypted_key: ciphertext }]);
  const out = await revealEncryptedKey(db, userId, orderId, (value) => "sk-live-" + value.length);
  check(out.status === "revealed" && out.key === "sk-live-" + ciphertext.length, "sucesso devolve a chave em texto claro");
  check(state.updates === 1, "sucesso executa um único UPDATE");
  check(state.updateValues[2] === ciphertext, "UPDATE usa o ciphertext como condição (compare-and-swap)");
  const again = await revealEncryptedKey(db, userId, orderId, (value) => "sk-live-" + value.length);
  check(again.status === "missing", "segunda revelação retorna missing");
  check(state.updates === 1, "segunda revelação não executa novo UPDATE");
}

// 3. No stored key.
{
  const { db, state } = makeDb([]);
  const out = await revealEncryptedKey(db, userId, orderId, (value) => value);
  check(out.status === "missing", "pedido sem chave retorna missing");
  check(state.updates === 0, "pedido sem chave não executa UPDATE");
}

// 4. Lost race: another request consumed it between SELECT and UPDATE.
{
  const { db, state } = makeDb([{ encrypted_key: ciphertext }], { consume: false });
  const out = await revealEncryptedKey(db, userId, orderId, () => "plain");
  check(out.status === "missing", "perda da corrida retorna missing");
  check(!("key" in out), "perda da corrida não devolve plaintext");
  check(state.updates === 1, "perda da corrida registra o UPDATE sem efeito");
}

// 5. Ownership is part of every query.
{
  const { db, state } = makeDb([{ encrypted_key: ciphertext }]);
  await revealEncryptedKey(db, userId, orderId, (value) => value);
  check(state.sql.every((sql) => sql.includes("user_id")), "todas as consultas filtram por user_id");
}

if (failures) {
  console.error(`\n${failures} verificação(ões) falharam`);
  process.exit(1);
}
console.log("\nReveal do checkout: todas as verificações aprovadas.");
