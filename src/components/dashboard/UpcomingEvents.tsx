import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, ArrowRight, Video, Users } from "lucide-react";
import { Link } from "react-router-dom";

const events = [
  {
    id: 1,
    title: "Reunião de planejamento Q1",
    date: "Hoje",
    time: "14:00 - 15:30",
    location: "Google Meet",
    type: "virtual",
    color: "bg-tasks",
  },
  {
    id: 2,
    title: "Aniversário da Maria",
    date: "Amanhã",
    time: "19:00",
    location: "Restaurante Mamma Rosa",
    type: "social",
    color: "bg-contacts",
  },
  {
    id: 3,
    title: "Consulta médica",
    date: "Quinta, 23 Jan",
    time: "10:30",
    location: "Clínica São Lucas",
    type: "health",
    color: "bg-health",
  },
];

export function UpcomingEvents() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className="bg-card rounded-xl p-5 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Próximos Eventos</h3>
        <Link to="/agenda" className="text-sm text-primary hover:underline flex items-center gap-1">
          Ver agenda <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.8 + index * 0.05 }}
            className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className={`w-1 rounded-full ${event.color}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{event.title}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {event.date}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {event.time}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {event.type === "virtual" ? <Video className="w-3 h-3" /> : event.type === "social" ? <Users className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {event.location}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}