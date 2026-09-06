// Layout raiz do /admin — sem auth check (cada página faz o seu).
// O /admin/login usa este layout (sem sidebar), todas as outras usam
// AdminShellLayout via (admin)/layout.tsx que faz auth.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
