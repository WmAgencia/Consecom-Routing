import { requireSession } from '@/lib/api';

export default async function SettingsPage() {
  const user = await requireSession();
  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold">Configurações</h1>
      </header>

      <div className="mt-8 rounded-lg border border-fg-muted/15 bg-bg-panel p-6">
        <h2 className="text-sm font-medium text-fg-muted">Conta</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Função" value={user.role} />
          <Field label="Status" value={user.status} />
          <Field label="Criada em" value={new Date(user.createdAt).toLocaleString('pt-BR')} />
        </dl>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="mt-1 font-mono">{value}</dd>
    </div>
  );
}
