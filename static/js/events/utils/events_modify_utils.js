// Поки нічого не перевіряв, але має бути правильно

// Працює
async function createEvent(calendarId, colorId, eventData) {
  try {
    const response = await fetch(
      `/create_event/${encodeURIComponent(calendarId)}/${colorId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    const result = await handleErrors(response);
    showToast(result.message);

    // Щоб не чекати на вебхук
    loadEventsUpdate({
      syncType: { [calendarId]: "Partial" },
      result: result.event,
    });
    showView(cachedView);

    // Оскільки вебхука вже немає, можна просто викликати loadEvents(), отримає тільки оновлення
    // loadEvents();
  } catch (error) {
    showToast("!: " + error.message);
  }
}

// Працює
async function updateEvent(calendarId, colorId, eventId, updatedData) {
  try {
    const response = await fetch(
      `/update_event/${encodeURIComponent(
        calendarId
      )}/${colorId}/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      }
    );

    const result = await handleErrors(response);
    showToast(result.message);

    // Щоб не чекати на вебхук
    loadEventsUpdate({
      syncType: { [calendarId]: "Partial" },
      result: result.event,
    });
    showView(cachedView);

    // Оскільки вебхука вже немає, можна просто викликати loadEvents(), отримає тільки оновлення
    // loadEvents();
  } catch (error) {
    showToast("!: " + error.message);
  }
}

// Працює
async function deleteEvent(calendarId, eventId) {
  try {
    const response = await fetch(
      `/delete_event/${encodeURIComponent(calendarId)}/${encodeURIComponent(
        eventId
      )}`,
      {
        method: "DELETE",
      }
    );

    const result = await handleErrors(response);
    showToast(result.message);

    // Щоб не чекати на вебхук
    loadEventsUpdate({
      syncType: { [calendarId]: "Partial" },
      result: [
        { calendarId: calendarId, event_id: eventId, status: "cancelled" },
      ],
    });
    showView(cachedView);

    // Оскільки вебхука вже немає, можна просто викликати loadEvents(), отримає тільки оновлення
    // loadEvents();
  } catch (error) {
    showToast("!: " + error.message);
  }
}

// // Працює
// async function createEventTest() {
//   const start = new Date();
//   let end = new Date();
//   end.setHours(end.getHours() + 1);

//   await createEvent({
//     start: start.toISOString(),
//     end: end.toISOString(),
//     summary: "Тестова подія",
//     description: "Це опис",
//   });
// }

// // Працює
// async function updateEventTest() {
//   const start = new Date();
//   let end = new Date();
//   end.setHours(end.getHours() + 4);

//   const eventId = "cuq20gbud5c1o2hknonrp3jitc";

//   await updateEvent(eventId, {
//     start: start.toISOString(),
//     end: end.toISOString(),
//   });
// }

// // Працює
// async function deleteEventTest() {
//   const eventId = "sbgbiotqoslts1cmj0vts1s740";

//   await deleteEvent(eventId);
// }
