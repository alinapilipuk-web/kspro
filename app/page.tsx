"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Calendar,
  Target,
  Settings,
  Clock,
  Zap,
  Star,
  FlameIcon as Fire,
  Crown,
  Users,
  MapPin,
  Activity,
  Medal,
  TrendingUp,
  Menu,
  X,
  AlertTriangle,
  Crosshair,
} from "lucide-react"
import {
  getTeams,
  getMatches,
  getPlayers,
  calculateLeagueTable,
  getChampionships,
  getActiveChampionship,
  getMatchGoals,
} from "@/lib/database"
import { AdminPanel } from "@/components/admin-panel"
import { CupTournament } from "@/components/cup-tournament"
import type { Team, Match, Player, Championship, MatchGoal } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamDisplay } from "@/components/team-display"

export default function KSLigaSite() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [teams, setTeams] = useState<Team[]>([])
  const [table, setTable] = useState<any[]>([])
  const [calendar, setCalendar] = useState<Match[]>([])
  const [results, setResults] = useState<Match[]>([])
  const [scorers, setScorers] = useState<Player[]>([])
  const [matchGoals, setMatchGoals] = useState<{ [key: number]: MatchGoal[] }>({})
  const [loading, setLoading] = useState(true)

  const [currentChampionshipId, setCurrentChampionshipId] = useState<number | null>(null)
  const [championships, setChampionships] = useState<Championship[]>([])
  const [currentChampionship, setCurrentChampionship] = useState<Championship | null>(null)

  // Load initial data (championships list)
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load championship-specific data when championship changes
  useEffect(() => {
    if (currentChampionshipId) {
      loadDataForChampionship(currentChampionshipId)
    }
  }, [currentChampionshipId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      console.log("Loading initial data...")

      const [championshipsData, activeChampionship] = await Promise.all([getChampionships(), getActiveChampionship()])

      console.log("Championships loaded:", championshipsData)
      console.log("Active championship:", activeChampionship)

      setChampionships(championshipsData)

      // Set the current championship
      const championshipId = activeChampionship?.id || championshipsData[0]?.id
      if (championshipId) {
        console.log("Setting current championship to:", championshipId)
        setCurrentChampionshipId(championshipId)
      } else {
        // Немає чемпіонатів, але все одно завершуємо завантаження
        console.log("No championships found")
        setCurrentChampionshipId(null)
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDataForChampionship = async (championshipId: number) => {
    try {
      setLoading(true)
      console.log("Loading data for championship:", championshipId)

      const [teamsData, matchesData, playersData, tableData] = await Promise.all([
        getTeams(championshipId),
        getMatches(championshipId),
        getPlayers(championshipId),
        calculateLeagueTable(championshipId),
      ])

      console.log("Loaded teams:", teamsData)
      console.log("Loaded matches:", matchesData)
      console.log("Loaded players:", playersData)

      setTeams(teamsData)
      setTable(tableData)
      setCalendar(matchesData.filter((m) => !m.is_finished))
      setResults(matchesData.filter((m) => m.is_finished))
      setScorers(playersData)

      // Set current championship info
      const championship = championships.find((c) => c.id === championshipId)
      setCurrentChampionship(championship || null)

      // Load match goals for finished matches
      const finishedMatches = matchesData.filter((m) => m.is_finished)
      const goalsData: { [key: number]: MatchGoal[] } = {}

      for (const match of finishedMatches) {
        try {
          const goals = await getMatchGoals(match.id)
          goalsData[match.id] = goals
        } catch (error) {
          console.error(`Error loading goals for match ${match.id}:`, error)
          goalsData[match.id] = []
        }
      }

      setMatchGoals(goalsData)
    } catch (error) {
      console.error("Error loading championship data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoalsUpdated = async () => {
    // Reload match goals when they are updated
    if (currentChampionshipId) {
      await loadDataForChampionship(currentChampionshipId)
    }
  }

  const getTeamLogo = (teamName: string): string => {
    const team = teams.find((t) => t.name === teamName)
    return team?.logo || "/placeholder.svg?height=32&width=32"
  }

  const handleLogin = () => {
    if (adminPassword === "ks2025") {
      setIsAdmin(true)
      setAdminPassword("")
    } else {
      alert("Невірний пароль")
    }
  }

  const getPositionColor = (position: number) => {
    if (position === 1)
      return "bg-gradient-to-r from-emerald-500/30 via-green-400/30 to-emerald-500/30 border-l-4 border-emerald-400 shadow-lg shadow-emerald-400/20 relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-emerald-400/10 before:to-transparent before:rounded-r-lg"
    if (position <= 3)
      return "bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-500/20 border-l-4 border-blue-400 shadow-lg shadow-blue-400/20"
    if (position <= 6)
      return "bg-gradient-to-r from-indigo-500/15 via-purple-400/15 to-indigo-500/15 border-l-4 border-indigo-400 shadow-lg shadow-indigo-400/20"
    return "bg-white/5 hover:bg-white/10 border-l-4 border-transparent hover:border-slate-400/50 transition-all duration-300"
  }

  const handleChampionshipChange = (value: string) => {
    const newChampionshipId = Number.parseInt(value)
    console.log("Championship changed to:", newChampionshipId)
    setCurrentChampionshipId(newChampionshipId)
  }

  const formatMatchResult = (match: Match) => {
    if (match.is_technical_defeat) {
      return match.technical_winner === match.home_team ? "+:-" : "-:+"
    }
    return `${match.home_score} — ${match.away_score}`
  }

  const formatPenaltyResult = (match: Match) => {
    if (match.penalty_home !== null && match.penalty_away !== null) {
      return ` (${match.penalty_home}-${match.penalty_away} пен.)`
    }
    return ""
  }

  // Показуємо завантаження тільки на початку
  if (loading && championships.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Stadium Lights Effect */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Field Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-blue-400/20 to-slate-900/20"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-white/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-6 shadow-2xl shadow-blue-400/30"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Activity className="h-6 w-6 text-blue-600 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-4 tracking-wider drop-shadow-2xl">KS TV</div>
          <div className="text-lg text-blue-200 flex items-center justify-center gap-3 font-semibold">
            Завантаження матчів...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Stadium Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Stadium Lights */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Field Pattern */}
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-slate-900/20 via-blue-500/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-900/30 to-transparent"></div>

        {/* Field Lines */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-96 h-0.5 bg-white/20"></div>
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-64 h-0.5 bg-white/15"></div>
      </div>

      {/* Header */}
      <header className="relative overflow-hidden backdrop-blur-sm border-b border-white/10">
        {/* Stadium Roof Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-blue-900/60 to-indigo-800/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

        <div className="relative max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            {/* KS TV Logo */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative group">
                {/* KS TV Logo Badge */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-400 rounded-2xl shadow-2xl flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 border-4 border-slate-700/30 overflow-hidden">
                  <img src="/images/ks-logo.png" alt="KS TV Logo" className="w-full h-full object-contain p-1" />
                </div>
                {/* Championship Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full animate-bounce shadow-lg shadow-emerald-500/50 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                {/* Active Indicator */}
                <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wider drop-shadow-2xl">
                  KS TV SPORTS
                </h1>
                <p className="text-xs sm:text-sm text-blue-200 font-bold flex items-center gap-2 mt-1">
                  KARPIUK SPORT TELEVISION
                </p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300 rounded-xl shadow-lg border-2 border-blue-400/30"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>

            {/* Desktop Championship Selector */}
            {championships.length > 1 && currentChampionshipId && (
              <div className="hidden sm:block">
                <Select value={currentChampionshipId.toString()} onValueChange={handleChampionshipChange}>
                  <SelectTrigger className="w-56 bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300 rounded-2xl shadow-lg border-2 border-blue-400/30">
                    <SelectValue placeholder="Оберіть чемпіонат" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 backdrop-blur-md border-blue-400/30">
                    {championships.map((championship) => (
                      <SelectItem
                        key={championship.id}
                        value={championship.id.toString()}
                        className="text-white hover:bg-slate-800/30 focus:bg-slate-800/30"
                      >
                        {championship.name} ({championship.season})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden mt-4 p-4 bg-white/10 backdrop-blur-2xl rounded-2xl border-2 border-blue-400/30">
              {championships.length > 1 && currentChampionshipId && (
                <Select value={currentChampionshipId.toString()} onValueChange={handleChampionshipChange}>
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white backdrop-blur-md rounded-xl border-2 border-blue-400/30">
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
              )}
            </div>
          )}
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
        {/* Якщо немає чемпіонатів, показуємо повідомлення */}
        {championships.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="relative mb-8">
              {/* Stadium */}
              <div className="w-28 h-28 mx-auto bg-gradient-to-br from-blue-600 via-slate-700 to-indigo-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/50 transform hover:scale-105 transition-all duration-500 border-4 border-white/20">
                <Trophy className="h-14 w-14 text-white drop-shadow-lg" />
              </div>
              {/* Championship Crown */}
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full animate-bounce shadow-2xl shadow-emerald-500/50 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              {/* Football */}
              <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-gradient-to-br from-slate-800 via-gray-800 to-slate-800 rounded-full"></div>
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-wide drop-shadow-lg">
              ЧЕМПІОНАТ НЕ СТВОРЕНО
            </div>
            <div className="text-blue-200 mb-8 text-sm sm:text-base flex items-center justify-center gap-3 font-semibold">
              <MapPin className="h-4 w-4 text-blue-400" />
              Увійдіть в адмін-панель для створення турніру
              <Users className="h-4 w-4 text-blue-400" />
            </div>

            {/* Admin Panel */}
            <Card className="max-w-md mx-auto bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 shadow-2xl shadow-blue-600/30 rounded-3xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-800/30 via-blue-700/30 to-slate-800/30 border-b border-white/10">
                <CardTitle className="flex items-center gap-3 text-white justify-center text-lg sm:text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  АДМІН-ПАНЕЛЬ
                  <Activity className="h-5 w-5 text-blue-400 animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!isAdmin ? (
                  <div className="space-y-6">
                    <Input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Введіть пароль доступу"
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                      className="text-base bg-white/10 border-2 border-blue-400/30 text-white placeholder:text-blue-200 backdrop-blur-sm rounded-2xl h-14 focus:ring-2 focus:ring-blue-400/50 font-semibold"
                    />
                    <Button
                      onClick={handleLogin}
                      className="w-full bg-gradient-to-r from-slate-700 via-blue-700 to-slate-700 hover:from-slate-800 hover:via-blue-800 hover:to-slate-800 text-white font-bold shadow-2xl shadow-slate-700/50 rounded-2xl h-14 transform hover:scale-105 transition-all duration-300 text-lg border-2 border-blue-400/30"
                    >
                      <Zap className="h-5 w-5 mr-3" />
                      УВІЙТИ В СИСТЕМУ
                    </Button>
                  </div>
                ) : (
                  <AdminPanel
                    onLogout={() => setIsAdmin(false)}
                    currentChampionshipId={currentChampionshipId || 0}
                    onChampionshipChange={(id) => {
                      setCurrentChampionshipId(id)
                      loadInitialData()
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {championships.length > 0 && (
          <>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg text-white flex items-center justify-center gap-3 font-semibold">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  Завантаження даних турніру...
                </div>
              </div>
            ) : (
              <>
                {/* Tabs - Mobile Optimized */}
                <Tabs
                  defaultValue={currentChampionship?.tournament_type === "cup" ? "cup" : "table"}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 p-1 sm:p-2 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-600/20 gap-1">
                    {currentChampionship?.tournament_type === "league" && (
                      <TabsTrigger
                        value="table"
                        className="text-xs px-1 py-2 sm:text-sm sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:via-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/50 data-[state=active]:border-2 data-[state=active]:border-emerald-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col items-center gap-1"
                      >
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs leading-tight">ТАБЛИЦЯ</span>
                      </TabsTrigger>
                    )}
                    {currentChampionship?.tournament_type === "cup" && (
                      <TabsTrigger
                        value="cup"
                        className="text-xs px-1 py-2 sm:text-sm sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:via-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/50 data-[state=active]:border-2 data-[state=active]:border-emerald-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col items-center gap-1"
                      >
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs leading-tight">КУБОК</span>
                      </TabsTrigger>
                    )}
                    <TabsTrigger
                      value="calendar"
                      className="text-xs px-1 py-2 sm:text-sm sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 data-[state=active]:border-2 data-[state=active]:border-blue-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col items-center gap-1"
                    >
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs leading-tight">КАЛЕНДАР</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="results"
                      className="text-xs px-1 py-2 sm:text-sm sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:via-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/50 data-[state=active]:border-2 data-[state=active]:border-indigo-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col items-center gap-1"
                    >
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs leading-tight">РЕЗУЛЬТАТИ</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="scorers"
                      className="text-xs px-1 py-2 sm:text-sm sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:via-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/50 data-[state=active]:border-2 data-[state=active]:border-orange-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col items-center gap-1"
                    >
                      <Fire className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs leading-tight">ГОЛИ</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="admin"
                      className="text-xs px-1 py-2 sm:text-sm sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:via-slate-700 data-[state=active]:to-slate-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-500/50 data-[state=active]:border-2 data-[state=active]:border-slate-400/50 text-blue-200 hover:text-white transition-all duration-300 font-bold flex flex-col items-center gap-1"
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs leading-tight">АДМІН</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Tournament Table Tab */}
                  {currentChampionship?.tournament_type === "league" && (
                    <TabsContent value="table" className="space-y-4 mt-6">
                      <Card className="bg-white/5 backdrop-blur-2xl border-2 border-emerald-400/30 shadow-2xl shadow-emerald-600/30 overflow-hidden rounded-3xl">
                        <CardHeader className="bg-gradient-to-r from-emerald-600/30 via-green-600/30 to-emerald-600/30 border-b-2 border-emerald-400/30 p-4 sm:p-6">
                          <CardTitle className="flex flex-col sm:flex-row items-center gap-4 text-white text-lg sm:text-xl">
                            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-400/50 border-2 border-white/30">
                              <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-center sm:text-left">
                              <div>ТУРНІРНА ТАБЛИЦЯ</div>
                              <div className="flex gap-2 justify-center sm:justify-start mt-2">
                                <Crown className="h-5 w-5 text-emerald-400 animate-pulse" />
                                <TrendingUp className="h-5 w-5 text-green-400 animate-pulse delay-300" />
                              </div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {table.length === 0 ? (
                            <div className="text-center py-16 text-emerald-200 p-6">
                              <Trophy className="h-20 w-20 mx-auto mb-6 text-emerald-400 opacity-50" />
                              <div className="text-xl font-bold">Немає даних для відображення</div>
                              <div className="text-sm mt-2">Додайте команди та матчі для створення таблиці</div>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              {/* Mobile Table */}
                              <div className="sm:hidden">
                                {table.map((team, index) => (
                                  <div
                                    key={index}
                                    className={`p-4 border-b-2 border-white/10 ${getPositionColor(index + 1)}`}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="relative">
                                          <span className="text-2xl font-black text-white">{index + 1}</span>
                                          {index === 0 && (
                                            <Crown className="absolute -top-1 -right-1 h-4 w-4 text-emerald-400 animate-pulse" />
                                          )}
                                        </div>
                                        {index === 0 && <Medal className="h-6 w-6 text-emerald-400 animate-pulse" />}
                                        {index === 1 && <Medal className="h-5 w-5 text-gray-300" />}
                                        {index === 2 && <Medal className="h-5 w-5 text-orange-400" />}
                                      </div>
                                      <div className="text-3xl font-black text-emerald-400">{team.pts}</div>
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-emerald-400/30 flex items-center justify-center">
                                        <img
                                          src={getTeamLogo(team.name) || "/placeholder.svg"}
                                          alt={`${team.name} logo`}
                                          className="w-8 h-8 object-contain rounded-full"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-black text-white text-lg">{team.name}</div>
                                        <div className="text-sm text-emerald-200">{team.games} матчів</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                      <div>
                                        <div className="text-xs text-emerald-200 mb-1">В/Н/П</div>
                                        <div className="text-sm font-bold">
                                          <span className="text-green-400">{team.wins}</span>/
                                          <span className="text-yellow-400">{team.draws}</span>/
                                          <span className="text-red-400">{team.losses}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-emerald-200 mb-1">Голи</div>
                                        <div className="text-sm font-bold">
                                          <span className="text-green-400">{team.gf}</span>:
                                          <span className="text-red-400">{team.ga}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-emerald-200 mb-1">+/-</div>
                                        <div
                                          className={`text-sm font-bold ${
                                            team.gf - team.ga > 0
                                              ? "text-green-400"
                                              : team.gf - team.ga < 0
                                                ? "text-red-400"
                                                : "text-gray-400"
                                          }`}
                                        >
                                          {team.gf - team.ga > 0 ? "+" : ""}
                                          {team.gf - team.ga}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Desktop Table */}
                              <div className="hidden sm:block">
                                <div className="bg-gradient-to-r from-emerald-600/40 via-green-600/40 to-emerald-600/40 border-b-2 border-emerald-400/30 p-4">
                                  <div className="grid grid-cols-9 gap-4 text-xs sm:text-sm font-black text-white tracking-wider">
                                    <div className="text-left">#</div>
                                    <div className="text-left col-span-3">КОМАНДА</div>
                                    <div className="text-center">І</div>
                                    <div className="text-center">В/Н/П</div>
                                    <div className="text-center">ГОЛИ</div>
                                    <div className="text-center">+/-</div>
                                    <div className="text-center">ОЧКИ</div>
                                  </div>
                                </div>

                                <div className="divide-y-2 divide-white/10">
                                  {table.map((team, index) => (
                                    <div
                                      key={index}
                                      className={`p-4 hover:bg-white/10 transition-all duration-300 ${getPositionColor(index + 1)}`}
                                    >
                                      <div className="grid grid-cols-9 gap-4 items-center">
                                        {/* Position */}
                                        <div className="flex items-center gap-3">
                                          <div className="relative">
                                            <span className="text-lg font-black text-white min-w-[24px] block">
                                              {index + 1}
                                            </span>
                                            {index === 0 && (
                                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                                                <Crown className="h-2 w-2 text-white" />
                                              </div>
                                            )}
                                          </div>
                                          {index === 0 && (
                                            <Medal className="h-6 w-6 text-emerald-400 animate-pulse flex-shrink-0" />
                                          )}
                                          {index === 1 && <Medal className="h-5 w-5 text-gray-300 flex-shrink-0" />}
                                          {index === 2 && <Medal className="h-5 w-5 text-orange-400 flex-shrink-0" />}
                                        </div>

                                        {/* Team */}
                                        <div className="col-span-3 flex items-center gap-3">
                                          <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-emerald-400/30 flex items-center justify-center">
                                              <img
                                                src={getTeamLogo(team.name) || "/placeholder.svg"}
                                                alt={`${team.name} logo`}
                                                className="w-8 h-8 object-contain rounded-full"
                                              />
                                            </div>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="font-black text-white drop-shadow-lg tracking-wide text-sm sm:text-base truncate">
                                              {team.name}
                                            </div>
                                            <div className="text-xs text-emerald-200 font-semibold">
                                              {team.games} матчів зіграно
                                            </div>
                                          </div>
                                        </div>

                                        {/* Games */}
                                        <div className="text-center">
                                          <div className="text-emerald-200 font-bold text-base">{team.games}</div>
                                        </div>

                                        {/* W/D/L */}
                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-1 text-xs font-bold">
                                            <span className="text-green-400">{team.wins}</span>
                                            <span className="text-gray-400">/</span>
                                            <span className="text-yellow-400">{team.draws}</span>
                                            <span className="text-gray-400">/</span>
                                            <span className="text-red-400">{team.losses}</span>
                                          </div>
                                        </div>

                                        {/* Goals */}
                                        <div className="text-center">
                                          <div className="flex items-center justify-center gap-1 text-xs font-bold">
                                            <span className="text-green-400">{team.gf}</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-red-400">{team.ga}</span>
                                          </div>
                                        </div>

                                        {/* Goal Difference */}
                                        <div className="text-center">
                                          <div
                                            className={`text-base font-black ${
                                              team.gf - team.ga > 0
                                                ? "text-green-400"
                                                : team.gf - team.ga < 0
                                                  ? "text-red-400"
                                                  : "text-gray-400"
                                            }`}
                                          >
                                            {team.gf - team.ga > 0 ? "+" : ""}
                                            {team.gf - team.ga}
                                          </div>
                                        </div>

                                        {/* Points */}
                                        <div className="text-center">
                                          <div className="relative">
                                            <div className="text-2xl font-black text-emerald-400 drop-shadow-lg">
                                              {team.pts}
                                            </div>
                                            {index === 0 && (
                                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {/* Cup Tournament Tab */}
                  {currentChampionship?.tournament_type === "cup" && currentChampionshipId && (
                    <TabsContent value="cup" className="space-y-4 mt-6">
                      <CupTournament championshipId={currentChampionshipId} />
                    </TabsContent>
                  )}

                  {/* Calendar Tab - Mobile Optimized */}
                  <TabsContent value="calendar" className="space-y-4 mt-6">
                    <Card className="bg-white/5 backdrop-blur-2xl border-2 border-blue-400/30 shadow-2xl shadow-blue-600/30 overflow-hidden rounded-3xl">
                      <CardHeader className="bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-blue-600/30 border-b-2 border-blue-400/30 p-4 sm:p-6">
                        <CardTitle className="flex flex-col sm:flex-row items-center gap-4 text-white text-lg sm:text-xl">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-cyan-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-400/50 border-2 border-white/30">
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-center sm:text-left">
                            <div>КАЛЕНДАР МАТЧІВ</div>
                            <div className="flex gap-2 justify-center sm:justify-start mt-2">
                              <Clock className="h-5 w-5 text-blue-400 animate-pulse" />
                              <MapPin className="h-5 w-5 text-cyan-400 animate-pulse delay-300" />
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 p-2 sm:p-6">
                        {calendar.length === 0 ? (
                          <div className="text-center py-16 text-blue-200">
                            <Calendar className="h-20 w-20 mx-auto mb-6 text-blue-400 opacity-50" />
                            <div className="text-xl font-bold">Немає запланованих матчів</div>
                            <div className="text-sm mt-2">Матчі з'являться тут після додавання</div>
                          </div>
                        ) : (
                          [...new Set(calendar.map((m) => m.round))].map((round) => (
                            <div key={round}>
                              <Badge
                                variant="outline"
                                className="mb-4 text-sm bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white border-2 border-blue-400/50 px-6 py-3 rounded-2xl shadow-lg shadow-blue-400/30 font-bold tracking-wider"
                              >
                                {currentChampionship?.tournament_type === "cup"
                                  ? calendar.find((m) => m.round === round)?.cup_stage || `ТУР ${round}`
                                  : `ТУР ${round}`}
                              </Badge>
                              <div className="space-y-4">
                                {calendar
                                  .filter((m) => m.round === round)
                                  .map((match, index) => (
                                    <div
                                      key={index}
                                      className="bg-white/5 backdrop-blur-sm p-3 sm:p-6 rounded-3xl border-2 border-white/10 hover:bg-white/10 hover:border-blue-400/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
                                    >
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                        <div className="text-sm text-blue-200 flex flex-wrap items-center gap-2 sm:gap-4 font-semibold">
                                          <span className="text-white font-bold">{match.date}</span>
                                          {match.match_time && (
                                            <span className="flex items-center gap-2 bg-blue-600/30 px-3 py-1 rounded-xl backdrop-blur-sm border border-blue-400/30">
                                              <Clock className="h-3 w-3" />
                                              {match.match_time}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Mobile Match Layout */}
                                      <div className="sm:hidden space-y-4">
                                        <div className="bg-gradient-to-r from-blue-600/20 via-slate-700/20 to-blue-600/20 p-4 rounded-2xl border border-blue-400/30">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1">
                                              <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-blue-400/30 flex items-center justify-center">
                                                <img
                                                  src={getTeamLogo(match.home_team) || "/placeholder.svg"}
                                                  alt={`${match.home_team} logo`}
                                                  className="w-8 h-8 object-contain rounded-full"
                                                />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="font-black text-white text-base truncate">
                                                  {match.home_team}
                                                </div>
                                                <div className="text-xs text-blue-200 font-semibold">Господарі</div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-center mb-3">
                                            <div className="bg-gradient-to-r from-slate-700 via-blue-700 to-slate-700 px-6 py-2 rounded-2xl shadow-lg border-2 border-blue-400/50">
                                              <span className="text-white font-black text-lg">VS</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1 justify-end">
                                              <div className="flex-1 min-w-0 text-right">
                                                <div className="font-black text-white text-base truncate">
                                                  {match.away_team}
                                                </div>
                                                <div className="text-xs text-blue-200 font-semibold">Гості</div>
                                              </div>
                                              <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-blue-400/30 flex items-center justify-center">
                                                <img
                                                  src={getTeamLogo(match.away_team) || "/placeholder.svg"}
                                                  alt={`${match.away_team} logo`}
                                                  className="w-8 h-8 object-contain rounded-full"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Desktop Match Layout */}
                                      <div className="hidden sm:grid grid-cols-3 items-center gap-4">
                                        {/* Home Team */}
                                        <div className="flex items-center justify-end">
                                          <div className="flex items-center gap-3">
                                            <span className="font-black text-white drop-shadow-lg tracking-wide text-sm sm:text-base text-right">
                                              {match.home_team}
                                            </span>
                                            <div className="relative flex-shrink-0">
                                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-blue-400/30 flex items-center justify-center">
                                                <img
                                                  src={getTeamLogo(match.home_team) || "/placeholder.svg"}
                                                  alt={`${match.home_team} logo`}
                                                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* VS */}
                                        <div className="flex justify-center">
                                          <div className="bg-gradient-to-r from-slate-700 via-blue-700 to-slate-700 px-6 py-3 sm:px-8 sm:py-4 rounded-3xl shadow-2xl shadow-slate-700/50 transform hover:scale-105 transition-all duration-300 border-2 border-blue-400/50">
                                            <span className="text-white font-black text-lg sm:text-xl tracking-wider">
                                              VS
                                            </span>
                                          </div>
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex items-center justify-start">
                                          <div className="flex items-center gap-3">
                                            <div className="relative flex-shrink-0">
                                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-blue-400/30 flex items-center justify-center">
                                                <img
                                                  src={getTeamLogo(match.away_team) || "/placeholder.svg"}
                                                  alt={`${match.away_team} logo`}
                                                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full"
                                                />
                                              </div>
                                            </div>
                                            <span className="font-black text-white drop-shadow-lg tracking-wide text-sm sm:text-base">
                                              {match.away_team}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Results Tab - Mobile Optimized */}
                  <TabsContent value="results" className="space-y-4 mt-6">
                    <Card className="bg-white/5 backdrop-blur-2xl border-2 border-indigo-400/30 shadow-2xl shadow-indigo-600/30 overflow-hidden rounded-3xl">
                      <CardHeader className="bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-indigo-600/30 border-b-2 border-indigo-400/30 p-4 sm:p-6">
                        <CardTitle className="flex flex-col sm:flex-row items-center gap-4 text-white text-lg sm:text-xl">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-400/50 border-2 border-white/30">
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-center sm:text-left">
                            <div>РЕЗУЛЬТАТИ МАТЧІВ</div>
                            <div className="flex gap-2 justify-center sm:justify-start mt-2">
                              <Fire className="h-5 w-5 text-indigo-400 animate-pulse" />
                              <Target className="h-5 w-5 text-purple-400 animate-pulse delay-300" />
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 p-2 sm:p-6">
                        {results.length === 0 ? (
                          <div className="text-center py-16 text-indigo-200">
                            <Zap className="h-20 w-20 mx-auto mb-6 text-indigo-400 opacity-50" />
                            <div className="text-xl font-bold">Немає завершених матчів</div>
                            <div className="text-sm mt-2">Результати з'являться після завершення матчів</div>
                          </div>
                        ) : (
                          [...new Set(results.map((r) => r.round))].map((round) => (
                            <div key={round}>
                              <Badge
                                variant="outline"
                                className="mb-4 text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white border-2 border-indigo-400/50 px-6 py-3 rounded-2xl shadow-lg shadow-indigo-400/30 font-bold tracking-wider"
                              >
                                {currentChampionship?.tournament_type === "cup"
                                  ? results.find((r) => r.round === round)?.cup_stage || `ТУР ${round}`
                                  : `ТУР ${round}`}
                              </Badge>
                              <div className="space-y-4">
                                {results
                                  .filter((r) => r.round === round)
                                  .map((result, index) => (
                                    <div
                                      key={index}
                                      className="bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-indigo-600/10 backdrop-blur-sm p-3 sm:p-6 rounded-3xl border-l-4 border-indigo-400 hover:from-indigo-600/20 hover:via-purple-600/20 hover:to-indigo-600/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 border-2 border-indigo-400/20"
                                    >
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                        <div className="text-sm text-indigo-200 flex flex-wrap items-center gap-2 sm:gap-4 font-semibold">
                                          <span className="text-white font-bold">{result.date}</span>
                                          {result.match_time && (
                                            <span className="flex items-center gap-2 bg-indigo-600/30 px-3 py-1 rounded-xl backdrop-blur-sm border border-indigo-400/30">
                                              <Clock className="h-3 w-3" />
                                              {result.match_time}
                                            </span>
                                          )}
                                          {result.is_technical_defeat && (
                                            <span className="flex items-center gap-2 bg-red-600/30 px-3 py-1 rounded-xl backdrop-blur-sm border border-red-400/30">
                                              <AlertTriangle className="h-3 w-3" />
                                              Технічна поразка
                                            </span>
                                          )}
                                          {result.penalty_home !== null && result.penalty_away !== null && (
                                            <span className="flex items-center gap-2 bg-yellow-600/30 px-3 py-1 rounded-xl backdrop-blur-sm border border-yellow-400/30">
                                              <Crosshair className="h-3 w-3" />
                                              Пенальті
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Mobile Result Layout */}
                                      <div className="sm:hidden space-y-4">
                                        <div className="bg-gradient-to-r from-blue-600/20 via-slate-700/20 to-blue-600/20 p-4 rounded-2xl border border-blue-400/30">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1">
                                              <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-blue-400/30 flex items-center justify-center">
                                                <img
                                                  src={getTeamLogo(result.home_team) || "/placeholder.svg"}
                                                  alt={`${result.home_team} logo`}
                                                  className="w-8 h-8 object-contain rounded-full"
                                                />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="font-black text-white text-base truncate">
                                                  {result.home_team}
                                                </div>
                                                <div className="text-xs text-blue-200 font-semibold">Господарі</div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-center mb-3">
                                            <div className="bg-gradient-to-r from-white via-gray-100 to-white px-4 py-3 rounded-2xl shadow-lg border-2 border-blue-400/50">
                                              <span className="text-slate-800 font-black text-xl">
                                                {formatMatchResult(result)}
                                                {formatPenaltyResult(result)}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1 justify-end">
                                              <div className="flex-1 min-w-0 text-right">
                                                <div className="font-black text-white text-base truncate">
                                                  {result.away_team}
                                                </div>
                                                <div className="text-xs text-blue-200 font-semibold">Гості</div>
                                              </div>
                                              <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-blue-400/30 flex items-center justify-center">
                                                <img
                                                  src={getTeamLogo(result.away_team) || "/placeholder.svg"}
                                                  alt={`${result.away_team} logo`}
                                                  className="w-8 h-8 object-contain rounded-full"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Desktop Result Layout */}
                                      <div className="hidden sm:grid grid-cols-3 items-center gap-4 sm:gap-6 mb-6">
                                        {/* Home Team */}
                                        <div className="flex items-center justify-end">
                                          <div className="flex items-center gap-3">
                                            <span className="font-black text-white drop-shadow-lg tracking-wide text-sm sm:text-base text-right">
                                              {result.home_team}
                                            </span>
                                            <div className="relative flex-shrink-0">
                                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-blue-400/30 flex items-center justify-center">
                                                <img
                                                  src={getTeamLogo(result.home_team) || "/placeholder.svg"}
                                                  alt={`${result.home_team} logo`}
                                                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Score */}
                                        <div className="flex justify-center">
                                          <div className="bg-gradient-to-r from-white via-gray-100 to-white px-4 py-3 sm:px-6 sm:py-4 rounded-2xl sm:rounded-3xl shadow-2xl border-4 border-blue-400/50 transform hover:scale-105 transition-all duration-300">
                                            <span className="text-slate-800 font-black text-lg sm:text-2xl tracking-wider">
                                              {formatMatchResult(result)}
                                              {formatPenaltyResult(result)}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex items-center justify-start">
                                          <div className="flex items-center gap-3">
                                            <div className="relative flex-shrink-0">
                                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-blue-400/30 flex items-center justify-center">
                                                <img
                                                  src={getTeamLogo(result.away_team) || "/placeholder.svg"}
                                                  alt={`${result.away_team} logo`}
                                                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full"
                                                />
                                              </div>
                                            </div>
                                            <span className="font-black text-white drop-shadow-lg tracking-wide text-sm sm:text-base">
                                              {result.away_team}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Match Goals - Mobile Optimized */}
                                      {matchGoals[result.id] && matchGoals[result.id].length > 0 && (
                                        <div className="mt-6 pt-6 border-t-2 border-indigo-400/30">
                                          <div className="text-sm font-black text-indigo-400 mb-4 flex items-center gap-3 tracking-wider">
                                            <Fire className="h-6 w-6" />
                                            АВТОРИ ГОЛІВ:
                                          </div>
                                          <div className="grid grid-cols-1 gap-4 text-sm">
                                            {/* Mobile Goals Layout */}
                                            <div className="sm:hidden space-y-4">
                                              {[result.home_team, result.away_team].map((teamName) => {
                                                const teamGoals = matchGoals[result.id].filter(
                                                  (goal) => goal.team_name === teamName,
                                                )
                                                if (teamGoals.length === 0) return null
                                                return (
                                                  <div
                                                    key={teamName}
                                                    className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm border-2 border-white/10"
                                                  >
                                                    <div className="font-black text-white mb-3 flex items-center gap-3 text-base">
                                                      {teamName}:
                                                    </div>
                                                    {teamGoals.map((goal, idx) => (
                                                      <div
                                                        key={idx}
                                                        className="ml-6 text-blue-200 flex flex-wrap items-center gap-2 py-2 font-semibold"
                                                      >
                                                        <span className="font-bold text-white">{goal.player_name}</span>
                                                        {goal.minute && (
                                                          <span className="text-yellow-400 font-bold">
                                                            ({goal.minute}')
                                                          </span>
                                                        )}
                                                        {goal.goal_type === "penalty" && (
                                                          <span className="text-orange-400 font-bold">(пен.)</span>
                                                        )}
                                                        {goal.goal_type === "own_goal" && (
                                                          <span className="text-red-400 font-bold">(автогол)</span>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )
                                              })}
                                            </div>

                                            {/* Desktop Goals Layout */}
                                            <div className="hidden sm:grid sm:grid-cols-2 gap-6">
                                              <div className="bg-white/5 p-5 rounded-2xl backdrop-blur-sm border-2 border-white/10">
                                                <div className="font-black text-white mb-4 flex items-center gap-3 text-base">
                                                  {result.home_team}:
                                                </div>
                                                {matchGoals[result.id]
                                                  .filter((goal) => goal.team_name === result.home_team)
                                                  .map((goal, idx) => (
                                                    <div
                                                      key={idx}
                                                      className="ml-6 text-blue-200 flex items-center gap-3 py-2 font-semibold"
                                                    >
                                                      <span className="font-bold text-white">{goal.player_name}</span>
                                                      {goal.minute && (
                                                        <span className="text-yellow-400 font-bold">
                                                          ({goal.minute}')
                                                        </span>
                                                      )}
                                                      {goal.goal_type === "penalty" && (
                                                        <span className="text-orange-400 font-bold">(пен.)</span>
                                                      )}
                                                      {goal.goal_type === "own_goal" && (
                                                        <span className="text-red-400 font-bold">(автогол)</span>
                                                      )}
                                                    </div>
                                                  ))}
                                              </div>
                                              <div className="bg-white/5 p-5 rounded-2xl backdrop-blur-sm border-2 border-white/10">
                                                <div className="font-black text-white mb-4 flex items-center gap-3 text-base">
                                                  {result.away_team}:
                                                </div>
                                                {matchGoals[result.id]
                                                  .filter((goal) => goal.team_name === result.away_team)
                                                  .map((goal, idx) => (
                                                    <div
                                                      key={idx}
                                                      className="ml-6 text-blue-200 flex items-center gap-3 py-2 font-semibold"
                                                    >
                                                      <span className="font-bold text-white">{goal.player_name}</span>
                                                      {goal.minute && (
                                                        <span className="text-yellow-400 font-bold">
                                                          ({goal.minute}')
                                                        </span>
                                                      )}
                                                      {goal.goal_type === "penalty" && (
                                                        <span className="text-orange-400 font-bold">(пен.)</span>
                                                      )}
                                                      {goal.goal_type === "own_goal" && (
                                                        <span className="text-red-400 font-bold">(автогол)</span>
                                                      )}
                                                    </div>
                                                  ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Top Scorers Tab - Mobile Optimized */}
                  <TabsContent value="scorers" className="space-y-4 mt-6">
                    <Card className="bg-white/5 backdrop-blur-2xl border-2 border-orange-400/30 shadow-2xl shadow-orange-600/30 overflow-hidden rounded-3xl">
                      <CardHeader className="bg-gradient-to-r from-orange-600/30 via-red-600/30 to-orange-600/30 border-b-2 border-orange-400/30 p-4 sm:p-6">
                        <CardTitle className="flex flex-col sm:flex-row items-center gap-4 text-white text-lg sm:text-xl">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-400/50 border-2 border-white/30">
                            <Fire className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-center sm:text-left">
                            <div>БОМБАРДИРИ СЕЗОНУ</div>
                            <div className="flex gap-2 justify-center sm:justify-start mt-2">
                              <Target className="h-5 w-5 text-orange-400 animate-pulse" />
                              <Crown className="h-5 w-5 text-red-400 animate-pulse delay-300" />
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 sm:p-6">
                        {scorers.length === 0 ? (
                          <div className="text-center py-16 text-orange-200">
                            <Fire className="h-20 w-20 mx-auto mb-6 text-orange-400 opacity-50" />
                            <div className="text-xl font-bold">Немає даних про бомбардирів</div>
                            <div className="text-sm mt-2">Статистика з'явиться після додавання гравців</div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {scorers.map((scorer, index) => (
                              <div
                                key={index}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-3xl border-2 border-white/10 hover:bg-white/10 hover:border-orange-400/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-orange-500/20"
                              >
                                <div className="flex items-center gap-5 flex-1 min-w-0 w-full sm:w-auto">
                                  <div
                                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center font-black text-base sm:text-lg flex-shrink-0 shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-white/30 ${
                                      index === 0
                                        ? "bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 text-white shadow-emerald-400/50"
                                        : index === 1
                                          ? "bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 text-gray-800 shadow-gray-400/50"
                                          : index === 2
                                            ? "bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400 text-white shadow-orange-400/50"
                                            : "bg-gradient-to-r from-slate-600 via-blue-700 to-slate-600 text-white shadow-slate-500/50"
                                    }`}
                                  >
                                    {index === 0 && <Crown className="h-8 w-8" />}
                                    {index === 1 && <Star className="h-6 w-6" />}
                                    {index === 2 && <Target className="h-6 w-6" />}
                                    {index > 2 && index + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-black text-lg sm:text-xl text-white truncate mb-2 tracking-wide">
                                      {scorer.name}
                                    </div>
                                    <div className="text-sm text-blue-200">
                                      <TeamDisplay
                                        teamName={scorer.team}
                                        teamLogo={getTeamLogo(scorer.team)}
                                        size="md"
                                        showName={true}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
                                  <Badge
                                    variant="secondary"
                                    className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white text-base sm:text-lg flex-shrink-0 border-0 px-6 py-3 rounded-3xl shadow-2xl shadow-orange-500/50 font-black tracking-wider border-2 border-orange-400/50"
                                  >
                                    <Fire className="h-5 w-5 mr-3" />
                                    {scorer.goals}
                                    <span className="ml-2 text-sm">ГОЛІВ</span>
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Admin Panel Tab */}
                  <TabsContent value="admin" className="space-y-4 mt-6">
                    <Card className="bg-white/5 backdrop-blur-2xl border-2 border-slate-400/30 shadow-2xl shadow-slate-600/30 overflow-hidden rounded-3xl">
                      <CardHeader className="bg-gradient-to-r from-slate-600/30 via-slate-700/30 to-slate-600/30 border-b-2 border-slate-400/30 p-4 sm:p-6">
                        <CardTitle className="flex flex-col sm:flex-row items-center gap-4 text-white text-lg sm:text-xl">
                          <div className="w-12 h-12 bg-gradient-to-r from-slate-500 via-slate-600 to-slate-500 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-400/50 border-2 border-white/30">
                            <Settings className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-center sm:text-left">
                            <div>АДМІН-ПАНЕЛЬ</div>
                            <div className="flex gap-2 justify-center sm:justify-start mt-2">
                              <Activity className="h-5 w-5 text-blue-400 animate-pulse" />
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 sm:p-6">
                        {!isAdmin ? (
                          <div className="space-y-6">
                            <Input
                              type="password"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              placeholder="Введіть пароль доступу"
                              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                              className="text-base bg-white/10 border-2 border-slate-400/30 text-white placeholder:text-slate-200 backdrop-blur-sm rounded-2xl h-16 focus:ring-2 focus:ring-slate-400/50 font-bold text-lg"
                            />
                            <Button
                              onClick={handleLogin}
                              className="w-full bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 hover:from-slate-700 hover:via-slate-800 hover:to-slate-700 text-white font-black shadow-2xl shadow-slate-600/50 rounded-2xl h-16 transform hover:scale-105 transition-all duration-300 text-lg border-2 border-slate-400/30 tracking-wider"
                            >
                              <Zap className="h-6 w-6 mr-4" />
                              УВІЙТИ В СИСТЕМУ
                              <Activity className="h-5 w-5 ml-4 animate-pulse" />
                            </Button>
                          </div>
                        ) : (
                          <AdminPanel
                            onLogout={() => setIsAdmin(false)}
                            currentChampionshipId={currentChampionshipId || 0}
                            onChampionshipChange={(id) => {
                              setCurrentChampionshipId(id)
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
