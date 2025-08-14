"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  Calendar,
  Target,
  Clock,
  Trophy,
  AlertTriangle,
  Crosshair,
} from "lucide-react"
import {
  getChampionships,
  addChampionship,
  updateChampionship,
  deleteChampionship,
  getTeams,
  addTeam,
  updateTeam,
  deleteTeam,
  getMatches,
  addMatch,
  updateMatch,
  deleteMatch,
  getPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
  getMatchGoals,
  addMatchGoal,
  deleteMatchGoal,
} from "@/lib/database"
import type { Championship, Team, Match, Player, MatchGoal } from "@/lib/supabase"

interface AdminPanelProps {
  onLogout: () => void
  currentChampionshipId: number
  onChampionshipChange: (id: number) => void
}

export function AdminPanel({ onLogout, currentChampionshipId, onChampionshipChange }: AdminPanelProps) {
  const [championships, setChampionships] = useState<Championship[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)

  // Championship form state
  const [championshipForm, setChampionshipForm] = useState({
    name: "",
    season: "",
    is_active: false,
    tournament_type: "league",
  })
  const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null)

  // Team form state
  const [teamForm, setTeamForm] = useState({ name: "", logo: "" })
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  // Match form state
  const [matchForm, setMatchForm] = useState({
    round: 1,
    date: "",
    home_team: "",
    away_team: "",
    home_score: "",
    away_score: "",
    is_finished: false,
    match_time: "",
    cup_stage: "",
    is_technical_defeat: false,
    technical_winner: "",
    penalty_home: "",
    penalty_away: "",
    penalty_winner: "",
    finished_after_penalties: false,
  })
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)

  // Player form state
  const [playerForm, setPlayerForm] = useState({ name: "", team: "", goals: 0 })
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

  // Match goals state
  const [selectedMatchForGoals, setSelectedMatchForGoals] = useState<Match | null>(null)
  const [matchGoals, setMatchGoals] = useState<MatchGoal[]>([])
  const [goalForm, setGoalForm] = useState({
    player_name: "",
    team_name: "",
    minute: "",
    goal_type: "regular" as "regular" | "penalty" | "own_goal",
  })

  const currentChampionship = championships.find((c) => c.id === currentChampionshipId)

  useEffect(() => {
    loadData()
  }, [currentChampionshipId])

  const loadData = async () => {
    try {
      const championshipsData = await getChampionships()
      setChampionships(championshipsData)

      if (currentChampionshipId && currentChampionshipId > 0) {
        const [teamsData, matchesData, playersData] = await Promise.all([
          getTeams(currentChampionshipId),
          getMatches(currentChampionshipId),
          getPlayers(currentChampionshipId),
        ])
        setTeams(teamsData)
        setMatches(matchesData)
        setPlayers(playersData)
      } else {
        setTeams([])
        setMatches([])
        setPlayers([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  // Championship handlers
  const handleChampionshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingChampionship) {
        await updateChampionship(editingChampionship.id, championshipForm)
        setEditingChampionship(null)
      } else {
        const newChampionship = await addChampionship(championshipForm)
        onChampionshipChange(newChampionship.id)
      }
      setChampionshipForm({ name: "", season: "", is_active: false, tournament_type: "league" })
      await loadData()
    } catch (error) {
      console.error("Error saving championship:", error)
    }
    setLoading(false)
  }

  const handleDeleteChampionship = async (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей чемпіонат? Це також видалить всі команди, матчі та гравців.")) {
      try {
        await deleteChampionship(id)
        await loadData()
        if (id === currentChampionshipId && championships.length > 1) {
          const remainingChampionships = championships.filter((c) => c.id !== id)
          if (remainingChampionships.length > 0) {
            onChampionshipChange(remainingChampionships[0].id)
          } else {
            onChampionshipChange(0)
          }
        }
      } catch (error) {
        console.error("Error deleting championship:", error)
      }
    }
  }

  // Team handlers
  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0) {
      alert("Спочатку створіть чемпіонат")
      return
    }

    setLoading(true)
    try {
      const teamData = {
        name: teamForm.name,
        logo: teamForm.logo,
        championship_id: currentChampionshipId,
      }

      if (editingTeam) {
        await updateTeam(editingTeam.id, teamData)
        setEditingTeam(null)
      } else {
        await addTeam(teamData)
      }
      setTeamForm({ name: "", logo: "" })
      await loadData()
    } catch (error) {
      console.error("Error saving team:", error)
      alert("Помилка при збереженні команди: " + error.message)
    }
    setLoading(false)
  }

  const handleDeleteTeam = async (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю команду?")) {
      try {
        await deleteTeam(id)
        await loadData()
      } catch (error) {
        console.error("Error deleting team:", error)
      }
    }
  }

  // Match handlers
  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0) {
      alert("Спочатку створіть чемпіонат")
      return
    }

    if (matchForm.home_team === matchForm.away_team) {
      alert("Команда не може грати сама з собою!")
      return
    }

    setLoading(true)
    try {
      const matchData = {
        round: matchForm.round,
        date: matchForm.date,
        home_team: matchForm.home_team,
        away_team: matchForm.away_team,
        home_score: matchForm.is_technical_defeat
          ? null
          : matchForm.home_score
            ? Number.parseInt(matchForm.home_score)
            : null,
        away_score: matchForm.is_technical_defeat
          ? null
          : matchForm.away_score
            ? Number.parseInt(matchForm.away_score)
            : null,
        is_finished: matchForm.is_finished,
        championship_id: currentChampionshipId,
        match_time: matchForm.match_time,
        cup_stage: currentChampionship?.tournament_type === "cup" ? matchForm.cup_stage : null,
        is_technical_defeat: matchForm.is_technical_defeat,
        technical_winner: matchForm.is_technical_defeat ? matchForm.technical_winner : null,
        penalty_home:
          matchForm.finished_after_penalties && matchForm.penalty_home ? Number.parseInt(matchForm.penalty_home) : null,
        penalty_away:
          matchForm.finished_after_penalties && matchForm.penalty_away ? Number.parseInt(matchForm.penalty_away) : null,
        penalty_winner: matchForm.finished_after_penalties ? matchForm.penalty_winner : null,
      }

      if (editingMatch) {
        await updateMatch(editingMatch.id, matchData)
        setEditingMatch(null)
      } else {
        await addMatch(matchData)
      }

      setMatchForm({
        round: 1,
        date: "",
        home_team: "",
        away_team: "",
        home_score: "",
        away_score: "",
        is_finished: false,
        match_time: "",
        cup_stage: "",
        is_technical_defeat: false,
        technical_winner: "",
        penalty_home: "",
        penalty_away: "",
        penalty_winner: "",
        finished_after_penalties: false,
      })
      await loadData()
    } catch (error) {
      console.error("Error saving match:", error)
      alert("Помилка при збереженні матчу: " + error.message)
    }
    setLoading(false)
  }

  const handleDeleteMatch = async (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей матч?")) {
      try {
        await deleteMatch(id)
        await loadData()
      } catch (error) {
        console.error("Error deleting match:", error)
      }
    }
  }

  // Match goals handlers
  const loadMatchGoals = async (matchId: number) => {
    try {
      const goals = await getMatchGoals(matchId)
      setMatchGoals(goals)
    } catch (error) {
      console.error("Error loading match goals:", error)
    }
  }

  const handleAddMatchGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMatchForGoals) return

    setLoading(true)
    try {
      await addMatchGoal({
        match_id: selectedMatchForGoals.id,
        player_name: goalForm.player_name,
        team_name: goalForm.team_name,
        minute: goalForm.minute ? Number.parseInt(goalForm.minute) : undefined,
        goal_type: goalForm.goal_type,
      })

      setGoalForm({
        player_name: "",
        team_name: selectedMatchForGoals.home_team,
        minute: "",
        goal_type: "regular",
      })
      await loadMatchGoals(selectedMatchForGoals.id)
    } catch (error) {
      console.error("Error adding match goal:", error)
      alert("Помилка при додаванні голу: " + error.message)
    }
    setLoading(false)
  }

  const handleDeleteMatchGoal = async (goalId: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей гол?")) {
      try {
        await deleteMatchGoal(goalId)
        if (selectedMatchForGoals) {
          await loadMatchGoals(selectedMatchForGoals.id)
        }
      } catch (error) {
        console.error("Error deleting match goal:", error)
      }
    }
  }

  // Player handlers
  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0) {
      alert("Спочатку створіть чемпіонат")
      return
    }

    if (!playerForm.team) {
      alert("Оберіть команду для гравця")
      return
    }

    setLoading(true)
    try {
      const playerData = { ...playerForm, championship_id: currentChampionshipId }
      if (editingPlayer) {
        await updatePlayer(editingPlayer.id, playerData)
        setEditingPlayer(null)
      } else {
        await addPlayer(playerData)
      }
      setPlayerForm({ name: "", team: "", goals: 0 })
      await loadData()
    } catch (error) {
      console.error("Error saving player:", error)
      alert("Помилка при збереженні гравця: " + error.message)
    }
    setLoading(false)
  }

  const handleDeletePlayer = async (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цього гравця?")) {
      try {
        await deletePlayer(id)
        await loadData()
      } catch (error) {
        console.error("Error deleting player:", error)
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {championships.length > 0 ? (
            <Select
              value={currentChampionshipId.toString()}
              onValueChange={(value) => onChampionshipChange(Number.parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-48 bg-white/10 border-2 border-blue-400/30 text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300 rounded-xl shadow-lg">
                <SelectValue placeholder="Оберіть чемпіонат" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 backdrop-blur-md border-blue-400/30">
                {championships.map((championship) => (
                  <SelectItem
                    key={championship.id}
                    value={championship.id.toString()}
                    className="text-white hover:bg-slate-800/30"
                  >
                    {championship.name} ({championship.season})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-blue-200">Немає створених чемпіонатів</div>
          )}
        </div>
        <Button
          variant="outline"
          onClick={onLogout}
          className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30 w-full sm:w-auto"
        >
          Вийти
        </Button>
      </div>

      <Tabs defaultValue="championships" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 p-1 sm:p-2 rounded-2xl shadow-2xl shadow-blue-600/20 gap-1">
          <TabsTrigger
            value="championships"
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-slate-700 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 data-[state=active]:border-2 data-[state=active]:border-blue-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col sm:flex-row items-center gap-1 sm:gap-2"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Чемпіонати</span>
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            disabled={!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0}
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:via-cyan-700 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-500/50 data-[state=active]:border-2 data-[state=active]:border-cyan-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col sm:flex-row items-center gap-1 sm:gap-2 disabled:opacity-50"
          >
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Команди</span>
          </TabsTrigger>
          <TabsTrigger
            value="matches"
            disabled={!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0}
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:via-emerald-700 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50 data-[state=active]:border-2 data-[state=active]:border-green-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col sm:flex-row items-center gap-1 sm:gap-2 disabled:opacity-50"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Матчі</span>
          </TabsTrigger>
          <TabsTrigger
            value="players"
            disabled={!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0}
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:via-amber-600 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 data-[state=active]:border-2 data-[state=active]:border-yellow-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col sm:flex-row items-center gap-1 sm:gap-2 disabled:opacity-50"
          >
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Гравці</span>
          </TabsTrigger>
        </TabsList>

        {/* Championships Tab */}
        <TabsContent value="championships" className="space-y-4">
          <form
            onSubmit={handleChampionshipSubmit}
            className="space-y-4 p-4 sm:p-6 bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl shadow-2xl shadow-blue-600/30"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="championship-name" className="text-white font-bold text-sm">
                  Назва чемпіонату
                </Label>
                <Input
                  id="championship-name"
                  value={championshipForm.name}
                  onChange={(e) => setChampionshipForm({ ...championshipForm, name: e.target.value })}
                  required
                  className="bg-white/10 border-2 border-blue-400/30 text-white placeholder:text-blue-200 rounded-xl h-10 sm:h-12"
                />
              </div>
              <div>
                <Label htmlFor="championship-season" className="text-white font-bold text-sm">
                  Сезон
                </Label>
                <Input
                  id="championship-season"
                  value={championshipForm.season}
                  onChange={(e) => setChampionshipForm({ ...championshipForm, season: e.target.value })}
                  required
                  className="bg-white/10 border-2 border-blue-400/30 text-white placeholder:text-blue-200 rounded-xl h-10 sm:h-12"
                />
              </div>
              <div>
                <Label htmlFor="tournament-type" className="text-white font-bold text-sm">
                  Тип турніру
                </Label>
                <Select
                  value={championshipForm.tournament_type}
                  onValueChange={(value) =>
                    setChampionshipForm({ ...championshipForm, tournament_type: value as "league" | "cup" })
                  }
                >
                  <SelectTrigger className="bg-white/10 border-2 border-blue-400/30 text-white rounded-xl h-10 sm:h-12">
                    <SelectValue placeholder="Оберіть тип" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 backdrop-blur-md border-blue-400/30">
                    <SelectItem value="league" className="text-white hover:bg-slate-800/30">
                      Ліга
                    </SelectItem>
                    <SelectItem value="cup" className="text-white hover:bg-slate-800/30">
                      Кубок
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={championshipForm.is_active}
                  onChange={(e) => setChampionshipForm({ ...championshipForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-blue-400/30 rounded"
                />
                <Label htmlFor="is-active" className="text-white font-bold text-sm">
                  Активний
                </Label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 via-slate-700 to-blue-600 hover:from-blue-700 hover:via-slate-800 hover:to-blue-700 text-white font-bold shadow-lg shadow-blue-600/50 rounded-xl border-2 border-blue-400/30 h-12"
              >
                <Plus className="h-4 w-4 mr-2" />
                {editingChampionship ? "Оновити" : "Додати"} чемпіонат
              </Button>
              {editingChampionship && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingChampionship(null)
                    setChampionshipForm({ name: "", season: "", is_active: false, tournament_type: "league" })
                  }}
                  className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 rounded-xl h-12"
                >
                  Скасувати
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {championships.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-blue-200 bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl">
                Немає створених чемпіонатів. Створіть перший чемпіонат вище.
              </div>
            ) : (
              championships.map((championship) => (
                <div
                  key={championship.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
                >
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg">{championship.name}</div>
                    <div className="text-sm text-blue-200 font-semibold">
                      Сезон: {championship.season} | {championship.is_active ? "Активний" : "Неактивний"} |{" "}
                      {championship.tournament_type === "league" ? "Ліга" : "Кубок"}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingChampionship(championship)
                        setChampionshipForm({
                          name: championship.name,
                          season: championship.season,
                          is_active: championship.is_active,
                          tournament_type: championship.tournament_type,
                        })
                      }}
                      className="bg-blue-600/20 border-blue-400/30 text-white hover:bg-blue-600/30 rounded-xl flex-1 sm:flex-none"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteChampionship(championship.id)}
                      className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30 rounded-xl flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          {!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-blue-200 bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl">
              Спочатку створіть чемпіонат
            </div>
          ) : (
            <>
              <div className="bg-slate-700/20 p-4 rounded-2xl mb-4 border-2 border-cyan-400/30 backdrop-blur-sm">
                <div className="text-sm text-white font-bold">
                  <strong>Поточний чемпіонат:</strong> {championships.find((c) => c.id === currentChampionshipId)?.name}{" "}
                  ({championships.find((c) => c.id === currentChampionshipId)?.season})
                </div>
                <div className="text-xs text-cyan-200 mt-1 font-semibold">
                  Команди будуть додані до цього чемпіонату
                </div>
              </div>
              <form
                onSubmit={handleTeamSubmit}
                className="space-y-4 p-4 sm:p-6 bg-white/5 backdrop-blur-2xl border-2 border-cyan-400/30 rounded-3xl shadow-2xl shadow-cyan-600/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team-name" className="text-white font-bold text-sm">
                      Назва команди
                    </Label>
                    <Input
                      id="team-name"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      required
                      className="bg-white/10 border-2 border-cyan-400/30 text-white placeholder:text-cyan-200 rounded-xl h-10 sm:h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="team-logo" className="text-white font-bold text-sm">
                      URL логотипу
                    </Label>
                    <Input
                      id="team-logo"
                      value={teamForm.logo}
                      onChange={(e) => setTeamForm({ ...teamForm, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="bg-white/10 border-2 border-cyan-400/30 text-white placeholder:text-cyan-200 rounded-xl h-10 sm:h-12"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-slate-700 via-cyan-700 to-slate-700 hover:from-slate-800 hover:via-cyan-800 hover:to-slate-800 text-white font-bold shadow-lg shadow-slate-700/50 rounded-xl border-2 border-cyan-400/30 h-12"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {editingTeam ? "Оновити" : "Додати"} команду
                  </Button>
                  {editingTeam && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingTeam(null)
                        setTeamForm({ name: "", logo: "" })
                      }}
                      className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 rounded-xl h-12"
                    >
                      Скасувати
                    </Button>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                {teams.length === 0 ? (
                  <div className="text-center py-8 text-cyan-200 bg-white/5 backdrop-blur-2xl border-2 border-cyan-400/30 rounded-3xl">
                    Немає команд. Додайте першу команду вище.
                  </div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/5 backdrop-blur-2xl border-2 border-cyan-400/30 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={team.logo || "/placeholder.svg?height=32&width=32"}
                          alt={team.name}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-cyan-400/30 object-cover"
                        />
                        <span className="font-bold text-white text-lg">{team.name}</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTeam(team)
                            setTeamForm({ name: team.name, logo: team.logo || "" })
                          }}
                          className="bg-cyan-600/20 border-cyan-400/30 text-white hover:bg-cyan-600/30 rounded-xl flex-1 sm:flex-none"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTeam(team.id)}
                          className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30 rounded-xl flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-4">
          {!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-blue-200 bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl">
              Спочатку створіть чемпіонат
            </div>
          ) : teams.length < 2 ? (
            <div className="text-center py-8 sm:py-12 text-green-200 bg-white/5 backdrop-blur-2xl border-2 border-green-400/30 rounded-3xl">
              Додайте принаймні 2 команди для створення матчів
            </div>
          ) : (
            <>
              <div className="bg-green-600/20 p-4 rounded-2xl mb-4 border-2 border-green-400/30 backdrop-blur-sm">
                <div className="text-sm text-white font-bold">
                  <strong>Поточний чемпіонат:</strong> {championships.find((c) => c.id === currentChampionshipId)?.name}{" "}
                  ({championships.find((c) => c.id === currentChampionshipId)?.season})
                </div>
                <div className="text-xs text-green-200 mt-1 font-semibold">Матчі будуть додані до цього чемпіонату</div>
              </div>
              <form
                onSubmit={handleMatchSubmit}
                className="space-y-4 p-4 sm:p-6 bg-white/5 backdrop-blur-2xl border-2 border-green-400/30 rounded-3xl shadow-2xl shadow-green-600/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="match-round" className="text-white font-bold text-sm">
                      {currentChampionship?.tournament_type === "cup" ? "Стадія" : "Тур"}
                    </Label>
                    {currentChampionship?.tournament_type === "cup" ? (
                      <Select
                        value={matchForm.cup_stage}
                        onValueChange={(value) => setMatchForm({ ...matchForm, cup_stage: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-2 border-green-400/30 text-white rounded-xl h-10 sm:h-12">
                          <SelectValue placeholder="Оберіть стадію" />
                        </SelectTrigger>
                        <SelectContent className="bg-green-900/95 backdrop-blur-md border-green-400/30">
                          <SelectItem value="1/32 фіналу" className="text-white hover:bg-green-600/30">
                            1/32 фіналу
                          </SelectItem>
                          <SelectItem value="1/16 фіналу" className="text-white hover:bg-green-600/30">
                            1/16 фіналу
                          </SelectItem>
                          <SelectItem value="1/8 фіналу" className="text-white hover:bg-green-600/30">
                            1/8 фіналу
                          </SelectItem>
                          <SelectItem value="1/4 фіналу" className="text-white hover:bg-green-600/30">
                            1/4 фіналу
                          </SelectItem>
                          <SelectItem value="1/2 фіналу" className="text-white hover:bg-green-600/30">
                            1/2 фіналу
                          </SelectItem>
                          <SelectItem value="Фінал" className="text-white hover:bg-green-600/30">
                            Фінал
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="match-round"
                        type="number"
                        min="1"
                        value={matchForm.round || ""}
                        onChange={(e) => setMatchForm({ ...matchForm, round: Number(e.target.value) || 1 })}
                        className="bg-white/10 border-2 border-green-400/30 text-white placeholder:text-green-200 rounded-xl h-10 sm:h-12"
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="match-date" className="text-white font-bold text-sm">
                      Дата
                    </Label>
                    <Input
                      id="match-date"
                      type="date"
                      value={matchForm.date}
                      onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                      required
                      className="bg-white/10 border-2 border-green-400/30 text-white placeholder:text-green-200 rounded-xl h-10 sm:h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="match-time" className="text-white font-bold text-sm">
                      Час матчу
                    </Label>
                    <Input
                      id="match-time"
                      type="time"
                      value={matchForm.match_time}
                      onChange={(e) => setMatchForm({ ...matchForm, match_time: e.target.value })}
                      className="bg-white/10 border-2 border-green-400/30 text-white placeholder:text-green-200 rounded-xl h-10 sm:h-12"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="home-team" className="text-white font-bold text-sm">
                      Господарі
                    </Label>
                    <Select
                      value={matchForm.home_team}
                      onValueChange={(value) => setMatchForm({ ...matchForm, home_team: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-2 border-green-400/30 text-white rounded-xl h-10 sm:h-12">
                        <SelectValue placeholder="Оберіть команду" />
                      </SelectTrigger>
                      <SelectContent className="bg-green-900/95 backdrop-blur-md border-green-400/30">
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.name} className="text-white hover:bg-green-600/30">
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="away-team" className="text-white font-bold text-sm">
                      Гості
                    </Label>
                    <Select
                      value={matchForm.away_team}
                      onValueChange={(value) => setMatchForm({ ...matchForm, away_team: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-2 border-green-400/30 text-white rounded-xl h-10 sm:h-12">
                        <SelectValue placeholder="Оберіть команду" />
                      </SelectTrigger>
                      <SelectContent className="bg-green-900/95 backdrop-blur-md border-green-400/30">
                        {teams
                          .filter((team) => team.name !== matchForm.home_team)
                          .map((team) => (
                            <SelectItem key={team.id} value={team.name} className="text-white hover:bg-green-600/30">
                              {team.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Technical Defeat Section */}
                <div className="bg-red-600/20 p-4 rounded-2xl border-2 border-red-400/30">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="is-technical-defeat"
                      checked={matchForm.is_technical_defeat}
                      onChange={(e) => setMatchForm({ ...matchForm, is_technical_defeat: e.target.checked })}
                      className="w-4 h-4 text-red-600 bg-white/10 border-red-400/30 rounded"
                    />
                    <Label
                      htmlFor="is-technical-defeat"
                      className="text-white font-bold text-sm flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      Технічна поразка
                    </Label>
                  </div>
                  {matchForm.is_technical_defeat && (
                    <div>
                      <Label htmlFor="technical-winner" className="text-white font-bold text-sm">
                        Переможець (технічна перемога)
                      </Label>
                      <Select
                        value={matchForm.technical_winner}
                        onValueChange={(value) => setMatchForm({ ...matchForm, technical_winner: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-2 border-red-400/30 text-white rounded-xl h-10 sm:h-12">
                          <SelectValue placeholder="Оберіть переможця" />
                        </SelectTrigger>
                        <SelectContent className="bg-red-900/95 backdrop-blur-md border-red-400/30">
                          {matchForm.home_team && (
                            <SelectItem value={matchForm.home_team} className="text-white hover:bg-red-600/30">
                              {matchForm.home_team}
                            </SelectItem>
                          )}
                          {matchForm.away_team && (
                            <SelectItem value={matchForm.away_team} className="text-white hover:bg-red-600/30">
                              {matchForm.away_team}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {!matchForm.is_technical_defeat && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="home-score" className="text-white font-bold text-sm">
                        Голи господарів
                      </Label>
                      <Input
                        id="home-score"
                        type="number"
                        min="0"
                        value={matchForm.home_score}
                        onChange={(e) => setMatchForm({ ...matchForm, home_score: e.target.value })}
                        className="bg-white/10 border-2 border-green-400/30 text-white placeholder:text-green-200 rounded-xl h-10 sm:h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="away-score" className="text-white font-bold text-sm">
                        Голи гостей
                      </Label>
                      <Input
                        id="away-score"
                        type="number"
                        min="0"
                        value={matchForm.away_score}
                        onChange={(e) => setMatchForm({ ...matchForm, away_score: e.target.value })}
                        className="bg-white/10 border-2 border-green-400/30 text-white placeholder:text-green-200 rounded-xl h-10 sm:h-12"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="is-finished"
                        checked={matchForm.is_finished}
                        onChange={(e) => setMatchForm({ ...matchForm, is_finished: e.target.checked })}
                        className="w-4 h-4 text-green-600 bg-white/10 border-green-400/30 rounded"
                      />
                      <Label htmlFor="is-finished" className="text-white font-bold text-sm">
                        Завершено
                      </Label>
                    </div>
                  </div>
                )}

                {/* Penalty Shootout Section - Only for Cup matches and only when finished after penalties */}
                {currentChampionship?.tournament_type === "cup" &&
                  matchForm.is_finished &&
                  !matchForm.is_technical_defeat && (
                    <div className="bg-yellow-600/20 p-4 rounded-2xl border-2 border-yellow-400/30">
                      <div className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          id="finished-after-penalties"
                          checked={matchForm.finished_after_penalties}
                          onChange={(e) => setMatchForm({ ...matchForm, finished_after_penalties: e.target.checked })}
                          className="w-4 h-4 text-yellow-600 bg-white/10 border-yellow-400/30 rounded"
                        />
                        <Label
                          htmlFor="finished-after-penalties"
                          className="text-white font-bold text-sm flex items-center gap-2"
                        >
                          <Crosshair className="h-4 w-4 text-yellow-400" />
                          Матч закінчився після серії пенальті
                        </Label>
                      </div>

                      {matchForm.finished_after_penalties && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                          <div>
                            <Label htmlFor="penalty-home" className="text-white font-bold text-sm">
                              Пенальті господарів
                            </Label>
                            <Input
                              id="penalty-home"
                              type="number"
                              min="0"
                              value={matchForm.penalty_home}
                              onChange={(e) => setMatchForm({ ...matchForm, penalty_home: e.target.value })}
                              className="bg-white/10 border-2 border-yellow-400/30 text-white placeholder:text-yellow-200 rounded-xl h-10 sm:h-12"
                            />
                          </div>
                          <div>
                            <Label htmlFor="penalty-away" className="text-white font-bold text-sm">
                              Пенальті гостей
                            </Label>
                            <Input
                              id="penalty-away"
                              type="number"
                              min="0"
                              value={matchForm.penalty_away}
                              onChange={(e) => setMatchForm({ ...matchForm, penalty_away: e.target.value })}
                              className="bg-white/10 border-2 border-yellow-400/30 text-white placeholder:text-yellow-200 rounded-xl h-10 sm:h-12"
                            />
                          </div>
                          <div>
                            <Label htmlFor="penalty-winner" className="text-white font-bold text-sm">
                              Переможець по пенальті
                            </Label>
                            <Select
                              value={matchForm.penalty_winner}
                              onValueChange={(value) => setMatchForm({ ...matchForm, penalty_winner: value })}
                            >
                              <SelectTrigger className="bg-white/10 border-2 border-yellow-400/30 text-white rounded-xl h-10 sm:h-12">
                                <SelectValue placeholder="Оберіть переможця" />
                              </SelectTrigger>
                              <SelectContent className="bg-yellow-900/95 backdrop-blur-md border-yellow-400/30">
                                {matchForm.home_team && (
                                  <SelectItem value={matchForm.home_team} className="text-white hover:bg-yellow-600/30">
                                    {matchForm.home_team}
                                  </SelectItem>
                                )}
                                {matchForm.away_team && (
                                  <SelectItem value={matchForm.away_team} className="text-white hover:bg-yellow-600/30">
                                    {matchForm.away_team}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={loading || !matchForm.home_team || !matchForm.away_team}
                    className="bg-gradient-to-r from-green-600 via-emerald-700 to-green-600 hover:from-green-700 hover:via-emerald-800 hover:to-green-700 text-white font-bold shadow-lg shadow-green-600/50 rounded-xl border-2 border-green-400/30 h-12"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {editingMatch ? "Оновити" : "Додати"} матч
                  </Button>
                  {editingMatch && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingMatch(null)
                        setMatchForm({
                          round: 1,
                          date: "",
                          home_team: "",
                          away_team: "",
                          home_score: "",
                          away_score: "",
                          is_finished: false,
                          match_time: "",
                          cup_stage: "",
                          is_technical_defeat: false,
                          technical_winner: "",
                          penalty_home: "",
                          penalty_away: "",
                          penalty_winner: "",
                          finished_after_penalties: false,
                        })
                      }}
                      className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 rounded-xl h-12"
                    >
                      Скасувати
                    </Button>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                {matches.length === 0 ? (
                  <div className="text-center py-8 text-green-200 bg-white/5 backdrop-blur-2xl border-2 border-green-400/30 rounded-3xl">
                    Немає матчів. Додайте перший матч вище.
                  </div>
                ) : (
                  matches.map((match) => (
                    <div
                      key={match.id}
                      className="p-4 bg-white/5 backdrop-blur-2xl border-2 border-green-400/30 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="font-bold text-white text-lg mb-2">
                            {currentChampionship?.tournament_type === "cup" && match.cup_stage
                              ? `${match.cup_stage}: ${match.home_team} - ${match.away_team}`
                              : `Тур ${match.round}: ${match.home_team} - ${match.away_team}`}
                          </div>
                          <div className="text-sm text-green-200 font-semibold flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {match.date}
                            </span>
                            {match.match_time && (
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {match.match_time}
                              </span>
                            )}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                match.is_finished
                                  ? match.is_technical_defeat
                                    ? "bg-red-600/30 text-red-200"
                                    : "bg-green-600/30 text-green-200"
                                  : "bg-yellow-600/30 text-yellow-200"
                              }`}
                            >
                              {match.is_finished
                                ? match.is_technical_defeat
                                  ? `Технічна поразка: ${match.technical_winner === match.home_team ? "+:-" : "-:+"}`
                                  : `${match.home_score} - ${match.away_score}${match.penalty_home !== null && match.penalty_away !== null ? ` (${match.penalty_home}-${match.penalty_away} пен.)` : ""}`
                                : "Не зіграно"}
                            </span>
                            {match.is_technical_defeat && (
                              <span className="flex items-center gap-2 bg-red-600/30 px-3 py-1 rounded-full text-xs font-bold text-red-200">
                                <AlertTriangle className="h-3 w-3" />
                                Технічна поразка
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {match.is_finished && !match.is_technical_defeat && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedMatchForGoals(match)
                                setGoalForm({
                                  player_name: "",
                                  team_name: match.home_team,
                                  minute: "",
                                  goal_type: "regular",
                                })
                                loadMatchGoals(match.id)
                              }}
                              className="bg-yellow-600/20 border-yellow-400/30 text-white hover:bg-yellow-600/30 rounded-xl flex-1 sm:flex-none"
                            >
                              <Trophy className="h-4 w-4 mr-1" />
                              Голи
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMatch(match)
                              setMatchForm({
                                round: match.round,
                                date: match.date,
                                home_team: match.home_team,
                                away_team: match.away_team,
                                home_score: match.home_score?.toString() || "",
                                away_score: match.away_score?.toString() || "",
                                is_finished: match.is_finished,
                                match_time: match.match_time || "",
                                cup_stage: match.cup_stage || "",
                                is_technical_defeat: match.is_technical_defeat || false,
                                technical_winner: match.technical_winner || "",
                                penalty_home: match.penalty_home?.toString() || "",
                                penalty_away: match.penalty_away?.toString() || "",
                                penalty_winner: match.penalty_winner || "",
                                finished_after_penalties: match.penalty_home !== null && match.penalty_away !== null,
                              })
                            }}
                            className="bg-green-600/20 border-green-400/30 text-white hover:bg-green-600/30 rounded-xl flex-1 sm:flex-none"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMatch(match.id)}
                            className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30 rounded-xl flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Match Goals Management */}
                      {selectedMatchForGoals?.id === match.id && (
                        <div className="mt-6 p-4 bg-yellow-600/10 rounded-2xl border-2 border-yellow-400/30">
                          <h4 className="font-bold text-white mb-4 flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            Автори голів: {match.home_team} {match.home_score} - {match.away_score} {match.away_team}
                          </h4>

                          {/* Add Goal Form */}
                          <form onSubmit={handleAddMatchGoal} className="space-y-4 mb-6">
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
                                  className="bg-white/10 border-2 border-yellow-400/30 text-white placeholder:text-yellow-200 rounded-xl h-10"
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
                                  <SelectTrigger className="bg-white/10 border-2 border-yellow-400/30 text-white rounded-xl h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-yellow-900/95 backdrop-blur-md border-yellow-400/30">
                                    <SelectItem value={match.home_team} className="text-white hover:bg-yellow-600/30">
                                      {match.home_team}
                                    </SelectItem>
                                    <SelectItem value={match.away_team} className="text-white hover:bg-yellow-600/30">
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
                                  className="bg-white/10 border-2 border-yellow-400/30 text-white placeholder:text-yellow-200 rounded-xl h-10"
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
                                  <SelectTrigger className="bg-white/10 border-2 border-yellow-400/30 text-white rounded-xl h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-yellow-900/95 backdrop-blur-md border-yellow-400/30">
                                    <SelectItem value="regular" className="text-white hover:bg-yellow-600/30">
                                      Звичайний
                                    </SelectItem>
                                    <SelectItem value="penalty" className="text-white hover:bg-yellow-600/30">
                                      Пенальті
                                    </SelectItem>
                                    <SelectItem value="own_goal" className="text-white hover:bg-yellow-600/30">
                                      Автогол
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 hover:from-yellow-700 hover:via-amber-700 hover:to-yellow-700 text-white font-bold shadow-lg shadow-yellow-600/50 rounded-xl border-2 border-yellow-400/30 h-10"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Додати гол
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedMatchForGoals(null)}
                                className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 rounded-xl h-10"
                              >
                                Закрити
                              </Button>
                            </div>
                          </form>

                          {/* Goals List */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-yellow-400 text-sm">Список голів:</h5>
                            {matchGoals.length === 0 ? (
                              <div className="text-center py-4 text-yellow-200 text-sm">Немає доданих голів</div>
                            ) : (
                              <div className="space-y-2">
                                {matchGoals.map((goal) => (
                                  <div
                                    key={goal.id}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-yellow-400/30"
                                  >
                                    <div className="text-sm">
                                      <span className="font-bold text-white">{goal.player_name}</span>
                                      <span className="text-yellow-200 ml-2">({goal.team_name})</span>
                                      {goal.minute && <span className="text-amber-400 ml-2">{goal.minute}'</span>}
                                      {goal.goal_type === "penalty" && (
                                        <span className="text-orange-400 ml-1">(пен.)</span>
                                      )}
                                      {goal.goal_type === "own_goal" && (
                                        <span className="text-red-400 ml-1">(автогол)</span>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteMatchGoal(goal.id)}
                                      className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30 rounded-xl"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-4">
          {!currentChampionshipId || currentChampionshipId === 0 || championships.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-blue-200 bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl">
              Спочатку створіть чемпіонат
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-yellow-200 bg-white/5 backdrop-blur-2xl border-2 border-yellow-400/30 rounded-3xl">
              Додайте команди для створення гравців
            </div>
          ) : (
            <>
              <div className="bg-yellow-600/20 p-4 rounded-2xl mb-4 border-2 border-yellow-400/30 backdrop-blur-sm">
                <div className="text-sm text-white font-bold">
                  <strong>Поточний чемпіонат:</strong> {championships.find((c) => c.id === currentChampionshipId)?.name}{" "}
                  ({championships.find((c) => c.id === currentChampionshipId)?.season})
                </div>
                <div className="text-xs text-yellow-200 mt-1 font-semibold">
                  Гравці будуть додані до цього чемпіонату
                </div>
              </div>
              <form
                onSubmit={handlePlayerSubmit}
                className="space-y-4 p-4 sm:p-6 bg-white/5 backdrop-blur-2xl border-2 border-yellow-400/30 rounded-3xl shadow-2xl shadow-yellow-600/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="player-name" className="text-white font-bold text-sm">
                      Ім'я гравця
                    </Label>
                    <Input
                      id="player-name"
                      value={playerForm.name}
                      onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                      required
                      className="bg-white/10 border-2 border-yellow-400/30 text-white placeholder:text-yellow-200 rounded-xl h-10 sm:h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="player-team" className="text-white font-bold text-sm">
                      Команда
                    </Label>
                    <Select
                      value={playerForm.team}
                      onValueChange={(value) => setPlayerForm({ ...playerForm, team: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-2 border-yellow-400/30 text-white rounded-xl h-10 sm:h-12">
                        <SelectValue placeholder="Оберіть команду" />
                      </SelectTrigger>
                      <SelectContent className="bg-yellow-900/95 backdrop-blur-md border-yellow-400/30">
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.name} className="text-white hover:bg-yellow-600/30">
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="player-goals" className="text-white font-bold text-sm">
                      Голи
                    </Label>
                    <Input
                      id="player-goals"
                      type="number"
                      min="0"
                      value={playerForm.goals === 0 ? "" : playerForm.goals}
                      onChange={(e) => {
                        const val = e.target.value
                        setPlayerForm({ ...playerForm, goals: val === "" ? 0 : Number.parseInt(val) })
                      }}
                      className="bg-white/10 border-2 border-yellow-400/30 text-white placeholder:text-yellow-200 rounded-xl h-10 sm:h-12"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={loading || !playerForm.team}
                    className="bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 hover:from-yellow-700 hover:via-amber-700 hover:to-yellow-700 text-white font-bold shadow-lg shadow-yellow-600/50 rounded-xl border-2 border-yellow-400/30 h-12"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {editingPlayer ? "Оновити" : "Додати"} гравця
                  </Button>
                  {editingPlayer && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingPlayer(null)
                        setPlayerForm({ name: "", team: "", goals: 0 })
                      }}
                      className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 rounded-xl h-12"
                    >
                      Скасувати
                    </Button>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                {players.length === 0 ? (
                  <div className="text-center py-8 text-yellow-200 bg-white/5 backdrop-blur-2xl border-2 border-yellow-400/30 rounded-3xl">
                    Немає гравців. Додайте першого гравця вище.
                  </div>
                ) : (
                  players.map((player) => (
                    <div
                      key={player.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/5 backdrop-blur-2xl border-2 border-yellow-400/30 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg">{player.name}</div>
                        <div className="text-sm text-yellow-200 font-semibold">
                          {player.team} | {player.goals} голів
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPlayer(player)
                            setPlayerForm({ name: player.name, team: player.team, goals: player.goals })
                          }}
                          className="bg-yellow-600/20 border-yellow-400/30 text-white hover:bg-yellow-600/30 rounded-xl flex-1 sm:flex-none"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePlayer(player.id)}
                          className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30 rounded-xl flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
