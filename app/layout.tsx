import type { Metadata } from "next";
import "./styles/global.scss";
import { ThemeProvider } from "next-themes";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
