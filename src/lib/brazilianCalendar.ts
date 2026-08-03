import { addDays, format, getDay } from "date-fns";

export type BrazilianCalendarEventType = "holiday" | "observance";

export interface BrazilianCalendarEvent {
  id: string;
  name: string;
  date: string;
  type: BrazilianCalendarEventType;
  description: string;
}

function calculateEaster(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function nthSunday(year: number, month: number, occurrence: number) {
  const firstDay = new Date(year, month, 1);
  const firstSunday = 1 + ((7 - getDay(firstDay)) % 7);
  return new Date(year, month, firstSunday + (occurrence - 1) * 7);
}

export function getBrazilianCalendarEvents(year: number): BrazilianCalendarEvent[] {
  const easter = calculateEaster(year);
  const event = (
    id: string,
    name: string,
    date: Date,
    type: BrazilianCalendarEventType,
    description: string,
  ): BrazilianCalendarEvent => ({ id: `${id}-${year}`, name, date: format(date, "yyyy-MM-dd"), type, description });

  return [
    event("new-year", "Confraternização Universal", new Date(year, 0, 1), "holiday", "Feriado nacional"),
    event("carnival-monday", "Carnaval", addDays(easter, -48), "observance", "Ponto facultativo"),
    event("carnival", "Carnaval", addDays(easter, -47), "observance", "Ponto facultativo"),
    event("good-friday", "Sexta-feira da Paixão", addDays(easter, -2), "holiday", "Feriado nacional"),
    event("easter", "Páscoa", easter, "observance", "Data comemorativa"),
    event("tiradentes", "Tiradentes", new Date(year, 3, 21), "holiday", "Feriado nacional"),
    event("labor-day", "Dia do Trabalho", new Date(year, 4, 1), "holiday", "Feriado nacional"),
    event("mothers-day", "Dia das Mães", nthSunday(year, 4, 2), "observance", "Data comemorativa"),
    event("corpus-christi", "Corpus Christi", addDays(easter, 60), "observance", "Ponto facultativo"),
    event("valentines-day", "Dia dos Namorados", new Date(year, 5, 12), "observance", "Data comemorativa"),
    event("fathers-day", "Dia dos Pais", nthSunday(year, 7, 2), "observance", "Data comemorativa"),
    event("independence", "Independência do Brasil", new Date(year, 8, 7), "holiday", "Feriado nacional"),
    event("our-lady", "Nossa Senhora Aparecida", new Date(year, 9, 12), "holiday", "Feriado nacional"),
    event("children-day", "Dia das Crianças", new Date(year, 9, 12), "observance", "Data comemorativa"),
    event("all-souls", "Finados", new Date(year, 10, 2), "holiday", "Feriado nacional"),
    event("republic", "Proclamação da República", new Date(year, 10, 15), "holiday", "Feriado nacional"),
    event("black-consciousness", "Consciência Negra", new Date(year, 10, 20), "holiday", "Feriado nacional"),
    event("christmas", "Natal", new Date(year, 11, 25), "holiday", "Feriado nacional"),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

export function getUpcomingBrazilianCalendarEvents(referenceDate = new Date(), daysAhead = 7) {
  const today = format(referenceDate, "yyyy-MM-dd");
  const limit = format(addDays(referenceDate, daysAhead), "yyyy-MM-dd");
  return [
    ...getBrazilianCalendarEvents(referenceDate.getFullYear()),
    ...getBrazilianCalendarEvents(referenceDate.getFullYear() + 1),
  ].filter((item) => item.date >= today && item.date <= limit);
}
