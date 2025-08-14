"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Clock, AlertTriangle } from "lucide-react"
import { getCupMatches, getTeams } from "@/lib/database"
import type { Match, Team } from "@/lib/supabase"

interface CupTournamentProps {
  championshipId: number
}

const CUP_STAGES = ["1/32 фіналу", "1/16 фіналу", "1/8 фіналу", "1/4 фіналу", "1/2 фіналу", "Фінал"]

export function CupTournament({ championshipId }: CupTournamentProps) {
  const [matches, setMatches] = useState<{ [key: string]: Match[] }>({})
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCupData()
  }, [championshipId])

  const loadCupData = async () => {
    try {
      setLoading(true)
      const [teamsData, ...stageMatches] = await Promise.all([
        getTeams(championshipId),
        ...CUP_STAGES.map((stage) => getCupMatches(championshipId, stage)),
      ])

      setTeams(teamsData)

      const matchesByStage: { [key: string]: Match[] } = {}
      CUP_STAGES.forEach((stage, index) => {
        matchesByStage[stage] = stageMatches[index]
      })

      setMatches(matchesByStage)
    } catch (error) {
      console.error("Error loading cup data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTeamLogo = (teamName: string): string => {
    const team = teams.find((t) => t.name === teamName)
    return team?.logo || "/placeholder.svg?height=32&width=32"
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

  if (loading) {
    return <div className="text-center py-8 text-emerald-200">Завантаження кубкового турніру...</div>
  }

  return (
    <div className="space-y-6">
      {CUP_STAGES.map((stage) => (
        <Card
          key={stage}
          className="bg-white/5 backdrop-blur-2xl border-2 border-emerald-400/30 shadow-2xl shadow-emerald-600/30 overflow-hidden rounded-3xl"
        >
          <CardHeader className="bg-gradient-to-r from-emerald-600/30 via-green-600/30 to-emerald-600/30 border-b-2 border-emerald-400/30 p-4 sm:p-6">
            <CardTitle className="flex flex-col sm:flex-row items-center gap-3 text-white text-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-400/50 border-2 border-white/30">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div className="text-center sm:text-left">{stage}</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {matches[stage]?.length === 0 ? (
              <div className="text-center py-8 text-emerald-200">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-emerald-400 opacity-50" />
                <div className="font-bold">Немає матчів на цій стадії</div>
              </div>
            ) : (
              <div className="space-y-4">
                {matches[stage]?.map((match, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm p-3 sm:p-6 rounded-3xl border-2 border-white/10 hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="text-sm text-emerald-200 flex flex-wrap items-center gap-2 sm:gap-4 font-semibold">
                        <span className="text-white font-bold">{match.date}</span>
                        {match.match_time && (
                          <span className="flex items-center gap-2 bg-emerald-600/30 px-3 py-1 rounded-xl backdrop-blur-sm border border-emerald-400/30">
                            <Clock className="h-3 w-3" />
                            {match.match_time}
                          </span>
                        )}
                        {match.is_technical_defeat && (
                          <span className="flex items-center gap-2 bg-red-600/30 px-3 py-1 rounded-xl backdrop-blur-sm border border-red-400/30">
                            <AlertTriangle className="h-3 w-3" />
                            Технічна поразка
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={match.is_finished ? "default" : "secondary"}
                        className={match.is_finished ? "bg-green-600 text-white" : "bg-yellow-600 text-white"}
                      >
                        {match.is_finished ? "Завершено" : "Заплановано"}
                      </Badge>
                    </div>

                    {/* Mobile Match Layout */}
                    <div className="sm:hidden space-y-4">
                      <div className="bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-emerald-600/20 p-4 rounded-2xl border border-emerald-400/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-emerald-400/30 flex items-center justify-center">
                              <img
                                src={getTeamLogo(match.home_team) || "/placeholder.svg"}
                                alt={`${match.home_team} logo`}
                                className="w-8 h-8 object-contain rounded-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-white text-base truncate">{match.home_team}</div>
                              <div className="text-xs text-emerald-200 font-semibold">Господарі</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center mb-3">
                          {match.is_finished ? (
                            <div className="bg-gradient-to-r from-white via-gray-100 to-white px-4 py-3 rounded-2xl shadow-lg border-2 border-emerald-400/50">
                              <span className="text-slate-800 font-black text-xl">
                                {formatMatchResult(match)}
                                {formatPenaltyResult(match)}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-r from-slate-700 via-emerald-700 to-slate-700 px-6 py-2 rounded-2xl shadow-lg border-2 border-emerald-400/50">
                              <span className="text-white font-black text-lg">VS</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 justify-end">
                            <div className="flex-1 min-w-0 text-right">
                              <div className="font-black text-white text-base truncate">{match.away_team}</div>
                              <div className="text-xs text-emerald-200 font-semibold">Гості</div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-emerald-400/30 flex items-center justify-center">
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
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-emerald-400/30 flex items-center justify-center">
                              <img
                                src={getTeamLogo(match.home_team) || "/placeholder.svg"}
                                alt={`${match.home_team} logo`}
                                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score/VS */}
                      <div className="flex justify-center">
                        {match.is_finished ? (
                          <div className="bg-gradient-to-r from-white via-gray-100 to-white px-4 py-3 sm:px-6 sm:py-4 rounded-2xl sm:rounded-3xl shadow-2xl border-4 border-emerald-400/50 transform hover:scale-105 transition-all duration-300">
                            <span className="text-slate-800 font-black text-lg sm:text-xl tracking-wider">
                              {formatMatchResult(match)}
                              {formatPenaltyResult(match)}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-slate-700 via-emerald-700 to-slate-700 px-6 py-3 sm:px-8 sm:py-4 rounded-3xl shadow-2xl shadow-slate-700/50 transform hover:scale-105 transition-all duration-300 border-2 border-emerald-400/50">
                            <span className="text-white font-black text-lg sm:text-xl tracking-wider">VS</span>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-start">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white via-gray-100 to-white rounded-full shadow-lg border-2 border-emerald-400/30 flex items-center justify-center">
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
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
