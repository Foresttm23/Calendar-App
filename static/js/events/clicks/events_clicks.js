function outerClick(event) {
  const slot = event.currentTarget;
  const rect = slot.getBoundingClientRect();
  const clickY = event.clientY - rect.top;
  const slotHeight = rect.height;

  const totalMinutes = Math.floor((clickY / slotHeight) * 24 * 60);
  const some_hour = Math.floor(totalMinutes / 60);
  const some_minute = Math.floor((totalMinutes % 60) / 15) * 15;

  const date = slot.dateData;

  const startDate = new Date(
    `${date}T${String(some_hour).padStart(2, "0")}:${String(
      some_minute
    ).padStart(2, "0")}:00`
  );

  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const formattedStart = formatTime(null, startDate.toISOString());
  const formattedEnd = formatTime(null, endDate.toISOString());

  createEventsMenu();

  const eventStart = document.getElementById("eventStart");
  const eventEnd = document.getElementById("eventEnd");

  eventStart.value = formattedStart;
  eventEnd.value = formattedEnd;
}

function innerClick(e) {
  e.stopPropagation();

  currentEvent = e.currentTarget.eventData;

  showEventDetails(currentEvent);
}
