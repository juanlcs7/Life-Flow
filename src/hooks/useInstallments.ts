import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { addMonths, format, parseISO } from "date-fns";
import { activeInstallmentMonthlyImpact } from "@/lib/financialCalculations";

export interface Installment {
  id: string;
  user_id: string;
  description: string;
  total_amount: number;
  installment_count: number;
  installment_amount: number;
  first_payment_date: string;
  category: string;
  account_id: string | null;
  auto_debit: boolean;
  created_at: string;
}

export interface InstallmentPayment {
  id: string;
  installment_id: string;
  payment_number: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string | null;
  created_at: string;
  transaction_id?: string | null;
}

export type NewInstallment = Omit<Installment, "id" | "user_id" | "created_at">;

export function useInstallments({
  processAutoDebit = true,
}: {
  processAutoDebit?: boolean;
} = {}) {
  // Kept for backwards compatibility; processing now runs in Supabase Cron.
  void processAutoDebit;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["installments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("installments")
        .select("*")
        .order("first_payment_date", { ascending: true });

      if (error) throw error;
      return data as Installment[];
    },
    enabled: !!user,
  });

  const paymentsQuery = useQuery({
    queryKey: ["installment_payments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("installment_payments")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as InstallmentPayment[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (installment: NewInstallment) => {
      if (!user) throw new Error("User not authenticated");
      
      // Create installment
      const { data, error } = await supabase
        .from("installments")
        .insert({ ...installment, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Create individual payments
      const payments = [];
      for (let i = 0; i < installment.installment_count; i++) {
        const dueDate = addMonths(parseISO(installment.first_payment_date), i);
        payments.push({
          installment_id: data.id,
          payment_number: i + 1,
          amount: installment.installment_amount,
          due_date: format(dueDate, "yyyy-MM-dd"),
          paid: false,
        });
      }

      const { error: paymentsError } = await supabase
        .from("installment_payments")
        .insert(payments);

      if (paymentsError) throw paymentsError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["installment_payments", user?.id] });
    },
  });

  const markPaymentPaidMutation = useMutation({
    mutationFn: async ({ paymentId, paid }: { paymentId: string; paid: boolean }) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc("set_installment_payment_status", {
        p_payment_id: paymentId,
        p_paid: paid,
      });
      if (error) throw error;
      return { transactionId: data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installment_payments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("installments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["installment_payments", user?.id] });
    },
  });

  // Calculate monthly impact
  const monthlyImpact = activeInstallmentMonthlyImpact(query.data || [], paymentsQuery.data || []);

  return {
    installments: query.data ?? [],
    payments: paymentsQuery.data ?? [],
    monthlyImpact,
    isLoading: query.isLoading || paymentsQuery.isLoading,
    error: query.error || paymentsQuery.error,
    addInstallment: addMutation.mutateAsync,
    markPaymentPaid: markPaymentPaidMutation.mutateAsync,
    deleteInstallment: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
