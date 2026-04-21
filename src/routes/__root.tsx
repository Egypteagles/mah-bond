import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "بيننا — تفاعل يومي بين الأب وابنه" },
      {
        name: "description",
        content:
          "تطبيق يومي يجمع الأب وابنه المراهق في كبسولة دافئة: سؤال، تحدي، ولحظة. كل واحد يدخل في وقته.",
      },
      { property: "og:title", content: "بيننا — تفاعل يومي بين الأب وابنه" },
      {
        property: "og:description",
        content:
          "كبسولة يومية مشتركة: سؤال، تحدي، ولحظة. اقرب لابنك أو لأبوك بدقايق في اليوم.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "بيننا — تفاعل يومي بين الأب وابنه" },
      { name: "description", content: "My Day's Echo is an interactive daily app for fathers and sons to connect asynchronously." },
      { property: "og:description", content: "My Day's Echo is an interactive daily app for fathers and sons to connect asynchronously." },
      { name: "twitter:description", content: "My Day's Echo is an interactive daily app for fathers and sons to connect asynchronously." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/ogaOyShftIU7GxBfHLw2I3iT0Q23/social-images/social-1776787260299-1000014524.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/ogaOyShftIU7GxBfHLw2I3iT0Q23/social-images/social-1776787260299-1000014524.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">٤٠٤</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة مش موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط ده مش متاح، ارجع للصفحة الرئيسية.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          الرجوع للرئيسية
        </a>
      </div>
    </div>
  );
}
