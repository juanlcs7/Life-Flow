/**
 * Build an iCalendar (.ics) feed and trigger a download. Output works in
 * Google Calendar, Apple Calendar and Outlook (File → Import).
 */
import { format, parseISO } from "date-fns";

export interface IcsEvent {
  uid: string;
  title: string;
  date: string; // yyyy-MM-dd
  time?: string | null; // HH:mm
  description?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDate(date: string, time?: string | null) {
  const d = parseISO(date);
  if (!time) {
    // all-day
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  }
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  // floating local time
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(events: IcsEvent[], calName = "LifeFlow") {
  const stamp = format(new Date(), "yyyyMMdd'T'HHmmss");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LifeFlow//Agenda//PT",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${calName}`,
  ];
  for (const e of events) {
    const allDay = !e.time;
    const dt = toIcsDate(e.date, e.time);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}@lifeflow`);
    lines.push(`DTSTAMP:${stamp}Z`);
    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dt}`);
    } else {
      lines.push(`DTSTART:${dt}`);
      // 30-min default duration
      const end = new Date(parseISO(e.date));
      const [h, m] = (e.time as string).split(":").map(Number);
      end.setHours(h, m + 30, 0, 0);
      lines.push(
        `DTEND:${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`,
      );
    }
    lines.push(`SUMMARY:${escapeText(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(events: IcsEvent[], filename = "lifeflow-agenda.ics") {
  const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}