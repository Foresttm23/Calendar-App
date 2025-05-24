function showEventDetails(event) {
  if (!user && !event.calendarId.includes("holiday")) {
    showToast("Авторизуйтесь");
    return;
  }
  // Коли перемикаємось між подіями, скидуємо до звичайного вигляду
  returnToStartView();

  // console.log("event", event);
  const { summary, description, eventStart, eventEnd } = event;

  const setContent = (id, text) => {
    const elem = document.getElementById(id);
    if (!elem) return;

    if (elem.tagName === "INPUT") {
      elem.value = text;
    } else {
      elem.innerText = text;
    }
  };

  if (event.calendarId.includes("holiday") || event === placeholderEvent) {
    document.getElementById("editEvent").classList.add("hidden");
    document.getElementById("deleteEvent").classList.add("hidden");
    document.getElementById("viewMenuChooseCalendar").disabled = false;

    populateViewMenuChooseCalendar(placeholderEvent.calendarId);
  } else {
    document.getElementById("editEvent").classList.remove("hidden");
    document.getElementById("deleteEvent").classList.remove("hidden");
    document.getElementById("viewMenuChooseCalendar").disabled = true;

    populateViewMenuChooseCalendar("");
  }

  if (event.calendarId.includes("holiday")) {
    document.getElementById("viewMenuChooseCalendar").classList.add("hidden");
    document.getElementById("saveEvent").classList.add("hidden");
  } else {
    document
      .getElementById("viewMenuChooseCalendar")
      .classList.remove("hidden");
    document.getElementById("saveEvent").classList.remove("hidden");
  }

  setContent("eventSummary", summary || "Без назви");
  setContent("eventDescription", description || "Без опису");

  if (!event.calendarId.includes("holiday")) {
    document.getElementById("timeStart").classList.remove("hidden");
    document.getElementById("timeEnd").classList.remove("hidden");

    setContent("eventStart", formatTime(event, eventStart));
    setContent("eventEnd", formatTime(event, eventEnd));
  } else {
    document.getElementById("timeStart").classList.add("hidden");
    document.getElementById("timeEnd").classList.add("hidden");
  }

  document.getElementById("eventsViewEvent").classList.remove("hidden");
}

function formatTime(event, isoString) {
  const date = new Date(isoString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function closeEventMenu() {
  const container = document.getElementById("eventsViewEvent");

  returnToStartView();
  container.classList.add("hidden");
}

function editEventsMenu(type = "update") {
  const container = document.getElementById("eventsViewEvent");
  const saveButton = document.getElementById("saveEvent");
  if (type === "update") saveButton.onclick = () => updateEventController();
  if (type === "create") saveButton.onclick = () => createEventController();

  if (container.querySelector("input") && type === "create") {
    return;
  }

  if (container.querySelector("input")) {
    returnToStartView();
    return;
  }

  const editableIds = [
    "eventSummary",
    "eventDescription",
    "eventStart",
    "eventEnd",
  ];

  editableIds.forEach((id) => {
    const elem = document.getElementById(id);
    if (!elem) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = elem.innerText;
    input.id = elem.id;
    input.className = elem.className;
    input.dataset.originalTag = elem.tagName.toLowerCase();

    elem.replaceWith(input);
  });

  saveButton.classList.remove("inactive");
  saveButton.classList.add("active");
}

function returnToStartView() {
  const container = document.getElementById("eventsViewEvent");

  // Знайти всі input, які ми створили замість div
  const inputs = container.querySelectorAll("input[data-original-tag]");

  const saveButton = document.getElementById("saveEvent");
  saveButton.classList.remove("active");
  saveButton.classList.add("inactive");

  inputs.forEach((input) => {
    const originalTag = input.dataset.originalTag;
    const newElem = document.createElement(originalTag);
    newElem.id = input.id;
    newElem.innerText = input.value;

    newElem.className = input.className;

    input.replaceWith(newElem);
  });
}

// доробити
function deleteEventController() {
  closeEventMenu();
  deleteEvent(currentEvent.calendarId, currentEvent.event_id);
}

function updateEventController() {
  const eventStart = document.getElementById("eventStart").value;
  const eventEnd = document.getElementById("eventEnd").value;

  const eventSummary = document.getElementById("eventSummary").value;
  const eventDescription = document.getElementById("eventDescription").value;

  let eventStartIso, eventEndIso;

  try {
    eventStartIso = toISO(eventStart);
    eventEndIso = toISO(eventEnd);
  } catch (e) {
    showToast(e.message);
    return;
  }

  closeEventMenu();
  updateEvent(
    currentEvent.calendarId,
    currentEvent.colorId,
    currentEvent.event_id,
    {
      summary: eventSummary,
      description: eventDescription,
      start: eventStartIso,
      end: eventEndIso,
    }
  );
}

function toISO(str) {
  const regex = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/;
  const match = str.match(regex);

  if (!match) {
    throw new Error("Введіть дату у форматі: DD.MM.YYYY HH:mm");
  }

  const [_, day, month, year, hours, minutes] = match;
  const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);

  // Повертаємо у форматі ISO без часової зони
  return date.toISOString();
}

function createEventsMenu(outer = false) {
  showEventDetails(placeholderEvent);

  editEventsMenu("create");
}

function populateViewMenuChooseCalendar(calendarId) {
  const viewMenuChooseCalendar = document.getElementById(
    "viewMenuChooseCalendar"
  );
  viewMenuChooseCalendar.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  placeholderOption.hidden = true;
  placeholderOption.textContent = calendarId;
  viewMenuChooseCalendar.appendChild(placeholderOption);

  cachedCalendars.forEach((el) => {
    const option = document.createElement("option");
    option.value = el.id;

    if (el.id.includes("@gmail.com")) {
      option.textContent = "Main";
    } else {
      option.textContent = el.summary;
    }

    option.setAttribute("colorId", el.colorId);

    viewMenuChooseCalendar.appendChild(option);
  });
}

function createEventController() {
  const eventStart = document.getElementById("eventStart").value;
  const eventEnd = document.getElementById("eventEnd").value;

  const eventSummary = document.getElementById("eventSummary").value;
  const eventDescription = document.getElementById("eventDescription").value;

  const select = document.getElementById("viewMenuChooseCalendar");
  const calendarId = select.value;

  if (calendarId === placeholderEvent.calendarId) {
    showToast("Оберіть Календар");
    return;
  }

  const selectedOption = select.options[select.selectedIndex];
  const colorId = selectedOption.getAttribute("colorId");

  let eventStartIso, eventEndIso;

  try {
    eventStartIso = toISO(eventStart);
    eventEndIso = toISO(eventEnd);
  } catch (e) {
    showToast(e.message);
    return;
  }

  closeEventMenu();
  createEvent(calendarId, colorId, {
    summary: eventSummary,
    description: eventDescription,
    start: eventStartIso,
    end: eventEndIso,
  });
}
