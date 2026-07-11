import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/admin/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SumboxPro | Super Admin",
  description: "Platform management for SumboxPro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 transition-colors`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
