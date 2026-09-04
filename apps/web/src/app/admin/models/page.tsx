import { apiFetch } from '@/lib/api';
import { ToggleModelButton } from './_components/toggle-model-button';

interface Model {
  id: string;
  code: string;
  displayName: string;
  providerCode: string;
  inputPricePer1kCents: number;
  outputPricePer1kCents: number;
  status: 'active' | 'disabled';
}

export default async function AdminModelsPage() {
  let models: Model[] = [];
  try {
    const res = await apiFetch<{ data: Model[] }>('/v1/admin/models');
    models = res.data;
  } catch {
    models = [];
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">Modelos</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {models.length} modelo{models.length !== 1 ? 's' : ''} cadastrado{models.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-fg-muted/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel/50 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-4 py-3">Provedor</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3 text-right">Input/1k</th>
              <th className="px-4 py-3 text-right">Output/1k</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-t border-fg-muted/10">
                <td className="px-4 py-3 font-mono text-xs">{m.providerCode}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{m.displayName}</div>
                  <div className="font-mono text-xs text-fg-muted">{m.code}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  ${(m.inputPricePer1kCents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  ${(m.outputPricePer1kCents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      m.status === 'active'
                        ? 'rounded bg-success/15 px-2 py-0.5 text-xs text-success'
                        : 'rounded bg-fg-muted/15 px-2 py-0.5 text-xs text-fg-muted'
                    }
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ToggleModelButton modelId={m.id} status={m.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
