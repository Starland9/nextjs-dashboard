import "@/app/ui/global.css";
import { poppins } from "./ui/fonts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Landry Dashboard",
    default: "Landry Dashboard",
  },
  description: "The official Next.js Learn Dashboard built with App Router.",
  metadataBase: new URL("https://next-learn-dashboard.vercel.sh"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>{children}</body>
    </html>
  );
}
