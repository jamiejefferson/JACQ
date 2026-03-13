import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "Jacq",
  description: "Your very own ViPA",
};

const CRITICAL_CSS =
  ":root{--jacq-bg:#f5f2ec;--jacq-surf:#fff;--jacq-surf2:#ede8e1;--jacq-surf3:#e3ddd5;--jacq-bord:rgba(0,0,0,.08);--jacq-bord2:rgba(0,0,0,.04);--jacq-t1:#1a1710;--jacq-t2:#7a7268;--jacq-t3:#aea79e;--jacq-gold:#b8935a;--jacq-goldl:rgba(184,147,90,.1);--jacq-goldb:rgba(184,147,90,.22);--jacq-green:#3a9468;--jacq-amber:#c07b28;--jacq-red:#c0443a;--jacq-blue:#3060b8}" +
  '[data-theme="dark"]{--jacq-bg:#131108;--jacq-surf:#1c1a12;--jacq-surf2:#242218;--jacq-surf3:#2c2a20;--jacq-bord:rgba(255,255,255,.07);--jacq-bord2:rgba(255,255,255,.03);--jacq-t1:#ede8df;--jacq-t2:#787060;--jacq-t3:#48443c}' +
  "html,body{margin:0;min-height:100%;box-sizing:border-box}body{min-height:100vh;min-height:100dvh;background-color:var(--jacq-bg);color:var(--jacq-t1);font-family:\"DM Sans\",system-ui,sans-serif;-webkit-font-smoothing:antialiased}" +
  ".mobile-container{min-height:100vh;min-height:100dvh;width:100%;max-width:none}.mobile-container>div{display:flex;flex:1 1 0%;flex-direction:column;min-height:0}" +
  "@media (min-width:768px){body{background-color:#2d2d2d!important;box-sizing:border-box;height:100vh;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px 0;overflow:hidden}.mobile-container{width:375px;height:calc(100vh - 40px);max-height:calc(100vh - 40px);margin:0 auto;border-radius:2rem;overflow:hidden;background-color:var(--jacq-bg);box-shadow:0 0 0 1px rgba(0,0,0,.06);display:flex;flex-direction:column;flex-shrink:0}.mobile-container>div{flex:1 1 0;min-height:0;overflow:auto}}";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ minHeight: "100%" }}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Gilda+Display&family=Instrument+Serif:ital@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <QueryProvider>
            <div className="mobile-container min-h-screen">
              <div className="flex min-h-screen flex-1 flex-col min-h-0 min-[768px]:min-h-0">
                {children}
              </div>
            </div>
          </QueryProvider>
        </Providers>
      </body>
    </html>
  );
}
