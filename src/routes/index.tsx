import { component$, useSignal, $ } from "@builder.io/qwik";
import { Button, Input } from "~/components/ui";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useNavigate } from "@builder.io/qwik-city";

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
    <>
      <div class="flex flex-col justify-start gap-4 p-10">
        <h1 class="text-lg font-bold">Email del profesional</h1>
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
      {/*
      
    <div class="container p-10">
      <h1>Bienvenido a la App de Turnos</h1>

      {session.value?.user ? (
        <div class="user-info rounded border bg-green-50 p-4">
          <h2>¡Hola, {session.value.user.name}!</h2>
          <p>Estás logueado como: {session.value.user.email}</p>

          <div class="mt-4">
            <img
              src={session.value.user.image || ""}
              alt="Avatar"
              class="h-16 w-16 rounded-full"
            />
          </div>

          <div class="mt-6">
            <Button
              look={"alert"}
              onClick$={() => signOut.submit({ redirectTo: "/" })} // <--- Cambia callbackUrl por redirectTo
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      ) : (
        <div class="login-area rounded border bg-gray-50 p-4">
          <p>Debes iniciar sesión para gestionar o reservar turnos.</p>

          <div class="mt-4">
            <Button
              look={"primary"}
              onClick$={() =>
                signIn.submit({
                  providerId: "google",
                })
              }
            >
              Iniciar sesión con Google
            </Button>
          </div>
        </div>
      )}
    </div>
      */}
    </>
  );
});

export const head: DocumentHead = {
  title: "Turnero",
  meta: [
    {
      name: "Pagina principal",
      content:
        "Desde aqui se puede buscar una agenda por email o acceder a tu propia agenda",
    },
  ],
};
