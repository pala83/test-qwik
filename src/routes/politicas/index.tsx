import { component$ } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="container mx-auto max-w-4xl p-8">
      <h1 class="mb-6 text-3xl font-bold">Política de Privacidad</h1>

      <div class="prose dark:prose-invert">
        <p class="mb-4">
          Última actualización: {new Date().toLocaleDateString()}
        </p>

        <h2 class="mt-6 mb-3 text-xl font-semibold">1. Introducción</h2>
        <p>
          Bienvenido a Turnero ("nosotros", "nuestro"). Nos comprometemos a
          proteger su privacidad y a garantizar que sus datos personales se
          manejen de manera segura y responsable. Esta Política de Privacidad
          explica cómo recopilamos, usamos y protegemos su información cuando
          utiliza nuestra aplicación de gestión de citas integrada con Google
          Calendar.
        </p>

        <h2 class="mt-6 mb-3 text-xl font-semibold">2. Datos que recopilamos</h2>
        <p>
          Para proporcionar nuestros servicios, solicitamos acceso a cierta
          información de su cuenta de Google:
        </p>
        <ul class="mb-4 list-disc pl-6">
          <li>
            <strong>Información básica del perfil:</strong> Nombre, dirección de
            correo electrónico y foto de perfil para identificar su cuenta y
            personalizar su experiencia.
          </li>
          <li>
            <strong>Google Calendar:</strong> Acceso para ver, editar, compartir
            y eliminar permanentemente sus calendarios. Esto es estrictamente
            necesario para:
            <ul class="mt-2 list-disc pl-6">
              <li>
                Crear un calendario dedicado a la aplicación ("MiApp - Agenda
                Pública") donde se gestionarán sus citas.
              </li>
              <li>
                Leer sus eventos existentes para calcular su disponibilidad real
                y evitar conflictos de horarios.
              </li>
              <li>
                Crear nuevos eventos automáticamente cuando un cliente reserva
                una cita con usted.
              </li>
            </ul>
          </li>
        </ul>

        <h2 class="mt-6 mb-3 text-xl font-semibold">
          3. Cómo utilizamos sus datos
        </h2>
        <p>Utilizamos la información recopilada exclusivamente para:</p>
        <ul class="mb-4 list-disc pl-6">
          <li>Permitirle configurar y gestionar su disponibilidad.</li>
          <li>
            Permitir que otros usuarios vean sus horarios disponibles (sin
            revelar detalles de sus eventos privados).
          </li>
          <li>Agendar citas automáticamente en su Google Calendar.</li>
          <li>
            Facilitar la comunicación de detalles de citas entre usted y sus
            clientes.
          </li>
        </ul>
        <p>
          <strong>
            No vendemos, alquilamos ni compartimos sus datos personales con
            terceros para fines publicitarios o comerciales.
          </strong>
        </p>

        <h2 class="mt-6 mb-3 text-xl font-semibold">
          4. Almacenamiento y Seguridad
        </h2>
        <p>
          Nuestra aplicación funciona integrándose directamente con las API de
          Google. Sus datos de calendario se procesan en tiempo real. No
          almacenamos copias de sus eventos privados en nuestros servidores
          permanentemente. Utilizamos protocolos de seguridad estándar (HTTPS)
          para todas las comunicaciones.
        </p>

        <h2 class="mt-6 mb-3 text-xl font-semibold">
          5. Uso de Servicios de Google
        </h2>
        <p>
          El uso y la transferencia de la información recibida de las API de
          Google a cualquier otra aplicación cumplirán con la{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            class="text-blue-600 hover:underline"
          >
            Política de datos de usuario de los servicios de API de Google
          </a>
          , incluidos los requisitos de uso limitado.
        </p>

        <h2 class="mt-6 mb-3 text-xl font-semibold">6. Sus Derechos</h2>
        <p>
          Usted tiene control total sobre sus datos. Puede revocar el acceso de
          nuestra aplicación a su cuenta de Google en cualquier momento a través
          de la{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            class="text-blue-600 hover:underline"
          >
            página de configuración de seguridad de Google
          </a>
          .
        </p>

        <h2 class="mt-6 mb-3 text-xl font-semibold">7. Contacto</h2>
        <p>
          Si tiene preguntas sobre esta Política de Privacidad o sobre cómo
          manejamos sus datos, puede contactarnos a través de los canales de
          soporte de la aplicación.
        </p>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Política de Privacidad - Turnero",
  meta: [
    {
      name: "description",
      content: "Política de privacidad y uso de datos de Turnero",
    },
  ],
};
