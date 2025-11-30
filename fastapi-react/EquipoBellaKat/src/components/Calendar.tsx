import { Box, Text } from "@chakra-ui/react";
import styles from "./Calendar.module.css";

interface CalendarProps {
  historyPoints: Array<{ time: string }>;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

export const Calendar = ({
  historyPoints,
  selectedDate,
  onDateSelect,
}: CalendarProps) => {
  const availableDays = new Set<string>();
  historyPoints.forEach((point) => {
    const date = new Date(point.time);
    const dayKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    availableDays.add(dayKey);
  });

  const dates = Array.from(availableDays).map((d) => new Date(d));
  if (dates.length === 0) return null;

  const daysByMonth = new Map<string, number>();
  dates.forEach((date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    daysByMonth.set(monthKey, (daysByMonth.get(monthKey) || 0) + 1);
  });

  let maxDays = 0;
  let bestDate: Date | null = null;

  daysByMonth.forEach((count, monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    const monthDate = new Date(year, month, 1);
    if (
      count > maxDays ||
      (count === maxDays && (!bestDate || monthDate > bestDate))
    ) {
      maxDays = count;
      bestDate = monthDate;
    }
  });

  if (!bestDate) return null;

  const currentMonth = (bestDate as Date).getMonth();
  const currentYear = (bestDate as Date).getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];

  const isDayAvailable = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    const dayKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return availableDays.has(dayKey);
  };

  const isDaySelected = (day: number): boolean => {
    if (!selectedDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    const dayKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const selectedDayKey = selectedDate.split("T")[0];
    return dayKey === selectedDayKey;
  };

  const handleDayClick = (day: number) => {
    if (!isDayAvailable(day)) return;
    const date = new Date(currentYear, currentMonth, day);
    const dayKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const pointsForDay = historyPoints.filter((point) => {
      const pointDate = new Date(point.time);
      const pointDayKey = `${pointDate.getFullYear()}-${String(
        pointDate.getMonth() + 1
      ).padStart(2, "0")}-${String(pointDate.getDate()).padStart(2, "0")}`;
      return pointDayKey === dayKey;
    });

    if (pointsForDay.length > 0) {
      const lastPoint = pointsForDay[pointsForDay.length - 1];
      onDateSelect(lastPoint.time);
    }
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <Box className={styles.calendarContainer}>
      <Box className={styles.calendarHeader}>
        <Text className={styles.monthTitle}>{monthNames[currentMonth]}</Text>
      </Box>
      <Box className={styles.weekDays}>
        <Text className={`${styles.weekDay} ${styles.sunday}`}>D</Text>
        <Text className={styles.weekDay}>L</Text>
        <Text className={styles.weekDay}>M</Text>
        <Text className={styles.weekDay}>M</Text>
        <Text className={styles.weekDay}>J</Text>
        <Text className={styles.weekDay}>V</Text>
        <Text className={styles.weekDay}>S</Text>
      </Box>
      <Box className={styles.calendarGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return (
              <Box key={`empty-${index}`} className={styles.calendarDay} />
            );
          }
          const isAvailable = isDayAvailable(day);
          const isSelected = isDaySelected(day);
          const isSunday = (startingDayOfWeek + day - 1) % 7 === 0;

          return (
            <Box
              key={day}
              className={`${styles.calendarDay} ${
                isAvailable ? styles.availableDay : styles.disabledDay
              } ${isSelected ? styles.selectedDay : ""} ${
                isSunday ? styles.sundayDay : ""
              }`}
              onClick={() => handleDayClick(day)}
            >
              <Text className={styles.dayNumber}>{day}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
