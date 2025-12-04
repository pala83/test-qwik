import { $, component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { Button } from "~/components/ui";
import {
  getCalendarEvents,
  generateAvailableSlots,
  createAppointmentInOwnerCalendar,
  type AppointmentSlot,
  type AppointmentScheduleConfig,
} from "~/helpers/calendar";

// Configuración por defecto (idealmente vendría de la base de datos del propietario)
const DEFAULT_SCHEDULE_CONFIG: AppointmentScheduleConfig = {
  slotDurationMinutes: 30,
  availableDays: [1, 2, 3, 4, 5], // Lunes a Viernes
  startHour: 9,
  endHour: 18,
  breakStartHour: 13,
  breakEndHour: 14,
};

// Loader para obtener los slots disponibles del calendario
export const useCalendarSlots = routeLoader$(async (requestEvent) => {
  const calendarId = requestEvent.params.id;
  const session = requestEvent.sharedMap.get("session") as {
    accessToken?: string;
    user?: { email?: string; name?: string };
  } | null;
  const apiKey = requestEvent.env.get("GOOGLE_API_KEY") || "";

  // Range: Now to 2 weeks from now
  const now = new Date();
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(now.getDate() + 14);

  try {
    // Obtener eventos existentes del calendario
    const data = await getCalendarEvents(
      calendarId,
      session?.accessToken,
      apiKey,
      now.toISOString(),
      twoWeeksLater.toISOString(),
    );

    // Generar slots disponibles
    const slots = generateAvailableSlots(
      DEFAULT_SCHEDULE_CONFIG,
      data.items || [],
      14,
    );

    return {
      slots,
      calendarId,
      error: null,
      user: session?.user || null,
      accessToken: session?.accessToken || null,
    };
  } catch (e) {
    console.error(e);
    return {
      slots: [],
      calendarId,
      error:
        "No se pudieron cargar los horarios. Asegúrate de que el calendario sea público o esté compartido contigo.",
      user: session?.user || null,
      accessToken: session?.accessToken || null,
    };
  }
});

// Server action para reservar un turno
// NOTA: En producción, necesitarías almacenar el token del propietario de forma segura
// Por ahora, el cliente logueado crea el evento en su propio calendario e invita al propietario
const bookAppointmentAction = server$(async function (
  calendarId: string,
  slot: AppointmentSlot,
  clientName: string,
  clientEmail: string,
  description: string,
  accessToken: string,
) {
  try {
    // Buscar el calendario del propietario para verificar que existe
    // y crear la cita
    const appointment = await createAppointmentInOwnerCalendar(
      accessToken,
      calendarId,
      {
        startTime: slot.startTime,
        endTime: slot.endTime,
        clientName,
        clientEmail,
        description,
      },
    );

    return {
      success: true,
      message: "¡Cita reservada con éxito! Recibirás una invitación por email.",
      appointment,
    };
  } catch (error) {
    console.error("Error booking appointment:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al reservar la cita",
      appointment: null,
    };
  }
});

// Agrupar slots por día para mejor visualización
function groupSlotsByDay(
  slots: AppointmentSlot[],
): Map<string, AppointmentSlot[]> {
  const grouped = new Map<string, AppointmentSlot[]>();

  for (const slot of slots) {
    const dateKey = new Date(slot.startTime).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(slot);
  }

  return grouped;
}

export default component$(() => {
  const slotsData = useCalendarSlots();

  const selectedSlot = useSignal<AppointmentSlot | null>(null);
  const description = useSignal("");
  const isBooking = useSignal(false);
  const bookingResult = useSignal<{ success: boolean; message: string } | null>(
    null,
  );

  // Solo mostrar slots disponibles
  const availableSlots = slotsData.value.slots.filter((s) => s.available);
  const slotsByDay = groupSlotsByDay(availableSlots);

  const handleBookAppointment = $(async () => {
    if (!selectedSlot.value) return;
    if (!slotsData.value.user || !slotsData.value.accessToken) {
      bookingResult.value = {
        success: false,
        message: "Debes iniciar sesión para reservar una cita.",
      };
      return;
    }

    isBooking.value = true;
    bookingResult.value = null;

    const result = await bookAppointmentAction(
      slotsData.value.calendarId,
      selectedSlot.value,
      slotsData.value.user.name || slotsData.value.user.email || "Cliente",
      slotsData.value.user.email || "",
      description.value,
      slotsData.value.accessToken,
    );

    bookingResult.value = result;
    isBooking.value = false;

    if (result.success) {
      selectedSlot.value = null;
      description.value = "";
    }
  });

  return (
    <div class="mx-auto max-w-4xl p-4">
      <h1 class="mb-2 text-2xl font-bold">Reservar Cita</h1>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Selecciona un horario disponible para agendar tu cita
      </p>

      {slotsData.value.error && (
        <div class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {slotsData.value.error}
        </div>
      )}

      {bookingResult.value && (
        <div
          class={`mb-4 rounded p-4 ${
            bookingResult.value.success
              ? "border border-green-400 bg-green-100 text-green-700"
              : "border border-red-400 bg-red-100 text-red-700"
          }`}
        >
          {bookingResult.value.success && <span class="mr-2 text-xl">✅</span>}
          {bookingResult.value.message}
        </div>
      )}

      {!slotsData.value.user && (
        <div class="mb-6 rounded border border-yellow-400 bg-yellow-50 px-4 py-3 text-yellow-700">
          <strong>⚠️ Importante:</strong> Debes iniciar sesión para poder
          reservar una cita.
        </div>
      )}

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna de slots disponibles */}
        <div class="lg:col-span-2">
          <h2 class="mb-4 text-lg font-semibold">
            Horarios Disponibles ({availableSlots.length})
          </h2>

          {availableSlots.length === 0 ? (
            <div class="rounded-lg border border-dashed py-8 text-center text-gray-500">
              <p class="mb-2 text-4xl">📅</p>
              <p>No hay horarios disponibles en las próximas 2 semanas</p>
            </div>
          ) : (
            <div class="space-y-6">
              {Array.from(slotsByDay.entries()).map(([dateKey, daySlots]) => (
                <div key={dateKey}>
                  <h3 class="mb-2 font-medium text-gray-700 capitalize dark:text-gray-300">
                    📅 {dateKey}
                  </h3>
                  <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {daySlots.map((slot) => {
                      const time = new Date(slot.startTime).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      );
                      const isSelected =
                        selectedSlot.value?.startTime === slot.startTime;

                      return (
                        <button
                          key={slot.startTime}
                          class={`rounded-lg p-2 text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-blue-500 text-white ring-2 ring-blue-300"
                              : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                          }`}
                          onClick$={() => {
                            selectedSlot.value = slot;
                            bookingResult.value = null;
                          }}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de reserva */}
        <div class="lg:col-span-1">
          <div class="sticky top-4 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-lg font-semibold">Tu Reserva</h2>

            {selectedSlot.value ? (
              <div class="space-y-4">
                <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Fecha y hora seleccionada:
                  </p>
                  <p class="font-medium text-blue-700 dark:text-blue-300">
                    {new Date(selectedSlot.value.startTime).toLocaleDateString(
                      "es-ES",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      },
                    )}
                  </p>
                  <p class="text-lg font-bold text-blue-600">
                    {new Date(selectedSlot.value.startTime).toLocaleTimeString(
                      "es-ES",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}{" "}
                    -{" "}
                    {new Date(selectedSlot.value.endTime).toLocaleTimeString(
                      "es-ES",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>

                {slotsData.value.user && (
                  <div class="text-sm">
                    <p class="text-gray-600 dark:text-gray-400">
                      Reservando como:
                    </p>
                    <p class="font-medium">
                      {slotsData.value.user.name || slotsData.value.user.email}
                    </p>
                  </div>
                )}

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Motivo de la cita (opcional)
                  </label>
                  <textarea
                    class="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    rows={3}
                    placeholder="Describe brevemente el motivo de tu cita..."
                    value={description.value}
                    onInput$={(e) => {
                      description.value = (
                        e.target as HTMLTextAreaElement
                      ).value;
                    }}
                  />
                </div>

                <Button
                  look="primary"
                  class="w-full"
                  onClick$={handleBookAppointment}
                  disabled={isBooking.value || !slotsData.value.user}
                >
                  {isBooking.value ? "Reservando..." : "Confirmar Reserva"}
                </Button>

                <button
                  class="w-full text-sm text-gray-500 hover:text-gray-700"
                  onClick$={() => {
                    selectedSlot.value = null;
                    bookingResult.value = null;
                  }}
                >
                  Cancelar selección
                </button>
              </div>
            ) : (
              <div class="py-8 text-center text-gray-500">
                <p class="mb-2 text-4xl">👆</p>
                <p>Selecciona un horario disponible para continuar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
