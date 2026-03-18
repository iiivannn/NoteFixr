import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NoteFixr",
  description: "AI-powered notepad",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
