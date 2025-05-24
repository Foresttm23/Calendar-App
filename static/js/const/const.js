let cachedEvents = [];
let cachedHolidays = [];

let cachedCalendars = [];
let selectedCalendars = [];

let currentEvent = [];

let placeholderEvent = {
  calendarId: "Оберіть календар",
  summary: "Назва",
  description: "Опис",
  eventStart: new Date(),
  eventEnd: new Date(Date.now() + 60 * 60 * 1000),
};
let tempDate = new Date();

let cachedView = "day";

let webhookIntervalId = null;

let cachedDate = new Date();

let cachedYears = [];

let user = null;

const Hours = 24;

const monthNames = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

const daysOfWeek = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
