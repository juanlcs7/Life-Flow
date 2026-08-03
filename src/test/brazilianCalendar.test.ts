import { describe, expect, it } from "vitest";
import { getBrazilianCalendarEvents, getUpcomingBrazilianCalendarEvents } from "@/lib/brazilianCalendar";

describe("calendário brasileiro", () => {
  it("calcula datas móveis de 2026", () => {
    const events = getBrazilianCalendarEvents(2026);
    const byName = new Map(events.map((event) => [event.name, event.date]));

    expect(byName.get("Páscoa")).toBe("2026-04-05");
    expect(byName.get("Dia das Mães")).toBe("2026-05-10");
    expect(byName.get("Dia dos Pais")).toBe("2026-08-09");
    expect(byName.get("Corpus Christi")).toBe("2026-06-04");
  });

  it("inclui datas importantes dos próximos sete dias", () => {
    const events = getUpcomingBrazilianCalendarEvents(new Date(2026, 5, 5), 7);
    expect(events.some((event) => event.name === "Dia dos Namorados" && event.date === "2026-06-12")).toBe(true);
  });
});
