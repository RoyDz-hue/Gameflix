import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Transaction, Game } from "@shared/schema";
import BalanceWidget from "@/components/dashboard/balance-widget";
import ReferralWidget from "@/components/dashboard/referral-widget";
import StatsCard from "@/components/ui/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, GamepadIcon, History, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const totalGames = games?.length ?? 0;
  const totalWinnings = games?.reduce((sum, game) => sum + Number(game.result), 0) ?? 0;
  const winRate = totalGames ?
    (games?.filter(game => Number(game.result) > 0).length ?? 0) / totalGames * 100 :
    0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
          <Link href="/game">
            <Button>
              Play Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BalanceWidget
            balance={user?.balance ?? 0}
            transactions={transactions ?? []}
          />
          <ReferralWidget referralCode={user?.referralCode ?? ""} />
          <StatsCard
            title="Gaming Stats"
            icon={<GamepadIcon className="h-4 w-4" />}
            stats={[
              { label: "Total Games", value: totalGames.toString() },
              { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
              { label: "Total Winnings", value: `KES ${totalWinnings.toFixed(2)}` },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </h2>
            </div>
            <div className="space-y-4">
              {transactions?.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`font-medium ${Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(tx.amount) >= 0 ? '+' : ''}KES {Math.abs(Number(tx.amount)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GamepadIcon className="h-5 w-5" />
                Recent Games
              </h2>
            </div>
            <div className="space-y-4">
              {games?.slice(0, 5).map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">Game #{game.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Score: {game.score}
                    </p>
                  </div>
                  <p className={`font-medium ${Number(game.result) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(game.result) >= 0 ? '+' : ''}KES {Math.abs(Number(game.result)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}