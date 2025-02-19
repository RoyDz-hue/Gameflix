import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Users, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ReferralWidgetProps {
  referralCode: string;
}

export default function ReferralWidget({ referralCode }: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: referrals } = useQuery<User[]>({
    queryKey: ["/api/referrals"],
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 rounded bg-muted font-mono text-sm">
                {referralCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Referral Stats</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{referrals?.length ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Earnings</p>
                <p className="text-2xl font-bold">
                  ${((referrals?.length ?? 0) * 5).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {referrals && referrals.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recent Referrals</p>
              <div className="space-y-2">
                {referrals.slice(0, 3).map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted"
                  >
                    <p className="font-medium">{referral.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
