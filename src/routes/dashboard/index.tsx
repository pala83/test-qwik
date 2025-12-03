import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  z,
  Form,
  zod$,
} from "@builder.io/qwik-city";
import { getCalendarEvents, createCalendarEvent } from "~/helpers/calendar";

// 1. Loader para LEER eventos (Server-Side)
export const useCalendarEvents = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get("session") as any;
  const accessToken = session?.accessToken;

  if (!accessToken) {
    throw requestEvent.redirect(302, "/");
  }

  // Calculamos rango: Hoy hasta 1 mes
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(now.getMonth() + 1);

  try {
    const data = await getCalendarEvents(
      "primary",
      accessToken,
      "", // API Key no necesaria si tenemos token
      now.toISOString(),
      nextMonth.toISOString(),
    );
    return data.items || [];
  } catch (error) {
    console.error("Error loading events", error);
    return [];
  }
});

// 2. Action para CREAR un turno (Server-Side)
export const useCreateBooking = routeAction$(
  async (data, requestEvent) => {
    const session = requestEvent.sharedMap.get("session") as any;
    const accessToken = session?.accessToken;

    if (!accessToken) return { success: false, error: "No autorizado" };

    try {
      await createCalendarEvent(accessToken, {
        summary: `Turno: ${data.clientName}`,
        description: `Servicio para ${data.clientEmail}`,
        start: { dateTime: data.startTime },
        end: { dateTime: data.endTime },
      });
      return { success: true };
    } catch (error) {
      console.error("Error creating booking", error);
      return { success: false, error: "Error al crear turno" };
    }
  },
  zod$({
    clientName: z.string(),
    clientEmail: z.string().email(),
    startTime: z.string(),
    endTime: z.string(),
  }),
);

export default component$(() => {
  const events = useCalendarEvents();
  const bookingAction = useCreateBooking();

  return (
    <div class="p-5">
      <h1>Panel de Control</h1>

      <h2>Próximos Turnos Ocupados (Google Calendar)</h2>
      <ul>
        {events.value.map((event: any) => (
          <li key={event.id}>
            {event.summary} - {new Date(event.start.dateTime).toLocaleString()}
          </li>
        ))}
      </ul>

      <hr />

      <h2>Agendar Nuevo Turno</h2>
      <Form action={bookingAction}>
        <input name="clientName" placeholder="Nombre del cliente" />
        <input name="clientEmail" placeholder="Email del cliente" />
        <input name="startTime" type="datetime-local" />
        <input name="endTime" type="datetime-local" />
        <button type="submit">Reservar</button>
      </Form>
    </div>
  );
});
