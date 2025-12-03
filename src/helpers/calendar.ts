export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
}

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
