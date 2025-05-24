async function loadEvents(year = cachedDate.getFullYear()) {
  // Оскільки кожен рік має хоча б одну подію, перевіряємо чи збігається отриманий рік з святами в кеші
  const hasYear = cachedHolidays.some((obj) => obj.start.year === year);
  // Отримує значення, тільки коли в нас змінився рік, на той, що не підвантажено
  if (cachedHolidays.length === 0 || !hasYear) {
    // Якщо в нас cachedHolidays пустий, то треба отримати вихідні
    const holidayEvents = await loadHolidayEvents(year);

    // Вже є обробка помилок у функції вище
    if (holidayEvents.length != 0) {
      showToast("Year Loaded");
      cachedHolidays.push(...holidayEvents);

      localStorage.setItem("cachedHolidays", JSON.stringify(cachedHolidays));
    }
  }

  if (user) {
    const userEvents = await loadUserEvents(year);
    if (userEvents) {
      // фактично дублюється зі ствренням подій, але він не буде так часто завантажуватись тому ОК
      showToast("Events Updated");

      loadEventsUpdate(userEvents);
    }
  }

  showView(cachedView);
}

async function loadUserEvents(year) {
  try {
    const response = await fetch(`/get_events/${year}`);

    return await handleErrors(response);
  } catch {}
}

async function loadHolidayEvents(year) {
  try {
    const response = await fetch(`/get_holidays/${year}`);

    return await handleErrors(response);
  } catch {}
}

async function handleErrors(response) {
  if (response.status === 204) {
    showToast("No Items to Receive");
    return null;
  }

  const data = await response.json();

  if (response.status === 201) {
    console.log(data.message);
  } else if (!response.ok) {
    logAction(data.message);
    showToast("!: " + data.message);
    throw new Error(data.message);
  }

  return data;
}

async function loadUserCalendars(user, update = false) {
  if (user) {
    if (cachedCalendars.length === 0 || update) {
      try {
        const response = await fetch("/list_calendars");

        const data = await handleErrors(response);
        if (data === null) {
          return;
        }

        cachedCalendars = data.calendars;
        localStorage.setItem(
          "cachedCalendars",
          JSON.stringify(cachedCalendars)
        );
      } catch {}
    }
  } else {
    cachedCalendars = [];
    localStorage.setItem("cachedCalendars", JSON.stringify(cachedCalendars));
  }
}

// Доробити
function getCalendarDayEvents(year, month, day) {
  if (user) {
    if (cachedEvents.length > 0) {
      // Треба отримувати кешовані календарі, та відповідно обирати, що показувати, а що ні
      const choosedCalendarEvents = getChoosedCalendarEvents();

      const eventsForDay = eventsForDaySort(
        choosedCalendarEvents,
        year,
        month,
        day
      );

      return eventsForDay;
    } else {
      let message = `getCalendarDayEvents: cachedEvents Length is Empty;`;
      console.log(message);

      return {
        message: "Error",
      };
    }
  } else {
    // Якщо юзер не в аккаунті
    return {
      message: "Error",
    };
  }
}

function getChoosedCalendarEvents() {
  const choosedCalendarEvents = [];

  cachedEvents.forEach((event) => {
    if (selectedCalendars.includes(event.calendarId)) {
      choosedCalendarEvents.push(event);
    }
  });

  // console.log(choosedCalendarEvents);

  return choosedCalendarEvents;
}

function eventsForDaySort(events, year, month, day) {
  const segments = events.flat();
  // console.log(segments);

  result_list = calendarSort(segments, year, month, day);

  result_list.sort(
    (
      { startMinutes: aStart, endMinutes: aEnd },
      { startMinutes: bStart, endMinutes: bEnd }
    ) => {
      if (aStart !== bStart) return aStart - bStart;
      return bEnd - bStart - (aEnd - aStart); // сортування за тривалістю, якщо час початку однаковий
    }
  );

  return result_list;
}

function calendarSort(segments, year, month, day) {
  const result_list = segments.filter((segment) => {
    return (
      segment.start && // перевірка start для впевненості
      segment.start.year === year &&
      segment.start.month === month &&
      segment.start.day === day
    );
  });
  return result_list;
}

function loadEventsUpdate(res_data) {
  console.log("loading Events");
  const syncTypes = res_data.syncType;
  const data = res_data.result;

  if (!data || data.message === "Error") {
    console.error("Отримано пусті або ж некоректні події: ", data);
    return;
  }

  let updatedCachedEvents = [...cachedEvents];

  try {
    // Групуємо вхідні сегменти за event_id
    const incomingEventsGrouped = data.reduce((acc, segment) => {
      const calendarId = segment.calendar_id;
      const eventId = segment.event_id;
      acc[eventId] = acc[eventId] || [];
      acc[eventId].push(segment);
      return acc;
    }, {});

    // Спочатку, якщо якась з подій має повну синхронізацію, видаляємо її старі екземпляри
    const yearStart = cachedDate.getFullYear();
    const yearEnd = yearStart + 1;

    for (const calendarId in syncTypes) {
      if (syncTypes[calendarId] === "Full") {
        updatedCachedEvents = updatedCachedEvents.filter((event) => {
          const start = new Date(event.eventStart);
          const end = new Date(event.eventEnd);
          return (
            event.calendar_id !== calendarId ||
            end.getFullYear() <= yearStart ||
            start.getFullYear() >= yearEnd
          );
        });
      }
    }

    // Обробляємо кожну унікальну подію з вхідних даних
    for (const eventId in incomingEventsGrouped) {
      const newSegments = incomingEventsGrouped[eventId];
      const status = newSegments[0]?.status;
      const calendarId = newSegments[0]?.calendar_id;

      // Видаляємо старі версії цієї події
      updatedCachedEvents = updatedCachedEvents.filter(
        (cachedEv) => cachedEv.event_id !== eventId
      );

      if (status !== "cancelled") {
        updatedCachedEvents.push(...newSegments);
      }
    }

    cachedEvents = updatedCachedEvents;
    localStorage.setItem("cachedEvents", JSON.stringify(cachedEvents));
  } catch (error) {
    showToast("!: " + "Couldnt load Events Update");
    logAction(`loadEventsUpdate: Error: ${error.message};`);
  }
}

// async function pingUser() {
// Фактично не потрібен, бо я і так пінгую сервер 😒😒😒😒😒😒😒😒😒
// try {
//   const response = await fetch("/ping", { method: "POST" });

//   await handleErrors(response);

//   await loadEvents();
//   showView(cachedView);
// } catch (error) {
//   console.error("!: " + error.message);
// }
// }

function loadEventsSetInterval() {
  setInterval(async () => {
    await loadEvents();
  }, 300000); // 5 хвил
}

// Фактично не потрібен, бо я і так пінгую сервер 😒😒😒😒😒😒😒😒😒
// async function checkUserWebhook() {
//   try {
//     const response = await fetch("/check_webhook_expiration");

//     // await handleErrors(response);
//   } catch (error) {
//     console.error("!: " + error.message);
//   }
// }

// function checkUserWebhookSetInterval() {
//   if (webhookIntervalId) {
//     clearInterval(webhookIntervalId);
//   }
//   webhookIntervalId = setInterval(async () => {
//     await checkUserWebhook();
//   }, 10000);
// }
// Фактично не потрібен, бо я і так пінгую сервер 😒😒😒😒😒😒😒😒😒

async function logAction(message) {
  try {
    const response = await fetch("/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    await handleErrors(response);
  } catch (error) {
    console.error("!: " + error.message);
  }
}
