'use client'

import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { useSession } from 'next-auth/react'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { useGamesData } from '@/contexts/GamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievementsUserProfile } from '@/types/types'

function StatCard({ label, value, accent, subValue }: { label: string; value: string; accent?: string; subValue?: string }) {
  return (
    <motion.div
      className="bg-bg-main rounded-xl p-3 flex flex-col gap-1"
      variants={staggerItem}
    >
      <span className={`text-xl font-bold ${accent ?? 'text-text-main'}`}>{value}</span>
      <span className="text-xs text-text-secondary">{label}</span>
      {subValue && <span className="text-xs text-text-secondary/60">{subValue}</span>}
    </motion.div>
  )
}

function AwardCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <motion.div
      className="bg-bg-main rounded-xl p-3 flex flex-col items-center gap-1 text-center"
      variants={staggerItem}
    >
      <span className={`text-2xl font-bold ${accent ?? 'text-text-main'}`}>{value.toLocaleString()}</span>
      <span className="text-xs text-text-secondary">{label}</span>
    </motion.div>
  )
}

function GamesCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <motion.div
      className="bg-bg-main rounded-xl p-3 flex flex-col items-center gap-0.5"
      variants={staggerItem}
    >
      <span className={`text-xl font-bold ${accent ?? 'text-text-main'}`}>{value}</span>
      <span className="text-xs text-text-secondary text-center">{label}</span>
    </motion.div>
  )
}

export default function UserStats() {
  const { data: session } = useSession()
  const { rank, isLoading: rankLoading } = useUserRank()
  const { awards, isLoading: awardsLoading } = useUserAwards()
  const { all, softcore, hardcore, inProgress } = useGamesData()
  const { T } = useLanguage()

  const raUser = session?.user?.raUser as RetroAchievementsUserProfile | null | undefined

  if (!raUser?.User) return null

  const hardcoreRatio =
    raUser.TotalTruePoints > 0
      ? Math.round((raUser.TotalTruePoints / (raUser.TotalPoints || 1)) * 100)
      : 0

  const memberYear = raUser.MemberSince ? new Date(raUser.MemberSince).getFullYear().toString() : '—'
  const hasContribs = raUser.ContribCount > 0 || raUser.ContribYield > 0

  const totalAchievements = awards
    ? awards.MasteryAwardsCount + awards.BeatenHardcoreAwardsCount + awards.BeatenSoftcoreAwardsCount + awards.CompletionAwardsCount + awards.EventAwardsCount
    : 0

  const totalGames = all.length
  const completedSC = softcore.filter((g) => parseFloat(g.PctWon) >= 1).length
  const completedHC = hardcore.filter((g) => parseFloat(g.PctWon) >= 1).length

  return (
    <section className="w-[95%] pt-3 pb-3 flex flex-col gap-4">
      <div className="bg-bg-card rounded-3xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          RetroAchievements
        </h2>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <StatCard
            label={T.userStats.globalRank}
            value={rankLoading ? '...' : rank?.Rank ? `#${rank.Rank.toLocaleString()}` : '—'}
            accent="text-accent"
          />
          <StatCard
            label={T.profileStats.hardcorePoints}
            value={raUser.TotalPoints.toLocaleString()}
            accent="text-yellow-400"
          />
          <StatCard
            label={T.profileStats.truePoints}
            value={raUser.TotalTruePoints.toLocaleString()}
            accent="text-blue-400"
          />
          <StatCard
            label={T.profileStats.softcorePoints}
            value={raUser.TotalSoftcorePoints.toLocaleString()}
          />
          <StatCard
            label={T.profileStats.hardcoreRatio}
            value={`${hardcoreRatio}%`}
            accent="text-green-400"
          />
          <StatCard
            label={T.profileRa.memberSince}
            value={memberYear}
          />
        </motion.div>

        {raUser.Motto && (
          <p className="text-sm italic text-text-secondary px-1">&ldquo;{raUser.Motto}&rdquo;</p>
        )}

        {hasContribs && (
          <div className="bg-bg-main rounded-xl p-3 flex flex-col gap-2">
            <p className="text-xs text-text-secondary uppercase tracking-wider">
              {T.profileRa.contributions}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-purple-400">
                  {raUser.ContribCount.toLocaleString()}
                </span>
                <span className="text-xs text-text-secondary">{T.profileRa.achievementsCreated}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-pink-400">
                  {raUser.ContribYield.toLocaleString()}
                </span>
                <span className="text-xs text-text-secondary">{T.profileRa.pointsContributed}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-bg-card rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            {T.userStats.awards}
          </h2>
          {!awardsLoading && awards && (
            <span className="text-sm text-text-secondary">
              {totalAchievements.toLocaleString()} {T.userStats.achievementsUnlocked}
            </span>
          )}
        </div>

        {awardsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 animate-pulse">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-bg-main rounded-xl p-3 flex flex-col items-center gap-2">
                <div className="h-7 w-10 rounded bg-white/10" />
                <div className="h-2.5 w-14 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : awards ? (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <AwardCard
              label={T.userStats.masteries}
              value={awards.MasteryAwardsCount}
              accent="text-yellow-400"
            />
            <AwardCard
              label={T.userStats.beatenHC}
              value={awards.BeatenHardcoreAwardsCount}
              accent="text-orange-400"
            />
            <AwardCard
              label={T.userStats.beatenSC}
              value={awards.BeatenSoftcoreAwardsCount}
              accent="text-blue-400"
            />
            <AwardCard
              label={T.userStats.completions}
              value={awards.CompletionAwardsCount}
              accent="text-green-400"
            />
            <AwardCard
              label={T.userStats.events}
              value={awards.EventAwardsCount}
              accent="text-purple-400"
            />
          </motion.div>
        ) : null}
      </div>

      <div className="bg-bg-card rounded-3xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {T.userStats.games}
        </h2>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <GamesCard
            label={T.userStats.registeredGames}
            value={totalGames}
            accent="text-text-main"
          />
          <GamesCard
            label={T.userStats.inProgress}
            value={inProgress.length}
            accent="text-amber-400"
          />
          <GamesCard
            label={T.userStats.completedSC}
            value={completedSC}
            accent="text-blue-400"
          />
          <GamesCard
            label={T.userStats.completedHC}
            value={completedHC}
            accent="text-orange-400"
          />
        </motion.div>
      </div>
    </section>
  )
}