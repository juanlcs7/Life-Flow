import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { addMonths, format } from "date-fns";
import { logHistoryEvent } from "./useHistoryEvents";
import { useEffect, useRef } from "react";
import { parseISO, isBefore, startOfDay } from "date-fns";

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

export function useInstallments() {
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

  // Helper to get account name
  const getAccountName = async (accountId: string | null): Promise<string | null> => {
    if (!accountId) return null;
    const { data } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", accountId)
      .maybeSingle();
    return data?.name || null;
  };

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
        const dueDate = addMonths(new Date(installment.first_payment_date), i);
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
      
      // Get payment details
      const payment = (paymentsQuery.data || []).find(p => p.id === paymentId);
      if (!payment) throw new Error("Parcela não encontrada");
      
      // Get installment details
      const installment = (query.data || []).find(i => i.id === payment.installment_id);
      if (!installment) throw new Error("Parcelamento não encontrado");
      
      if (paid) {
        // Create expense transaction when marking as paid
        const { data: transactionData, error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type: "expense",
            category: installment.category,
            amount: payment.amount,
            description: `${installment.description} (${payment.payment_number}/${installment.installment_count})`,
            date: format(new Date(), "yyyy-MM-dd"),
            account_id: installment.account_id,
          })
          .select()
          .single();
        
        if (transactionError) throw transactionError;
        
        // Update account balance if account is linked
        if (installment.account_id) {
          const { data: accountData, error: accountError } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", installment.account_id)
            .single();
          
          if (!accountError && accountData) {
            await supabase
              .from("accounts")
              .update({ balance: accountData.balance - payment.amount })
              .eq("id", installment.account_id);
          }
        }
        
        // Update payment as paid with transaction reference
        const { error } = await supabase
          .from("installment_payments")
          .update({ 
            paid: true, 
            paid_date: format(new Date(), "yyyy-MM-dd"),
          })
          .eq("id", paymentId);
        
        if (error) throw error;

        // Log to history
        const accountName = await getAccountName(installment.account_id);
        await logHistoryEvent(user.id, {
          event_type: "finance",
          action: "payment",
          title: `${installment.description} (${payment.payment_number}/${installment.installment_count})`,
          description: "Parcela paga",
          amount: payment.amount,
          category: installment.category,
          account_name: accountName,
          reference_id: paymentId,
          reference_type: "installment_payment",
          metadata: { installment_id: installment.id, payment_number: payment.payment_number },
        });
        
        return { transactionId: transactionData.id };
      } else {
        // When unmarking as paid, find and delete the related transaction
        // Search for transaction with matching description pattern
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "expense")
          .eq("amount", payment.amount)
          .ilike("description", `%${installment.description}%${payment.payment_number}/${installment.installment_count}%`);
        
        if (transactions && transactions.length > 0) {
          const transactionToDelete = transactions[0];
          
          // Revert account balance if account was linked
          if (transactionToDelete.account_id) {
            const { data: accountData } = await supabase
              .from("accounts")
              .select("balance")
              .eq("id", transactionToDelete.account_id)
              .single();
            
            if (accountData) {
              await supabase
                .from("accounts")
                .update({ balance: accountData.balance + payment.amount })
                .eq("id", transactionToDelete.account_id);
            }
          }
          
          // Delete the most recent matching transaction
          const { error: deleteError } = await supabase
            .from("transactions")
            .delete()
            .eq("id", transactionToDelete.id);
          
          if (deleteError) throw deleteError;
        }
        
        // Update payment as unpaid
        const { error } = await supabase
          .from("installment_payments")
          .update({ 
            paid: false, 
            paid_date: null,
          })
          .eq("id", paymentId);
        
        if (error) throw error;

        // Log refund to history
        const accountName = await getAccountName(installment.account_id);
        await logHistoryEvent(user.id, {
          event_type: "finance",
          action: "refund",
          title: `${installment.description} (${payment.payment_number}/${installment.installment_count})`,
          description: "Pagamento de parcela estornado",
          amount: payment.amount,
          category: installment.category,
          account_name: accountName,
          reference_id: paymentId,
          reference_type: "installment_payment",
          metadata: { installment_id: installment.id, payment_number: payment.payment_number },
        });
      }
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

  // Auto-debit processor: pays installment_payments whose installment has
  // auto_debit=true, account linked, and due_date <= today, that are still
  // unpaid. Runs once per session.
  const processedRef = useRef(false);
  useEffect(() => {
    if (!user || !query.data || !paymentsQuery.data || processedRef.current)
      return;
    processedRef.current = true;
    (async () => {
      const today = startOfDay(new Date());
      const autoDebitInstallmentIds = new Set(
        query.data
          .filter((i) => (i as any).auto_debit && i.account_id)
          .map((i) => i.id),
      );
      const due = paymentsQuery.data.filter(
        (p) =>
          !p.paid &&
          autoDebitInstallmentIds.has(p.installment_id) &&
          !isBefore(today, parseISO(p.due_date)),
      );
      for (const p of due) {
        try {
          await markPaymentPaidMutation.mutateAsync({
            paymentId: p.id,
            paid: true,
          });
        } catch (e) {
          console.error("auto-debit parcela falhou", e);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, query.data, paymentsQuery.data]);

  // Calculate monthly impact
  const monthlyImpact = (query.data || []).reduce((sum, inst) => sum + inst.installment_amount, 0);

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
