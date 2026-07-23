import { useEffect, useState, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { useAuth } from "./useAuth";
import { useTasks } from "./useTasks";
import { useFinancialGoals } from "./useFinancialGoals";
import { usePersonalGoals } from "./usePersonalGoals";
import { useSubscriptions } from "./useSubscriptions";
import { useInstallments } from "./useInstallments";
import { useMarketRates } from "./useMarketRates";
import { addDays, parseISO, differenceInDays, format, isToday, isTomorrow } from "date-fns";

export interface NotificationSettings {
  enabled: boolean;
  taskReminders: boolean;
  goalReminders: boolean;
  subscriptionReminders: boolean;
  installmentReminders: boolean;
  investmentTips: boolean;
  reminderTime: string; // HH:mm format
  installmentDaysBefore: number; // days before due to alert (1-7)
  investmentTipsFrequency: "daily" | "weekly" | "off";
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  taskReminders: true,
  goalReminders: true,
  subscriptionReminders: true,
  installmentReminders: true,
  investmentTips: true,
  reminderTime: "09:00",
  installmentDaysBefore: 3,
  investmentTipsFrequency: "daily",
};

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const [isWebNotificationSupported, setIsWebNotificationSupported] = useState(false);
  const webTimeoutsRef = useRef<number[]>([]);
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { goals: financialGoals } = useFinancialGoals();
  const { goals: personalGoals } = usePersonalGoals();
  const { subscriptions } = useSubscriptions();
  const { payments: installmentPayments, installments } = useInstallments();
  const marketRatesQuery = useMarketRates();
  const marketRates = marketRatesQuery.data ?? [];

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    const native = platform === "ios" || platform === "android";
    setIsNativePlatform(native);

    // Web notifications
    if (!native && typeof window !== "undefined" && "Notification" in window) {
      setIsWebNotificationSupported(true);
      if (Notification.permission === "granted") setPermissionGranted(true);
    }

    // Load settings from localStorage
    const saved = localStorage.getItem(`notification_settings_${user?.id}`);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, [user?.id]);

  const requestPermission = useCallback(async () => {
    try {
      if (isNativePlatform) {
        const permission = await LocalNotifications.requestPermissions();
        const granted = permission.display === "granted";
        setPermissionGranted(granted);
        return granted;
      }
      if (typeof window !== "undefined" && "Notification" in window) {
        const result = await Notification.requestPermission();
        const granted = result === "granted";
        setPermissionGranted(granted);
        return granted;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isNativePlatform]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (user?.id) {
      localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(updated));
    }
  }, [settings, user?.id]);

  const scheduleNotification = useCallback(async (options: ScheduleOptions) => {
    if (!isNativePlatform || !permissionGranted) return;

    try {
      await LocalNotifications.schedule(options);
    } catch (error) {
      console.error("Error scheduling notification:", error);
    }
  }, [isNativePlatform, permissionGranted]);

  const cancelAllNotifications = useCallback(async () => {
    if (isNativePlatform) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }
      } catch (error) {
        console.error("Error canceling notifications:", error);
      }
      return;
    }
    // Web: clear pending in-memory timeouts
    webTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    webTimeoutsRef.current = [];
  }, [isNativePlatform]);

  const showWebNotification = useCallback((title: string, body: string) => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      new Notification(title, { body, icon: "/favicon.ico", badge: "/favicon.ico" });
    } catch (e) {
      console.error("Error showing web notification:", e);
    }
  }, []);

  const scheduleWebNotification = useCallback((title: string, body: string, at: Date) => {
    const delay = at.getTime() - Date.now();
    if (delay <= 0) return;
    // Browsers throttle very long timers; cap at ~24h — reschedule occurs on next app load.
    const maxDelay = 24 * 60 * 60 * 1000;
    if (delay > maxDelay) return;
    const id = window.setTimeout(() => showWebNotification(title, body), delay);
    webTimeoutsRef.current.push(id);
  }, [showWebNotification]);

  const sendTestNotification = useCallback(async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    const title = "🔔 Teste do LifeFlow";
    const body = "Se você recebeu este alerta, as notificações estão funcionando!";
    try {
      if (isNativePlatform) {
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 100000) + 900000,
            title, body,
            schedule: { at: new Date(Date.now() + 3000) },
            extra: { type: "test" },
          }],
        });
        return true;
      }
      // Web: show immediately (some browsers block scheduled ones without SW)
      window.setTimeout(() => showWebNotification(title, body), 1500);
      return true;
    } catch (e) {
      console.error("Error sending test notification:", e);
      return false;
    }
  }, [isNativePlatform, permissionGranted, requestPermission, showWebNotification]);

  // Schedule reminders based on data
  const scheduleAllReminders = useCallback(async () => {
    if (!settings.enabled || !permissionGranted) return;
    if (!isNativePlatform && !isWebNotificationSupported) return;

    await cancelAllNotifications();

    const [hours, minutes] = settings.reminderTime.split(":").map(Number);
    const notifications: ScheduleOptions["notifications"] = [];
    let id = 1;

    const push = (title: string, body: string, at: Date, extra: Record<string, unknown>) => {
      if (isNativePlatform) {
        notifications.push({ id: id++, title, body, schedule: { at }, extra });
      } else {
        scheduleWebNotification(title, body, at);
      }
    };

    // Task reminders
    if (settings.taskReminders) {
      const today = new Date().toISOString().split("T")[0];
      const upcomingTasks = tasks.filter((t) => !t.completed && t.due_date >= today);
      
      upcomingTasks.forEach((task) => {
        const dueDate = parseISO(task.due_date);
        const scheduleDate = new Date(dueDate);
        scheduleDate.setHours(hours, minutes, 0, 0);

        // Only schedule if in the future
        if (scheduleDate > new Date()) {
          push("📋 Tarefa pendente", task.title, scheduleDate, { type: "task", taskId: task.id });
        }
      });
    }

    // Goal reminders (financial)
    if (settings.goalReminders) {
      financialGoals.forEach((goal) => {
        if (goal.deadline && goal.reminder_enabled) {
          const deadline = parseISO(goal.deadline);
          const daysUntil = differenceInDays(deadline, new Date());

          // Remind 7 days before deadline
          if (daysUntil > 0 && daysUntil <= 7) {
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);
            if (scheduleDate > new Date()) {
              const progress = goal.target_amount > 0 
                ? Math.round((goal.current_amount / goal.target_amount) * 100) 
                : 0;
              push("🎯 Meta financeira", `${goal.name}: ${progress}% - Faltam ${daysUntil} dias!`, scheduleDate, { type: "financial_goal", goalId: goal.id });
            }
          }
        }
      });

      // Personal goals
      personalGoals.forEach((goal) => {
        if (goal.deadline && goal.status !== "completed") {
          const deadline = parseISO(goal.deadline);
          const daysUntil = differenceInDays(deadline, new Date());

          if (daysUntil > 0 && daysUntil <= 7) {
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);
            if (scheduleDate > new Date()) {
              push("🎯 Meta pessoal", `${goal.title}: ${goal.progress}% - Faltam ${daysUntil} dias!`, scheduleDate, { type: "personal_goal", goalId: goal.id });
            }
          }
        }
      });
    }

    // Subscription reminders
    if (settings.subscriptionReminders) {
      subscriptions.filter((s) => s.active).forEach((sub) => {
        const billingDate = parseISO(sub.next_billing_date);
        const reminderDate = addDays(billingDate, -sub.reminder_days_before);
        const scheduleDate = new Date(reminderDate);
        scheduleDate.setHours(hours, minutes, 0, 0);

        if (scheduleDate > new Date()) {
          push("💳 Cobrança próxima", `${sub.name}: R$ ${Number(sub.amount).toFixed(2)} em ${sub.reminder_days_before} dias`, scheduleDate, { type: "subscription", subscriptionId: sub.id });
        }
      });
    }

    // Installment payment reminders — 3 days before due date
    if (settings.installmentReminders) {
      const daysBefore = Math.max(1, Math.min(7, settings.installmentDaysBefore || 3));
      installmentPayments.filter((p) => !p.paid).forEach((p) => {
        const inst = installments.find((i) => i.id === p.installment_id);
        if (!inst) return;
        const due = parseISO(p.due_date);
        const days = differenceInDays(due, new Date());
        if (days < 0 || days > daysBefore + 4) return;
        const remindAt = addDays(due, -daysBefore);
        const scheduleDate = new Date(remindAt);
        scheduleDate.setHours(hours, minutes, 0, 0);
        if (scheduleDate > new Date()) {
          push("📅 Parcela vencendo", `Faltam ${daysBefore} ${daysBefore === 1 ? "dia" : "dias"} para "${inst.description}" (${p.payment_number}/${inst.installment_count}) — R$ ${Number(p.amount).toFixed(2)}`, scheduleDate, { type: "installment", paymentId: p.id });
        }
      });
    }

    // Investment opportunity tips — sent next morning highlighting the
    // current Selic/CDI/IPCA so users see fresh market context.
    if (settings.investmentTips && settings.investmentTipsFrequency !== "off" && marketRates.length) {
      const codes = ["selic", "cdi", "ipca"];
      const tips = marketRates.filter((r) => codes.includes(r.code.toLowerCase())).slice(0, 3);
      const stepDays = settings.investmentTipsFrequency === "weekly" ? 7 : 1;
      tips.forEach((r, idx) => {
        const when = new Date();
        when.setDate(when.getDate() + (stepDays === 7 ? 7 : 1) + idx * (stepDays === 7 ? 7 : 0));
        when.setHours(hours, minutes, 0, 0);
        const code = r.code.toLowerCase();
        const tipBody =
          code === "selic"
            ? `Selic atual em ${r.value}% a.a. — boa hora para revisar CDBs e Tesouro Selic.`
            : code === "cdi"
            ? `CDI atual em ${r.value}% — confira CDBs 100% CDI nas dicas.`
            : `IPCA em ${r.value}% — considere Tesouro IPCA+ para proteção contra inflação.`;
        push("💡 Oportunidade de investimento", tipBody, when, { type: "investment_tip", code: r.code });
      });
    }

    if (isNativePlatform && notifications.length > 0) {
      await scheduleNotification({ notifications });
      console.log(`Scheduled ${notifications.length} notifications`);
    }
  }, [
    settings,
    isNativePlatform,
    isWebNotificationSupported,
    permissionGranted,
    tasks,
    financialGoals,
    personalGoals,
    subscriptions,
    installmentPayments,
    installments,
    marketRates,
    cancelAllNotifications,
    scheduleNotification,
    scheduleWebNotification,
  ]);

  // Re-schedule when data changes
  useEffect(() => {
    if (settings.enabled && permissionGranted && (isNativePlatform || isWebNotificationSupported)) {
      scheduleAllReminders();
    }
  }, [tasks, financialGoals, personalGoals, subscriptions, installmentPayments, installments, marketRates, scheduleAllReminders, settings.enabled, permissionGranted, isNativePlatform, isWebNotificationSupported]);

  return {
    settings,
    updateSettings,
    permissionGranted,
    isNativePlatform,
    isWebNotificationSupported,
    requestPermission,
    scheduleAllReminders,
    cancelAllNotifications,
    sendTestNotification,
  };
}
