'use client';

export function LogoutButton() {
  return (
    <form action="/v1/admin/logout" method="post" className="mt-2">
      <button type="submit" className="text-xs text-fg-muted hover:text-danger">
        Sair
      </button>
    </form>
  );
}
