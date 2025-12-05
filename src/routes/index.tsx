import { component$, useSignal, $ } from "@builder.io/qwik";
import { Button, Input } from "~/components/ui";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useNavigate, Link } from "@builder.io/qwik-city";

export default component$(() => {
  const nav = useNavigate();
  const email = useSignal("");

  const handleSearch = $(() => {
    if (email.value) {
      // Redirigimos a la ruta de reserva con el email ingresado
      nav(`/reservar_turno/${email.value}`);
    }
  });

  return (
    <div class="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section>
        <div class="container mx-auto px-4 text-center">
          <h1 class="mb-6 text-4xl font-bold text-gray-900 md:text-6xl dark:text-white">
            Gestiona tus turnos con <span class="text-blue-600">Turnero</span>
          </h1>
          <p class="mx-auto mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            La forma más sencilla de organizar tu agenda. Conecta tu Google
            Calendar y permite que tus clientes reserven citas automáticamente
            sin conflictos.
          </p>

          {/* Search Box */}
          <div class="mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <label class="mb-2 block text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              Buscar profesional por email
            </label>
            <div class="flex items-center space-x-2">
              <Input
                id="search"
                class="rounded-l-sm"
                type="email"
                placeholder="ejemplo@gmail.com"
                bind:value={email}
                onKeyDown$={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                class="rounded-l-none"
                type="submit"
                look={"primary"}
                onClick$={handleSearch}
              >
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section class="py-16">
        <div class="container mx-auto px-4">
          <h2 class="mb-12 text-center text-3xl font-bold">¿Cómo funciona?</h2>
          <div class="grid gap-8 md:grid-cols-3">
            <div class="rounded-lg border p-6 text-center">
              <div class="mb-4 text-4xl">🔗</div>
              <h3 class="mb-2 text-xl font-semibold">1. Conecta</h3>
              <p class="text-gray-600 dark:text-gray-400">
                Inicia sesión con tu cuenta de Google para sincronizar tu
                calendario.
              </p>
            </div>
            <div class="rounded-lg border p-6 text-center">
              <div class="mb-4 text-4xl">⚙️</div>
              <h3 class="mb-2 text-xl font-semibold">2. Configura</h3>
              <p class="text-gray-600 dark:text-gray-400">
                Define tus horarios disponibles y la duración de tus citas.
              </p>
            </div>
            <div class="rounded-lg border p-6 text-center">
              <div class="mb-4 text-4xl">📅</div>
              <h3 class="mb-2 text-xl font-semibold">3. Comparte</h3>
              <p class="text-gray-600 dark:text-gray-400">
                Envía tu enlace personalizado a tus clientes para que reserven.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Transparency Section */}
      <section>
        <div class="container mx-auto px-4">
          <div class="mx-auto max-w-3xl text-center">
            <h2 class="mb-6 text-3xl font-bold">Tu privacidad es primero</h2>
            <p class="mb-8 text-lg text-gray-600 dark:text-gray-300">
              Turnero utiliza la API de Google Calendar para gestionar tus
              citas. Solo accedemos a tu calendario para:
            </p>
            <ul class="mb-8 text-left text-gray-600 md:pl-20 dark:text-gray-300">
              <li class="mb-2 flex items-start">
                <span class="mr-2 text-green-500">✓</span>
                Verificar tu disponibilidad y evitar conflictos.
              </li>
              <li class="mb-2 flex items-start">
                <span class="mr-2 text-green-500">✓</span>
                Crear un calendario público dedicado para tus citas.
              </li>
              <li class="mb-2 flex items-start">
                <span class="mr-2 text-green-500">✓</span>
                Agendar automáticamente las reservas de tus clientes.
              </li>
            </ul>
            <p class="text-sm text-gray-500">
              No almacenamos tus eventos privados ni compartimos tus datos con
              terceros.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer class="mt-auto py-8">
        <div class="container mx-auto px-4 text-center text-sm text-gray-500">
          <p class="mb-4">
            © {new Date().getFullYear()} Turnero. Todos los derechos
            reservados.
          </p>
          <div class="flex justify-center space-x-4">
            <Link
              href="/politica-de-privacidad"
              class="hover:text-blue-600 hover:underline"
            >
              Política de Privacidad
            </Link>
            <span>•</span>
            <a href="#" class="hover:text-blue-600 hover:underline">
              Términos de Servicio
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Turnero - Gestión de Citas con Google Calendar",
  meta: [
    {
      name: "description",
      content:
        "Gestiona tus citas y turnos fácilmente integrando tu Google Calendar. Permite que tus clientes reserven online.",
    },
  ],
};
