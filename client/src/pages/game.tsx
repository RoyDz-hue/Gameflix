import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GameCanvas from "@/components/game/game-canvas";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Game() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bet, setBet] = useState("1");
  const [isPlaying, setIsPlaying] = useState(false);

  const gameMutation = useMutation({
    mutationFn: async (data: { score: number, multiplier: number }) => {
      const betAmount = Number(bet);
      const result = betAmount * data.multiplier;

      const res = await apiRequest("POST", "/api/games", {
        gameType: "wheel",
        score: data.score,
        bet: betAmount,
        multiplier: data.multiplier,
        result: result - betAmount, // Net win/loss
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Game completed!",
        description: "Your score and winnings have been recorded.",
      });
    },
  });

  const handleGameEnd = (score: number, multiplier: number) => {
    setIsPlaying(false);
    gameMutation.mutate({score, multiplier});
  };

  const startGame = () => {
    if (!user || Number(bet) > Number(user.balance)) {
      toast({
        title: "Insufficient balance",
        description: "Please deposit more funds to play.",
        variant: "destructive",
      });
      return;
    }
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-xl font-bold">KES {user?.balance}</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Spin & Win</h1>
                <p className="text-muted-foreground">
                  Score over 50 points to win!
                </p>
              </div>
              {!isPlaying && (
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <Label htmlFor="bet">Bet Amount</Label>
                    <Input
                      id="bet"
                      type="number"
                      min="1"
                      step="1"
                      value={bet}
                      onChange={(e) => setBet(e.target.value)}
                    />
                  </div>
                  <Button onClick={startGame} disabled={gameMutation.isPending}>
                    Start Game
                  </Button>
                </div>
              )}
            </div>

            <GameCanvas
              isPlaying={isPlaying}
              onGameEnd={handleGameEnd}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}