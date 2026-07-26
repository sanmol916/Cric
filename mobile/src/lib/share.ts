import { Share } from 'react-native';
import type { MatchState } from '../types';
import { computeInnings } from '../scoring';

/** Build a nicely formatted plain-text scorecard for sharing. */
export function buildScorecardText(match: MatchState): string {
  const s0 = computeInnings(match.innings[0], match.teams);
  const s1 = computeInnings(match.innings[1], match.teams);
  const [t0, t1] = match.teams;

  const lines: string[] = [];
  lines.push('🏏 VoiceScore Cricket');
  lines.push('');
  lines.push(`${t0.name}: ${s0.totalRuns}/${s0.wickets} (${s0.oversText} ov)`);
  const secondPlayed = s1.legalBalls > 0 || s1.totalRuns > 0;
  if (secondPlayed) {
    lines.push(`${t1.name}: ${s1.totalRuns}/${s1.wickets} (${s1.oversText} ov)`);
  }

  // Result
  if (match.status === 'complete' && secondPlayed) {
    if (s1.totalRuns > s0.totalRuns) {
      lines.push('');
      lines.push(`🏆 ${t1.name} won by ${10 - s1.wickets} wickets`);
    } else if (s0.totalRuns > s1.totalRuns) {
      lines.push('');
      lines.push(`🏆 ${t0.name} won by ${s0.totalRuns - s1.totalRuns} runs`);
    } else {
      lines.push('');
      lines.push('🤝 Match tied');
    }
  }

  const topBatting = (label: string, summary: ReturnType<typeof computeInnings>) => {
    const bats = summary.batting
      .filter((b) => b.balls > 0)
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 3);
    if (bats.length === 0) return;
    lines.push('');
    lines.push(`— ${label} top scorers —`);
    for (const b of bats) lines.push(`  ${b.name}  ${b.runs} (${b.balls})`);
  };

  topBatting(t0.name, s0);
  if (secondPlayed) topBatting(t1.name, s1);

  lines.push('');
  lines.push('Scored by voice with VoiceScore Cricket ⚡');
  return lines.join('\n');
}

/** Open the OS share sheet with the match scorecard. */
export async function shareScorecard(match: MatchState): Promise<void> {
  const message = buildScorecardText(match);
  const [t0, t1] = match.teams;
  try {
    await Share.share({
      title: `${t0.name} vs ${t1.name}`,
      message,
    });
  } catch {
    /* user dismissed or share unavailable */
  }
}
