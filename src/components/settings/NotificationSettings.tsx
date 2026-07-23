import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Clock, CheckSquare, Target, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

export function NotificationSettings() {
  const {
    settings,
    updateSettings,
    permissionGranted,
    isNativePlatform,
    isWebNotificationSupported,
    requestPermission,
    scheduleAllReminders,
    sendTestNotification,
  } = useNotifications();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success("Permissão de notificações concedida!");
      await scheduleAllReminders();
    } else {
      toast.error("Permissão de notificações negada. Verifique as configurações do dispositivo.");
    }
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value });
    if (value && permissionGranted) {
      await scheduleAllReminders();
      toast.success("Lembretes atualizados!");
    }
  };

  const handleTimeChange = async (time: string) => {
    updateSettings({ reminderTime: time });
    if (settings.enabled && permissionGranted) {
      await scheduleAllReminders();
      toast.success("Horário dos lembretes atualizado!");
    }
  };

  const handleTest = async () => {
    const ok = await sendTestNotification();
    if (ok) toast.success("Notificação de teste enviada! Deve aparecer em 3s.");
    else toast.error("Não foi possível enviar. Verifique a permissão.");
  };

  const handleInstallmentDays = async (v: string) => {
    updateSettings({ installmentDaysBefore: Number(v) });
    if (settings.enabled && permissionGranted) await scheduleAllReminders();
  };

  const handleTipsFrequency = async (v: "daily" | "weekly" | "off") => {
    updateSettings({ investmentTipsFrequency: v });
    if (settings.enabled && permissionGranted) await scheduleAllReminders();
  };

  if (!isNativePlatform && !isWebNotificationSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações. Use um navegador moderno ou o app nativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <BellOff className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Notificações indisponíveis</p>
              <p className="text-xs text-muted-foreground">
                Instale o app nativo ou atualize seu navegador para receber alertas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificações
        </CardTitle>
        <CardDescription>
          Configure os lembretes para tarefas, metas e assinaturas.
          {!isNativePlatform && " No navegador, alertas são enviados enquanto o app está aberto."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!permissionGranted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <BellOff className="w-8 h-8 text-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium">Permissão Necessária</p>
                <p className="text-xs text-muted-foreground">
                  Permita notificações para receber lembretes.
                </p>
              </div>
            </div>
            <Button onClick={handleRequestPermission} className="w-full gap-2">
              <Bell className="w-4 h-4" />
              Permitir Notificações
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Test notification */}
            <Button onClick={handleTest} variant="outline" className="w-full gap-2 active:scale-95 transition-transform">
              <Bell className="w-4 h-4" />
              Enviar notificação de teste
            </Button>

            {/* Master toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-sm font-medium">Ativar Notificações</Label>
                  <p className="text-xs text-muted-foreground">Receber todos os lembretes</p>
                </div>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => handleToggle("enabled", checked)}
              />
            </div>

            {settings.enabled && (
              <>
                {/* Reminder time */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Horário dos Lembretes</Label>
                      <p className="text-xs text-muted-foreground">Quando enviar os lembretes</p>
                    </div>
                  </div>
                  <Input
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-28"
                  />
                </div>

                {/* Task reminders */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-tasks" />
                    <div>
                      <Label className="text-sm font-medium">Tarefas</Label>
                      <p className="text-xs text-muted-foreground">Lembrar de tarefas pendentes</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.taskReminders}
                    onCheckedChange={(checked) => handleToggle("taskReminders", checked)}
                  />
                </div>

                {/* Goal reminders */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Metas</Label>
                      <p className="text-xs text-muted-foreground">Alertas de prazo próximo</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.goalReminders}
                    onCheckedChange={(checked) => handleToggle("goalReminders", checked)}
                  />
                </div>

                {/* Subscription reminders */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-finance" />
                    <div>
                      <Label className="text-sm font-medium">Assinaturas</Label>
                      <p className="text-xs text-muted-foreground">Aviso de cobrança próxima</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.subscriptionReminders}
                    onCheckedChange={(checked) => handleToggle("subscriptionReminders", checked)}
                  />
                </div>

                {/* Installment reminders + frequency */}
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-finance" />
                      <div>
                        <Label className="text-sm font-medium">Parcelas</Label>
                        <p className="text-xs text-muted-foreground">Aviso antes do vencimento</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.installmentReminders}
                      onCheckedChange={(checked) => handleToggle("installmentReminders", checked)}
                    />
                  </div>
                  {settings.installmentReminders && (
                    <div className="flex items-center justify-between pl-8">
                      <Label className="text-xs text-muted-foreground">Antecedência</Label>
                      <Select value={String(settings.installmentDaysBefore)} onValueChange={handleInstallmentDays}>
                        <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 dia antes</SelectItem>
                          <SelectItem value="2">2 dias antes</SelectItem>
                          <SelectItem value="3">3 dias antes</SelectItem>
                          <SelectItem value="5">5 dias antes</SelectItem>
                          <SelectItem value="7">7 dias antes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Investment tips + frequency */}
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-accent" />
                      <div>
                        <Label className="text-sm font-medium">Oportunidades de investimento</Label>
                        <p className="text-xs text-muted-foreground">Dicas com base em Selic, CDI e IPCA</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.investmentTips}
                      onCheckedChange={(checked) => handleToggle("investmentTips", checked)}
                    />
                  </div>
                  {settings.investmentTips && (
                    <div className="flex items-center justify-between pl-8">
                      <Label className="text-xs text-muted-foreground">Frequência</Label>
                      <Select value={settings.investmentTipsFrequency} onValueChange={(v) => handleTipsFrequency(v as any)}>
                        <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diária</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="off">Desativada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
