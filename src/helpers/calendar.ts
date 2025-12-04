export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  accessRole: string;
  primary?: boolean;
  selected?: boolean;
}

// Nombre identificador único para el calendario de la aplicación
export const APP_CALENDAR_NAME = "MiApp - Agenda Pública";
export const APP_CALENDAR_DESCRIPTION =
  "Calendario público compartido creado por MiApp para gestionar citas y eventos.";

/**
 * Obtiene la lista de calendarios del usuario
 */
export const getCalendarList = async (
  accessToken: string,
): Promise<{ items: GoogleCalendar[] }> => {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching calendar list:", error);
    throw new Error(error.error?.message || "Failed to fetch calendar list");
  }

  return response.json();
};

/**
 * Busca el calendario de la aplicación por su nombre
 */
export const findAppCalendar = async (
  accessToken: string,
): Promise<GoogleCalendar | null> => {
  const calendars = await getCalendarList(accessToken);
  return (
    calendars.items.find((cal) => cal.summary === APP_CALENDAR_NAME) || null
  );
};

/**
 * Crea un nuevo calendario público para la aplicación
 */
export const createAppCalendar = async (
  accessToken: string,
): Promise<GoogleCalendar> => {
  // 1. Crear el calendario
  const createResponse = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: APP_CALENDAR_NAME,
        description: APP_CALENDAR_DESCRIPTION,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    },
  );

  if (!createResponse.ok) {
    const error = await createResponse.json();
    console.error("Error creating calendar:", error);
    throw new Error(error.error?.message || "Failed to create calendar");
  }

  const calendar: GoogleCalendar = await createResponse.json();

  // 2. Hacer el calendario público (lectura para cualquiera)
  await makeCalendarPublic(accessToken, calendar.id);

  return calendar;
};

/**
 * Hace un calendario público (visible para cualquiera)
 */
export const makeCalendarPublic = async (
  accessToken: string,
  calendarId: string,
): Promise<void> => {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        scope: {
          type: "default", // Público para todos
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Error making calendar public:", error);
    throw new Error(error.error?.message || "Failed to make calendar public");
  }
};

/**
 * Obtiene la información de un calendario específico
 */
export const getCalendarInfo = async (
  accessToken: string,
  calendarId: string,
): Promise<GoogleCalendar> => {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching calendar info:", error);
    throw new Error(error.error?.message || "Failed to fetch calendar info");
  }

  return response.json();
};

export const getCalendarEvents = async (
  calendarId: string,
  accessToken: string | undefined,
  apiKey: string,
  timeMin: string,
  timeMax: string,
) => {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
  });

  if (apiKey && !accessToken) {
    params.append("key", apiKey);
  }

  const headers: HeadersInit = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // If calendarId is an email, it maps to the primary calendar of that user
  // But for the API, we use the email as the calendarId.
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId,
  )}/events?${params.toString()}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching calendar events:", error);
    throw new Error(error.error?.message || "Failed to fetch events");
  }

  return response.json();
};

export const createCalendarEvent = async (
  accessToken: string,
  event: Partial<CalendarEvent>,
) => {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Error creating event:", error);
    throw new Error(error.error?.message || "Failed to create event");
  }

  return response.json();
};

// ==========================================
// AGENDA DE CITAS (Appointment Schedule)
// ==========================================

export interface AppointmentSlot {
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  available: boolean;
}

export interface AppointmentScheduleConfig {
  slotDurationMinutes: number; // Duración de cada cita (ej: 30, 60)
  availableDays: number[]; // Días disponibles (0=Dom, 1=Lun, ..., 6=Sáb)
  startHour: number; // Hora de inicio (0-23)
  endHour: number; // Hora de fin (0-23)
  breakStartHour?: number; // Inicio del descanso
  breakEndHour?: number; // Fin del descanso
}

// Prefijo para identificar eventos de citas reservadas
export const APPOINTMENT_EVENT_PREFIX = "[CITA]";

// Propiedad extendida para identificar citas de la app
export const APPOINTMENT_EXTENDED_PROPERTY = "miapp_appointment";

/**
 * Genera slots de disponibilidad basándose en la configuración
 * y los eventos existentes en el calendario
 */
export const generateAvailableSlots = (
  config: AppointmentScheduleConfig,
  existingEvents: CalendarEvent[],
  daysAhead: number = 14,
): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
  const now = new Date();

  // Generar slots para los próximos X días
  for (let day = 0; day < daysAhead; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();

    // Saltar si no es un día disponible
    if (!config.availableDays.includes(dayOfWeek)) {
      continue;
    }

    // Generar slots para este día
    for (let hour = config.startHour; hour < config.endHour; hour++) {
      // Saltar horas de descanso
      if (
        config.breakStartHour !== undefined &&
        config.breakEndHour !== undefined &&
        hour >= config.breakStartHour &&
        hour < config.breakEndHour
      ) {
        continue;
      }

      // Generar slots por cada fracción de hora según la duración
      const slotsPerHour = 60 / config.slotDurationMinutes;
      for (let slotIndex = 0; slotIndex < slotsPerHour; slotIndex++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, slotIndex * config.slotDurationMinutes, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + config.slotDurationMinutes);

        // No incluir slots en el pasado
        if (slotStart <= now) {
          continue;
        }

        // Verificar si el slot está ocupado por un evento existente
        const isOccupied = existingEvents.some((event) => {
          const eventStart = new Date(event.start.dateTime);
          const eventEnd = new Date(event.end.dateTime);
          // Hay superposición si el slot empieza antes de que termine el evento
          // y termina después de que empiece el evento
          return slotStart < eventEnd && slotEnd > eventStart;
        });

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: !isOccupied,
        });
      }
    }
  }

  return slots;
};

/**
 * Crea una cita en el calendario del propietario
 * Esta función usa el token del propietario para crear el evento
 */
export const createAppointmentInOwnerCalendar = async (
  ownerAccessToken: string,
  calendarId: string,
  appointment: {
    startTime: string;
    endTime: string;
    clientName: string;
    clientEmail: string;
    description?: string;
  },
): Promise<CalendarEvent> => {
  const event = {
    summary: `${APPOINTMENT_EVENT_PREFIX} ${appointment.clientName}`,
    description: `Cita reservada por: ${appointment.clientName}\nEmail: ${appointment.clientEmail}\n${appointment.description || ""}`,
    start: {
      dateTime: appointment.startTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: appointment.endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: [{ email: appointment.clientEmail }],
    // Enviar notificaciones
    sendUpdates: "all",
    // Propiedades extendidas para identificar como cita de la app
    extendedProperties: {
      private: {
        [APPOINTMENT_EXTENDED_PROPERTY]: "true",
        clientEmail: appointment.clientEmail,
        clientName: appointment.clientName,
      },
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ownerAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Error creating appointment:", error);
    throw new Error(error.error?.message || "Failed to create appointment");
  }

  return response.json();
};

/**
 * Obtiene las citas reservadas del calendario
 */
export const getAppointments = async (
  accessToken: string,
  calendarId: string,
  timeMin?: string,
  timeMax?: string,
): Promise<CalendarEvent[]> => {
  const now = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(now.getMonth() + 1);

  const params = new URLSearchParams({
    timeMin: timeMin || now.toISOString(),
    timeMax: timeMax || oneMonthLater.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    // Filtrar por propiedades extendidas
    privateExtendedProperty: `${APPOINTMENT_EXTENDED_PROPERTY}=true`,
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Error fetching appointments:", error);
    throw new Error(error.error?.message || "Failed to fetch appointments");
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Cancela una cita (elimina el evento)
 */
export const cancelAppointment = async (
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> => {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    console.error("Error canceling appointment:", error);
    throw new Error(error.error?.message || "Failed to cancel appointment");
  }
};
