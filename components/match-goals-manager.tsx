"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Trophy } from "lucide-react"
import { getMatchGoals, addMatchGoal, deleteMatchGoal } from "@/lib/database"
import type { Match, MatchGoal } from "@/lib/supabase"

interface MatchGoalsManagerProps {
  match: Match
  onGoalsUpdated: () => void
}

export function MatchGoalsManager({ match, onGoalsUpdated }: MatchGoalsManagerProps) {
  const [goals, setGoals] = useState<MatchGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [goalForm, setGoalForm] = useState({
    player_name: "",
    team_name: match.home_team,
    minute: "",
    goal_type: "regular" as "regular" | "penalty" | "own_goal",
  })

  useEffect(() => {
    loadGoals()
  }, [match.id])

  const loadGoals = async () => {
    try {
      const goalsData = await getMatchGoals(match.id)
      setGoals(goalsData)
    } catch (error) {
      console.error("Error loading goals:", error)
    }
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addMatchGoal({
        match_id: match.id,
        player_name: goalForm.player_name,
        team_name: goalForm.team_name,
        minute: goalForm.minute ? Number.parseInt(goalForm.minute) : undefined,
        goal_type: goalForm.goal_type,
      })

      setGoalForm({
        player_name: "",
        team_name: match.home_team,
        minute: "",
        goal_type: "regular",
      })
      await loadGoals()
      onGoalsUpdated()
    } catch (error) {
      console.error("Error adding goal:", error)
    }
    setLoading(false)
  }

  const handleDeleteGoal = async (goalId: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей гол?")) {
      try {
        await deleteMatchGoal(goalId)
        await loadGoals()
        onGoalsUpdated()
      } catch (error) {
        console.error("Error deleting goal:", error)
      }
    }
  }

  return (
    <div className="space-y-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
      <h4 className="font-bold text-white flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        Автори голів: {match.home_team} {match.home_score} - {match.away_score} {match.away_team}
      </h4>

      {/* Add Goal Form */}
      <form onSubmit={handleAddGoal} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="goal-player-name" className="text-white font-bold text-sm">
              Ім'я гравця
            </Label>
            <Input
              id="goal-player-name"
              value={goalForm.player_name}
              onChange={(e) => setGoalForm({ ...goalForm, player_name: e.target.value })}
              required
              className="bg-white/10 border-blue-500/30 text-white placeholder:text-blue-200"
            />
          </div>
          <div>
            <Label htmlFor="goal-team-name" className="text-white font-bold text-sm">
              Команда
            </Label>
            <Select
              value={goalForm.team_name}
              onValueChange={(value) => setGoalForm({ ...goalForm, team_name: value })}
            >
              <SelectTrigger className="bg-white/10 border-blue-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900/95 backdrop-blur-md border-blue-500/30">
                <SelectItem value={match.home_team} className="text-white hover:bg-blue-600/30">
                  {match.home_team}
                </SelectItem>
                <SelectItem value={match.away_team} className="text-white hover:bg-blue-600/30">
                  {match.away_team}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="goal-minute" className="text-white font-bold text-sm">
              Хвилина
            </Label>
            <Input
              id="goal-minute"
              type="number"
              min="1"
              max="120"
              value={goalForm.minute}
              onChange={(e) => setGoalForm({ ...goalForm, minute: e.target.value })}
              className="bg-white/10 border-blue-500/30 text-white placeholder:text-blue-200"
            />
          </div>
          <div>
            <Label htmlFor="goal-type" className="text-white font-bold text-sm">
              Тип голу
            </Label>
            <Select
              value={goalForm.goal_type}
              onValueChange={(value) =>
                setGoalForm({ ...goalForm, goal_type: value as "regular" | "penalty" | "own_goal" })
              }
            >
              <SelectTrigger className="bg-white/10 border-blue-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-blue-900/95 backdrop-blur-md border-blue-500/30">
                <SelectItem value="regular" className="text-white hover:bg-blue-600/30">
                  Звичайний
                </SelectItem>
                <SelectItem value="penalty" className="text-white hover:bg-blue-600/30">
                  Пенальті
                </SelectItem>
                <SelectItem value="own_goal" className="text-white hover:bg-blue-600/30">
                  Автогол
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
          <Plus className="h-4 w-4 mr-2" />
          Додати гол
        </Button>
      </form>

      {/* Goals List */}
      <div className="space-y-2">
        <h5 className="font-bold text-blue-300 text-sm">Список голів:</h5>
        {goals.length === 0 ? (
          <div className="text-center py-4 text-blue-200 text-sm">Немає доданих голів</div>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-blue-500/30"
              >
                <div className="text-sm">
                  <span className="font-bold text-white">{goal.player_name}</span>
                  <span className="text-blue-200 ml-2">({goal.team_name})</span>
                  {goal.minute && <span className="text-yellow-400 ml-2">{goal.minute}'</span>}
                  {goal.goal_type === "penalty" && <span className="text-orange-400 ml-1">(пен.)</span>}
                  {goal.goal_type === "own_goal" && <span className="text-red-400 ml-1">(автогол)</span>}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
