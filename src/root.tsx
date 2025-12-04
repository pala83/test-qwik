import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/shared/router-head/router-head";
import { inject } from "@vercel/analytics";

import "./global.css";

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  // Inyectar Vercel Analytics solo en el cliente y en producción
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    () => {
      if (!isDev) {
        inject();
      }
    },
    { strategy: "document-idle" },
  );

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />

        {/* Script bloqueante para evitar parpadeo de tema - debe ejecutarse antes del render */}
        <script
          dangerouslySetInnerHTML={`
            (function() {
              try {
                const theme = localStorage.getItem('theme-option');
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                if (theme === 'dark') {
                  root.classList.add('dark');
                } else if (theme === 'light') {
                  root.classList.add('light');
                } else {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark');
                  } else {
                    root.classList.add('light');
                  }
                }
              } catch (e) {}
            })();
          `}
        />
        {/* Estilo crítico para evitar flash - oculta contenido hasta que el tema esté listo */}
        <style
          dangerouslySetInnerHTML={`
            html:not(.dark):not(.light) body {
              visibility: hidden;
            }
          `}
        />
        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        <RouterHead />
      </head>
      <body lang="en">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
