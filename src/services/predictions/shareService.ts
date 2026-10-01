import type { ConsensusData, ConsensusIQResult, Match, PredictionOption, UserPrediction } from '../../types/predictions';
import { formatTeamName } from '../../lib/predictions/utils';
import { derbyCard, encodeShareCard, slipCard, talkCard } from '../../lib/predictions/shareCard.mjs';
import { showVotesForConsensus } from '../../lib/predictions/voteDisplay.mjs';

export interface ShareDataPayload {
  title: string;
  text: string;
  url: string;
}

class ShareService {
  public generateSharePayload(
    iqResult: ConsensusIQResult,
    predictions: UserPrediction[],
    matches: Match[]
  ): ShareDataPayload {
    const derbyMatch = matches.find(m => m.isDerby);
    const backedTeams: string[] = [];

    predictions.forEach(p => {
      const match = matches.find(m => m.id === p.matchId);
      if (match) {
        if (p.prediction === '1') backedTeams.push(match.homeTeam.name);
        else if (p.prediction === '2') backedTeams.push(match.awayTeam.name);
        else backedTeams.push(`Draw in ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`);
      }
    });

    const backedSummary = backedTeams.slice(0, 2).map(t => `Backed: ${t}`).join('\n');
    const derbyTeaser = derbyMatch
      ? `\nLocked Matchday Climax: ${derbyMatch.homeTeam.name} vs ${derbyMatch.awayTeam.name}`
      : '';

    const text = `🔥 My EPL Matchday Consensus IQ: ${iqResult.score}/100 (${iqResult.statusLabel})!\n\n${backedSummary}${derbyTeaser}\n\nSee what the fans voted before kickoff on EgerScore:`;
    const url = this.predictionsPageUrl();

    return {
      title: 'EgerScore EPL Matchday Picks',
      text,
      url
    };
  }

  public async triggerShare(
    payload: ShareDataPayload,
    onSuccess?: () => void
  ): Promise<'shared' | 'whatsapp' | 'copied'> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url
        });
        if (onSuccess) onSuccess();
        return 'shared';
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // user cancelled
          return 'copied';
        }
      }
    }

    // WhatsApp fallback
    const encoded = encodeURIComponent(`${payload.text} ${payload.url}`);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (onSuccess) onSuccess();
    return 'whatsapp';
  }

  public predictionsPageUrl(): string {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('view', 'picks');
    url.hash = '/news';
    return url.toString();
  }

  public talkPageUrl(postId?: string): string {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('view', 'talk');
    if (postId) url.searchParams.set('post', postId);
    return url.toString();
  }

  public openWhatsApp(text: string) {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private derbyPageUrl(match: Match, selection: PredictionOption): string {
    const picked = this.pickName(match, selection);
    const team = picked
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'team';
    const fixture = match.id.replace(/-/g, '');
    const pick = selection === '1' ? 'home' : selection === '2' ? 'away' : 'draw';
    return `${window.location.origin}/prediction/${team}/${fixture}/${pick}`;
  }

  public voteSplit(consensus?: ConsensusData | null) {
    if (consensus) return showVotesForConsensus(consensus);
    return showVotesForConsensus({
      matchId: '',
      totalVotes: 0,
      homePct: 0,
      drawPct: 0,
      awayPct: 0,
      pulseLabel: '',
    });
  }

  public pickName(match: Match, pick: PredictionOption): string {
    if (pick === '1') return formatTeamName(match.homeTeam.name);
    if (pick === '2') return formatTeamName(match.awayTeam.name);
    return 'Draw';
  }

  public votesForPick(pick: PredictionOption, consensus?: ConsensusData | null): number {
    const split = this.voteSplit(consensus);
    if (pick === '1') return split.homeVotes;
    if (pick === '2') return split.awayVotes;
    return split.drawVotes;
  }

  private cardPageUrl(card: ReturnType<typeof derbyCard> | ReturnType<typeof slipCard> | ReturnType<typeof talkCard>): string {
    const page = new URL('/api/share', window.location.origin);
    page.searchParams.set('d', encodeShareCard(card));
    return page.toString();
  }

  public async presentCard(card: ReturnType<typeof derbyCard> | ReturnType<typeof slipCard> | ReturnType<typeof talkCard>): Promise<boolean> {
    const pageUrl = this.cardPageUrl(card);
    // A URL preview remains clickable in WhatsApp; an uploaded image file does not.
    this.openWhatsApp(pageUrl);
    return true;
  }

  public shareDerby(args: {
    derby: Match;
    selection: PredictionOption;
    consensus?: ConsensusData | null;
    matches: Match[];
    userPredictions: Map<string, PredictionOption>;
    consensusMap?: Map<string, ConsensusData>;
  }): Promise<boolean> {
    this.openWhatsApp(this.derbyPageUrl(args.derby, args.selection));
    return Promise.resolve(true);
  }

  public shareSlip(args: {
    matches: Match[];
    userPredictions: Map<string, PredictionOption>;
    consensusMap?: Map<string, ConsensusData>;
  }): Promise<boolean> {
    const hasDerby = args.matches.some((m) => m.isDerby && args.userPredictions.has(m.id));
    const shown = args.matches.slice(0, 8);
    const rows = shown.map((m) => {
      const pick = args.userPredictions.get(m.id);
      return {
        match: `${formatTeamName(m.homeTeam.name)} vs ${formatTeamName(m.awayTeam.name)}`,
        pick: pick ? this.pickName(m, pick) : 'Not selected',
        votes: pick ? this.votesForPick(pick, args.consensusMap?.get(m.id)) : 0,
        isDerby: Boolean(m.isDerby),
        selected: Boolean(pick),
      };
    });
    return this.presentCard(slipCard({
      rows,
      hidden: Math.max(0, args.matches.length - shown.length),
      hasDerby,
    }));
  }

  public shareTalk(post: { id: string; authorHandle: string; content: string }): Promise<boolean> {
    return this.presentCard(talkCard({
      handle: post.authorHandle,
      text: post.content,
      postId: post.id,
    }));
  }

  public async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Continue to fallback
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return Boolean(successful);
    } catch {
      return true; // Gracefully continue flow even if clipboard is restricted
    }
  }
}

export const shareService = new ShareService();
