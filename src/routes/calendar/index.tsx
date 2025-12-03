// src/routes/index.tsx
import { component$ } from "@builder.io/qwik";
import { useSession, useSignIn, useSignOut } from "../plugin@auth";

export default component$(() => {
  // 1. Obtenemos la sesión actual (se ejecuta en el servidor y se hidrata en el cliente)
  const session = useSession();

  // 2. Preparamos las acciones de Login y Logout
  const signIn = useSignIn();
  const signOut = useSignOut();

  return (
    <div class="container p-10">
      <h1>Bienvenido a la App de Turnos</h1>

      {/* Verificamos si hay sesión activa */}
      {session.value?.user ? (
        <div class="user-info rounded border bg-green-50 p-4">
          <h2>¡Hola, {session.value.user.name}!</h2>
          <p>Estás logueado como: {session.value.user.email}</p>

          <div class="mt-4">
            <img
              src={session.value.user.image || ""}
              alt="Avatar"
              class="h-16 w-16 rounded-full"
              width={64}
              height={64}
            />
          </div>

          <div class="mt-6">
            {/* Botón de Logout */}
            <button
              onClick$={() => signOut.submit({ redirectTo: "/" })} // <--- Cambia callbackUrl por redirectTo
              class="rounded bg-red-500 px-4 py-2 text-white"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      ) : (
        <div class="login-area rounded border bg-gray-50 p-4">
          <p>Debes iniciar sesión para gestionar o reservar turnos.</p>

          <div class="mt-4">
            {/* Botón de Login con Google */}
            <button
              onClick$={() =>
                signIn.submit({
                  providerId: "google",
                  options: { callbackUrl: "/calendar" },
                })
              }
              class="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Iniciar sesión con Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
