function generateDayHours(viewId, year, month, day, grid, container, num = 0) {
  const Hours = 24;

  const events = getCalendarDayEvents(year, month + 1, day);

  const slot_time = document.createElement("div");
  slot_time.classList.add("hour-slot");
  slot_time.setAttribute("role", "button");
  slot_time.setAttribute("tabindex", "0");

  const saveMonth = String(month + 1).padStart(2, "0");
  const saveDay = String(day).padStart(2, "0");
  slot_time.dateData = `${year}-${saveMonth}-${saveDay}`;

  slot_time.addEventListener("click", outerClick);

  if (events.message != "Error" && events.length > 0) {
    const events_container = document.createElement("div");
    events_container.classList.add("events-container");

    events.forEach((event, i) => {
      let column = 0;

      while (
        events.some(
          (e, j) =>
            j < i &&
            e.column === column &&
            event.startMinutes < e.endMinutes &&
            event.endMinutes > e.startMinutes
        )
      ) {
        column++;
      }

      event.column = column;

      const overlaps = events.filter(
        (otherEvent, j) =>
          j !== i &&
          event.startMinutes < otherEvent.endMinutes &&
          event.endMinutes > otherEvent.startMinutes
      ).length;

      event.overlaps = overlaps;
    });

    for (let event of events) {
      const slot_event = document.createElement("div");

      slot_event.classList.add("event-slot");
      if (event.longEvent === true) {
        // slot_event.style.backgroundColor = "rgb(255, 255, 255)"; // IDK
      }

      // 👌👌👌
      const colorId = event.colorId;
      const bgColor = eventColors[colorId] || "#cccccc";
      slot_event.style.backgroundColor = bgColor;

      slot_event.setAttribute("role", "button");
      slot_event.setAttribute("tabindex", "0");

      slot_event.eventData = event;
      slot_event.addEventListener("click", innerClick);

      slot_event.style.top = `calc(${event.startPosition * 100}% - 0.06rem)`;
      slot_event.style.height = `calc(${event.endPosition * 100}% - 0.17rem)`;

      const slot_event_text = document.createElement("div");
      slot_event_text.classList.add("slot-event-text");
      slot_event_text.textContent = event.summary;

      slot_event.appendChild(slot_event_text);

      if (event.overlaps > 0) {
        const totalSlots = event.overlaps + 1;

        const slotWidth = (100 - (totalSlots - 1)) / totalSlots;
        slot_event.style.left = `${event.column * slotWidth}%`;

        const temp = `${event.column * slotWidth}%`;
        slot_event.style.width = `calc(${100}% - ${temp})`;

        slot_event.style.zIndex = event.column + 10; // Фонові лінії +10
      } else {
        slot_event.style.width = "100%";
      }

      events_container.appendChild(slot_event);
    }
    slot_time.appendChild(events_container);
  } else if (events.length === 0) {
    console.log("No Events to Display");
  }

  if ((viewId === "week" && num == 0) || viewId === "day") {
    const linesContainer = document.createElement("div");
    linesContainer.classList.add("lines-container");
    linesContainer.style.pointerEvents = "none";

    const lineTextContainer = document.createElement("div");
    lineTextContainer.classList.add("line-text-container");

    for (let hour = 0; hour <= Hours; hour++) {
      const formattedHour = hour.toString().padStart(2, "0") + ":00";

      if (hour > 0 && hour < Hours) {
        const hLine = document.createElement("div");
        hLine.classList.add("horizontal-line");
        hLine.style.top = `calc(${(hour / Hours) * 100}%)`; // + 2rem

        const lineText = document.createElement("div");
        lineText.classList.add("horizontal-time");
        lineText.style.top = `calc(${(hour / Hours) * 100}%)`; // + 2rem
        lineText.textContent = formattedHour;

        lineTextContainer.appendChild(lineText);

        linesContainer.appendChild(hLine);
      }
    }

    if (viewId === "week") {
      for (let i = 1; i < 7; i++) {
        // 6 вертикальних ліній між 7 днями
        const vLine = document.createElement("div");
        vLine.classList.add("vertical-line");
        vLine.style.left = `${(i / 7) * 100}%`;
        linesContainer.appendChild(vLine);
      }
    }

    container.appendChild(linesContainer);

    grid.appendChild(lineTextContainer);
  }
  container.appendChild(slot_time);
  grid.appendChild(container);

  generateHolidays(year, month, day, num);
}

function generateHolidays(year, month, day, num) {
  const holiday = calendarSort(cachedHolidays, year, month + 1, day);
  if (holiday.length === 0) {
    return;
  }

  const dayInfoContainer = document.getElementById(`day-info-container-${num}`);

  const holidayEventContainer = document.createElement("div");
  holidayEventContainer.classList.add("holiday-event-container");

  holidayEventContainer.eventData = holiday[0];
  holidayEventContainer.addEventListener("click", innerClick);

  const holidayEventText = document.createElement("div");
  holidayEventText.classList.add("holiday-event-text");
  holidayEventText.textContent = holiday[0].summary;

  holidayEventContainer.appendChild(holidayEventText);
  dayInfoContainer.appendChild(holidayEventContainer);
}

const eventColors = {
  1: "#a4bdfc",
  2: "#7ae7bf",
  3: "#dbadff",
  4: "#ff887c",
  5: "#fbd75b",
  6: "#ffb878",
  7: "#46d6db",
  8: "#e1e1e1",
  9: "#5484ed",
  10: "#51b749",
  11: "#dc2127",
};
