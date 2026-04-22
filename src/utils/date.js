export const CALENDAR_WEEKDAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

const DISPLAY_FORMATTER = new Intl.DateTimeFormat("es-CR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("es-CR", {
  month: "long",
  year: "numeric",
});

const ACCESSIBLE_DATE_FORMATTER = new Intl.DateTimeFormat("es-CR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function capitalizeText(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function toDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function parseDateInputValue(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function getTodayDateValue() {
  return toDateInputValue(new Date());
}

export function formatDateValue(value) {
  const parsedDate = parseDateInputValue(value);

  if (!parsedDate) {
    return "";
  }

  return DISPLAY_FORMATTER.format(parsedDate);
}

export function formatAccessibleDate(value) {
  const parsedDate = parseDateInputValue(value);

  if (!parsedDate) {
    return "";
  }

  return capitalizeText(ACCESSIBLE_DATE_FORMATTER.format(parsedDate));
}

export function getCalendarMonthLabel(viewDate) {
  return capitalizeText(MONTH_FORMATTER.format(viewDate));
}

export function isSameCalendarDay(firstDate, secondDate) {
  if (!firstDate || !secondDate) {
    return false;
  }

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function shiftCalendarMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getCalendarDays(viewDate) {
  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  );
  const gridStartDate = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1 - firstDayOfMonth.getDay(),
  );

  return Array.from({ length: 42 }, (_, index) => {
    const currentDate = new Date(
      gridStartDate.getFullYear(),
      gridStartDate.getMonth(),
      gridStartDate.getDate() + index,
    );

    return {
      date: currentDate,
      value: toDateInputValue(currentDate),
      isCurrentMonth: currentDate.getMonth() === viewDate.getMonth(),
    };
  });
}
