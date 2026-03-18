export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      {/* Sidebar goes here later */}
      <main>{children}</main>
    </div>
  );
}
