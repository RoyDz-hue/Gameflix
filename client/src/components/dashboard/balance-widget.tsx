import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Transaction } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface BalanceWidgetProps {
  balance: number | string;
  transactions: Transaction[];
}

export default function BalanceWidget({ balance, transactions }: BalanceWidgetProps) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  // Convert balance from string to number for display
  const numericBalance = typeof balance === 'string' ? Number(balance) : balance;

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number; phone: string }) => {
      const res = await apiRequest("POST", "/api/transactions/deposit", data);
      return res.json();
    },
    onSuccess: async (data) => {
      // Start polling for transaction status
      const pollStatus = async () => {
        try {
          const res = await apiRequest("GET", `/api/transactions/status/${data.paymentRef}`);
          const status = await res.json();

          if (status.status === "SUCCESS" && status.success === true) {
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({
              title: "Deposit successful",
              description: `Added KES ${amount} to your balance`,
            });
            return true;
          } else if (status.status === "FAILED" || status.success === false) {
            toast({
              title: "Deposit failed",
              description: "The payment was not completed",
              variant: "destructive",
            });
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      };

      // Poll every 5 seconds for up to 2 minutes
      for (let i = 0; i < 24; i++) {
        const done = await pollStatus();
        if (done) break;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      setAmount("");
      setPhone("");
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Similar update for withdrawMutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: {amount: number; phone: string}) => {
      if (data.amount <= 0) {
        throw new Error("Please enter a valid amount greater than 0");
      }

      if (data.amount > numericBalance) {
        throw new Error("Insufficient balance for withdrawal");
      }

      const res = await apiRequest("POST", "/api/transactions/withdraw", data);
      return await res.json();
    },
    onSuccess: async (data) => {
      // Start polling for transaction status
      const pollStatus = async () => {
        try {
          const res = await apiRequest("GET", `/api/transactions/status/${data.paymentRef}`);
          const status = await res.json();

          if (status.status === "SUCCESS" && status.success === true) {
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({
              title: "Withdrawal successful",
              description: `Withdrawn KES ${amount} from your balance`,
            });
            return true;
          } else if (status.status === "FAILED" || status.success === false) {
            toast({
              title: "Withdrawal failed",
              description: "The withdrawal was not completed",
              variant: "destructive",
            });
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      };

      // Poll every 5 seconds for up to 2 minutes
      for (let i = 0; i < 24; i++) {
        const done = await pollStatus();
        if (done) break;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      setAmount("");
      setPhone("");
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold">KES {numericBalance.toFixed(2)}</p>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Deposit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>M-Pesa Deposit</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      depositMutation.mutate({
                        amount: Number(amount),
                        phone: phone,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="amount">Amount (KES)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. 0712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={depositMutation.isPending}
                    >
                      {depositMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Pay with M-Pesa"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowDownRight className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>M-Pesa Withdrawal</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      withdrawMutation.mutate({
                        amount: Number(amount),
                        phone: phone
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="amount">Amount (KES)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        max={numericBalance}
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="withdraw-phone">Phone Number</Label>
                      <Input
                        id="withdraw-phone"
                        type="tel"
                        placeholder="e.g. 0712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={withdrawMutation.isPending}
                    >
                      {withdrawMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Withdraw to M-Pesa"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}