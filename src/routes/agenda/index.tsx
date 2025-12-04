import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { Button } from "~/components/ui";
import {
  findAppCalendar,
  createAppCalendar,
  getCalendarEvents,
  generateAvailableSlots,
  getAppointments,
  cancelAppointment,
  type GoogleCalendar,
  type CalendarEvent,
  type AppointmentScheduleConfig,
  type AppointmentSlot,
  APP_CALENDAR_NAME,
  APPOINTMENT_EVENT_PREFIX,
} from "~/helpers/calendar";

// Configuración por defecto de la agenda de citas
const DEFAULT_SCHEDULE_CONFIG: AppointmentScheduleConfig = {
  slotDurationMinutes: 30,
  availableDays: [1, 2, 3, 4, 5], // Lunes a Viernes
  startHour: 9,
  endHour: 18,
  breakStartHour: 13,
  breakEndHour: 14,
};

// Loader para obtener el calendario de la app y el access token
export const useAppCalendar = routeLoader$(async ({ sharedMap }) => {
  const session = sharedMap.get("session") as {
    accessToken?: string;
    user?: { email?: string; name?: string };
  } | null;

  if (!session?.accessToken) {
    return {
      calendar: null,
      error: "No autenticado",
      accessToken: null,
      user: null,
    };
  }

  try {
    const calendar = await findAppCalendar(session.accessToken);
    return {
      calendar,
      error: null,
      accessToken: session.accessToken,
      user: session.user,
    };
  } catch (error) {
    console.error("Error al buscar calendario:", error);
    return {
      calendar: null,
      error: "Error al obtener calendarios",
      accessToken: session.accessToken,
      user: session.user,
    };
  }
});

// Server action para crear el calendario
const createCalendarAction = server$(async function (accessToken: string) {
  try {
    const calendar = await createAppCalendar(accessToken);
    return { calendar, error: null };
  } catch (error) {
    console.error("Error al crear calendario:", error);
    return {
      calendar: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
});

// Server action para obtener eventos del calendario
const getCalendarEventsAction = server$(async function (
  calendarId: string,
  accessToken: string,
) {
  try {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 30 días adelante

    const events = await getCalendarEvents(
      calendarId,
      accessToken,
      "",
      timeMin,
      timeMax,
    );
    return { events: events.items || [], error: null };
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return {
      events: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
});

// Server action para obtener citas reservadas
const getAppointmentsAction = server$(async function (
  calendarId: string,
  accessToken: string,
) {
  try {
    const appointments = await getAppointments(accessToken, calendarId);
    return { appointments, error: null };
  } catch (error) {
    console.error("Error al obtener citas:", error);
    return {
      appointments: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
});

// Server action para cancelar una cita
const cancelAppointmentAction = server$(async function (
  calendarId: string,
  accessToken: string,
  eventId: string,
) {
  try {
    await cancelAppointment(accessToken, calendarId, eventId);
    return { success: true, error: null };
  } catch (error) {
    console.error("Error al cancelar cita:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
});

// Días de la semana
const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export default component$(() => {
  const appCalendarData = useAppCalendar();
  const calendar = useSignal<GoogleCalendar | null>(
    appCalendarData.value.calendar,
  );
  const events = useSignal<CalendarEvent[]>([]);
  const appointments = useSignal<CalendarEvent[]>([]);
  const availableSlots = useSignal<AppointmentSlot[]>([]);
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(appCalendarData.value.error);
  const activeTab = useSignal<"eventos" | "citas" | "configurar">("citas");

  // Configuración de la agenda de citas
  const scheduleConfig = useSignal<AppointmentScheduleConfig>(
    DEFAULT_SCHEDULE_CONFIG,
  );

  // Cargar eventos y citas cuando hay un calendario
  useTask$(async ({ track }) => {
    track(() => calendar.value);

    if (calendar.value && appCalendarData.value.accessToken) {
      // Cargar eventos
      const eventsResult = await getCalendarEventsAction(
        calendar.value.id,
        appCalendarData.value.accessToken,
      );
      if (eventsResult.error) {
        error.value = eventsResult.error;
      } else {
        events.value = eventsResult.events;

        // Generar slots disponibles basados en los eventos
        availableSlots.value = generateAvailableSlots(
          scheduleConfig.value,
          eventsResult.events,
          14, // 2 semanas
        );
      }

      // Cargar citas reservadas
      const appointmentsResult = await getAppointmentsAction(
        calendar.value.id,
        appCalendarData.value.accessToken,
      );
      if (!appointmentsResult.error) {
        appointments.value = appointmentsResult.appointments;
      }
    }
  });

  const handleCreateCalendar = $(async () => {
    if (!appCalendarData.value.accessToken) {
      error.value = "No hay token de acceso";
      return;
    }

    isLoading.value = true;
    error.value = null;

    const result = await createCalendarAction(
      appCalendarData.value.accessToken,
    );

    if (result.error) {
      error.value = result.error;
    } else if (result.calendar) {
      calendar.value = result.calendar;
    }

    isLoading.value = false;
  });

  const handleCancelAppointment = $(async (eventId: string) => {
    if (!calendar.value || !appCalendarData.value.accessToken) return;

    isLoading.value = true;
    const result = await cancelAppointmentAction(
      calendar.value.id,
      appCalendarData.value.accessToken,
      eventId,
    );

    if (result.error) {
      error.value = result.error;
    } else {
      // Recargar citas
      const appointmentsResult = await getAppointmentsAction(
        calendar.value.id,
        appCalendarData.value.accessToken,
      );
      if (!appointmentsResult.error) {
        appointments.value = appointmentsResult.appointments;
      }
    }
    isLoading.value = false;
  });

  const handleDayToggle = $((dayValue: number) => {
    const currentDays = [...scheduleConfig.value.availableDays];
    const index = currentDays.indexOf(dayValue);

    if (index > -1) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(dayValue);
      currentDays.sort((a, b) => a - b);
    }

    scheduleConfig.value = {
      ...scheduleConfig.value,
      availableDays: currentDays,
    };

    // Regenerar slots
    availableSlots.value = generateAvailableSlots(
      scheduleConfig.value,
      events.value,
      14,
    );
  });

  // Si no está autenticado
  if (!appCalendarData.value.accessToken) {
    return (
      <div class="flex flex-col items-center justify-center gap-4 p-8">
        <div class="text-center">
          <h1 class="mb-2 text-2xl font-bold">Mi Agenda</h1>
          <p class="text-gray-600 dark:text-gray-400">
            Debes iniciar sesión para ver tu agenda
          </p>
        </div>
      </div>
    );
  }

  // Si no tiene el calendario de la app
  if (!calendar.value) {
    return (
      <div class="flex flex-col items-center justify-center gap-4 p-8">
        <div class="max-w-md text-center">
          <h1 class="mb-2 text-2xl font-bold">Crear Agenda Pública</h1>
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            No tienes un calendario público configurado para esta aplicación.
            Crea uno para que otros usuarios puedan ver tu disponibilidad y
            reservar turnos.
          </p>
          <div class="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              <strong>📅 Calendario:</strong> "{APP_CALENDAR_NAME}"
            </p>
            <p class="mt-1 text-xs text-blue-600 dark:text-blue-400">
              Este calendario será visible públicamente y podrás gestionarlo
              desde Google Calendar.
            </p>
          </div>
          {error.value && (
            <div class="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p class="text-sm text-red-700 dark:text-red-300">
                {error.value}
              </p>
            </div>
          )}
          <Button
            look="primary"
            onClick$={handleCreateCalendar}
            disabled={isLoading.value}
          >
            {isLoading.value ? "Creando..." : "Crear Calendario Público"}
          </Button>
        </div>
      </div>
    );
  }

  // Tiene el calendario, mostrar interfaz completa
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/reservar_turno/${encodeURIComponent(calendar.value.id)}`;

  return (
    <div class="flex w-full max-w-5xl flex-col gap-4 p-8">
      {/* Header */}
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold">Mi Agenda de Citas</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {appCalendarData.value.user?.name ||
              appCalendarData.value.user?.email}
          </p>
        </div>
      </div>

      {error.value && (
        <div class="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
          <p class="text-sm text-red-700 dark:text-red-300">{error.value}</p>
        </div>
      )}

      {/* Link para compartir */}
      <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p class="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
          🔗 Comparte este enlace para que otros puedan reservar citas contigo:
        </p>
        <div class="flex items-center gap-2">
          <code class="flex-1 overflow-x-auto rounded border bg-white p-2 text-xs dark:bg-gray-800">
            {shareUrl}
          </code>
          <Button
            look="primary"
            onClick$={() => {
              navigator.clipboard.writeText(shareUrl);
            }}
          >
            Copiar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          class={`px-4 py-2 font-medium transition-colors ${
            activeTab.value === "citas"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick$={() => (activeTab.value = "citas")}
        >
          📅 Citas Reservadas ({appointments.value.length})
        </button>
        <button
          class={`px-4 py-2 font-medium transition-colors ${
            activeTab.value === "eventos"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick$={() => (activeTab.value = "eventos")}
        >
          📆 Todos los Eventos ({events.value.length})
        </button>
        <button
          class={`px-4 py-2 font-medium transition-colors ${
            activeTab.value === "configurar"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick$={() => (activeTab.value = "configurar")}
        >
          ⚙️ Configurar Disponibilidad
        </button>
      </div>

      {/* Tab: Citas Reservadas */}
      {activeTab.value === "citas" && (
        <div class="mt-4">
          <h2 class="mb-3 text-lg font-semibold">Próximas Citas</h2>
          {appointments.value.length === 0 ? (
            <div class="rounded-lg border border-dashed border-gray-300 py-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <p class="mb-2 text-4xl">📭</p>
              <p>No tienes citas reservadas</p>
              <p class="mt-1 text-sm">
                Comparte tu enlace para que otros puedan reservar
              </p>
            </div>
          ) : (
            <div class="space-y-3">
              {appointments.value.map((appointment) => (
                <div
                  key={appointment.id}
                  class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="font-medium text-blue-600">
                        {appointment.summary
                          .replace(APPOINTMENT_EVENT_PREFIX, "")
                          .trim()}
                      </h3>
                      {appointment.description && (
                        <p class="mt-1 text-sm whitespace-pre-line text-gray-600 dark:text-gray-400">
                          {appointment.description}
                        </p>
                      )}
                      <div class="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          📅{" "}
                          {new Date(
                            appointment.start.dateTime,
                          ).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </span>
                        <span>
                          🕐{" "}
                          {new Date(
                            appointment.start.dateTime,
                          ).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(
                            appointment.end.dateTime,
                          ).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      look="outline"
                      onClick$={() => handleCancelAppointment(appointment.id)}
                      disabled={isLoading.value}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Todos los Eventos */}
      {activeTab.value === "eventos" && (
        <div class="mt-4">
          <h2 class="mb-3 text-lg font-semibold">Próximos eventos (30 días)</h2>
          {events.value.length === 0 ? (
            <div class="rounded-lg border border-dashed border-gray-300 py-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <p>No hay eventos programados</p>
            </div>
          ) : (
            <div class="space-y-2">
              {events.value.map((event) => (
                <div
                  key={event.id}
                  class={`rounded-lg border p-4 shadow-sm ${
                    event.summary?.startsWith(APPOINTMENT_EVENT_PREFIX)
                      ? "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <h3 class="font-medium">{event.summary}</h3>
                  <div class="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      📅{" "}
                      {new Date(event.start.dateTime).toLocaleDateString(
                        "es-ES",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        },
                      )}
                    </span>
                    <span>
                      🕐{" "}
                      {new Date(event.start.dateTime).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}{" "}
                      -{" "}
                      {new Date(event.end.dateTime).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Configurar Disponibilidad */}
      {activeTab.value === "configurar" && (
        <div class="mt-4 space-y-6">
          <div class="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p class="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ Esta configuración se guarda localmente. En una versión futura
              se guardará en la base de datos.
            </p>
          </div>

          {/* Duración de citas */}
          <div>
            <label class="mb-2 block text-sm font-medium">
              Duración de cada cita (minutos)
            </label>
            <select
              class="w-full max-w-xs rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
              value={scheduleConfig.value.slotDurationMinutes}
              onChange$={(e) => {
                scheduleConfig.value = {
                  ...scheduleConfig.value,
                  slotDurationMinutes: parseInt(
                    (e.target as HTMLSelectElement).value,
                  ),
                };
                availableSlots.value = generateAvailableSlots(
                  scheduleConfig.value,
                  events.value,
                  14,
                );
              }}
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1 hora 30 minutos</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          {/* Días disponibles */}
          <div>
            <label class="mb-2 block text-sm font-medium">
              Días disponibles para citas
            </label>
            <div class="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  class={`rounded-lg border px-3 py-2 transition-colors ${
                    scheduleConfig.value.availableDays.includes(day.value)
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 bg-white hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
                  onClick$={() => handleDayToggle(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horario */}
          <div class="grid max-w-md grid-cols-2 gap-4">
            <div>
              <label class="mb-2 block text-sm font-medium">
                Hora de inicio
              </label>
              <select
                class="w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
                value={scheduleConfig.value.startHour}
                onChange$={(e) => {
                  scheduleConfig.value = {
                    ...scheduleConfig.value,
                    startHour: parseInt((e.target as HTMLSelectElement).value),
                  };
                  availableSlots.value = generateAvailableSlots(
                    scheduleConfig.value,
                    events.value,
                    14,
                  );
                }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium">Hora de fin</label>
              <select
                class="w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
                value={scheduleConfig.value.endHour}
                onChange$={(e) => {
                  scheduleConfig.value = {
                    ...scheduleConfig.value,
                    endHour: parseInt((e.target as HTMLSelectElement).value),
                  };
                  availableSlots.value = generateAvailableSlots(
                    scheduleConfig.value,
                    events.value,
                    14,
                  );
                }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descanso */}
          <div>
            <label class="mb-2 flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={scheduleConfig.value.breakStartHour !== undefined}
                onChange$={(e) => {
                  if ((e.target as HTMLInputElement).checked) {
                    scheduleConfig.value = {
                      ...scheduleConfig.value,
                      breakStartHour: 13,
                      breakEndHour: 14,
                    };
                  } else {
                    const { breakStartHour, breakEndHour, ...rest } =
                      scheduleConfig.value;
                    scheduleConfig.value = rest as AppointmentScheduleConfig;
                  }
                  availableSlots.value = generateAvailableSlots(
                    scheduleConfig.value,
                    events.value,
                    14,
                  );
                }}
              />
              Incluir horario de descanso
            </label>
            {scheduleConfig.value.breakStartHour !== undefined && (
              <div class="mt-2 grid max-w-md grid-cols-2 gap-4">
                <div>
                  <label class="mb-1 block text-xs text-gray-500">
                    Inicio descanso
                  </label>
                  <select
                    class="w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
                    value={scheduleConfig.value.breakStartHour}
                    onChange$={(e) => {
                      scheduleConfig.value = {
                        ...scheduleConfig.value,
                        breakStartHour: parseInt(
                          (e.target as HTMLSelectElement).value,
                        ),
                      };
                      availableSlots.value = generateAvailableSlots(
                        scheduleConfig.value,
                        events.value,
                        14,
                      );
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs text-gray-500">
                    Fin descanso
                  </label>
                  <select
                    class="w-full rounded-lg border p-2 dark:border-gray-700 dark:bg-gray-800"
                    value={scheduleConfig.value.breakEndHour}
                    onChange$={(e) => {
                      scheduleConfig.value = {
                        ...scheduleConfig.value,
                        breakEndHour: parseInt(
                          (e.target as HTMLSelectElement).value,
                        ),
                      };
                      availableSlots.value = generateAvailableSlots(
                        scheduleConfig.value,
                        events.value,
                        14,
                      );
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Vista previa de slots */}
          <div>
            <h3 class="mb-2 text-sm font-medium">
              Vista previa:{" "}
              {availableSlots.value.filter((s) => s.available).length} slots
              disponibles en las próximas 2 semanas
            </h3>
            <div class="max-h-60 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
              <div class="grid grid-cols-2 gap-1 text-xs md:grid-cols-4">
                {availableSlots.value.slice(0, 40).map((slot, idx) => (
                  <div
                    key={idx}
                    class={`rounded p-2 ${
                      slot.available
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    <div>
                      {new Date(slot.startTime).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div>
                      {new Date(slot.startTime).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {availableSlots.value.length > 40 && (
                <p class="mt-2 text-center text-xs text-gray-500">
                  ... y {availableSlots.value.length - 40} slots más
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
