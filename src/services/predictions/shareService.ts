import type { ConsensusData, ConsensusIQResult, Match, PredictionOption, UserPrediction } from '../../types/predictions';
import { formatTeamName } from '../../lib/predictions/utils';
import { derbyCard, encodeShareCard, slipCard, talkCard } from '../../lib/predictions/shareCard.mjs';

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

    const text = `ðŸ”¥ My EPL Matchday Consensus IQ: ${iqResult.score}/100 (${iqResult.statusLabel})!\n\n${backedSummary}${derbyTeaser}\n\nSee what the fans voted before kickoff on EgerScore:`;
    const url = window.location.origin;

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

  public voteSplit(consensus?: ConsensusData | null, fallbackTotal = 1240) {
    const total = consensus?.totalVotes || fallbackTotal;
    const homePct = consensus?.homePct ?? 54;
    const drawPct = consensus?.drawPct ?? 22;
    const awayPct = consensus?.awayPct ?? 24;
    return {
      total,
      homeVotes: Math.round((total * homePct) / 100),
      drawVotes: Math.round((total * drawPct) / 100),
      awayVotes: Math.round((total * awayPct) / 100),
    };
  }

  public pickName(match: Match, pick: PredictionOption): string {
    if (pick === '1') return formatTeamName(match.homeTeam.name);
    if (pick === '2') return formatTeamName(match.awayTeam.name);
    return 'Draw';
  }

  public votesForPick(pick: PredictionOption, consensus?: ConsensusData | null, fallbackTotal = 1240): number {
    const split = this.voteSplit(consensus, fallbackTotal);
    if (pick === '1') return split.homeVotes;
    if (pick === '2') return split.awayVotes;
    return split.drawVotes;
  }

  private cardPageUrl(card: ReturnType<typeof derbyCard> | ReturnType<typeof slipCard> | ReturnType<typeof talkCard>): string {
    const page = new URL('/share', window.location.origin);
    page.searchParams.set('d', encodeShareCard(card));
    return page.toString();
  }

  public async presentCard(card: ReturnType<typeof derbyCard> | ReturnType<typeof slipCard> | ReturnType<typeof talkCard>): Promise<boolean> {
    const pageUrl = this.cardPageUrl(card);
    try {
      const imageUrl = new URL('/og.png', window.location.origin);
      imageUrl.searchParams.set('d', new URL(pageUrl).searchParams.get('d') || '');
      const response = await fetch(imageUrl.toString());
      if (response.ok && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        const blob = await response.blob();
        const file = new File([blob], 'egerscore.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], url: pageUrl });
          return true;
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return false;
    }
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
    const home = formatTeamName(args.derby.homeTeam.name);
    const away = formatTeamName(args.derby.awayTeam.name);
    const picked = this.pickName(args.derby, args.selection);
    const split = this.voteSplit(args.consensus, 1680);
    const mine = this.votesForPick(args.selection, args.consensus, 1680);
    const holding = mine >= Math.max(split.homeVotes, split.drawVotes, split.awayVotes);
    const call = args.selection === 'X'
      ? (holding
        ? 'Call other fans to vote draw with you to keep this.'
        : 'Call other fans to vote draw with you to secure this.')
      : (holding
        ? `Call other fans to vote for ${picked} to keep this win.`
        : `Call other fans to vote for ${picked} to secure this win.`);
    const stake = holding
      ? 'Stay quiet and this lead will not hold till Saturday.'
      : 'Without them, this will not stay yours.';
    const others = args.matches
      .filter((m) => m.id !== args.derby.id && args.userPredictions.has(m.id))
      .slice(0, 4)
      .map((m) => {
        const pick = args.userPredictions.get(m.id)!;
        const votes = this.votesForPick(pick, args.consensusMap?.get(m.id));
        return `${formatTeamName(m.homeTeam.name)} vs ${formatTeamName(m.awayTeam.name)} Â· ${this.pickName(m, pick)} Â· ${votes.toLocaleString()} fan votes`;
      });

    return this.presentCard(derbyCard({
      home,
      away,
      pick: picked,
      call,
      stake,
      homeVotes: split.homeVotes,
      drawVotes: split.drawVotes,
      awayVotes: split.awayVotes,
      others,
    }));
  }

  public shareSlip(args: {
    matches: Match[];
    userPredictions: Map<string, PredictionOption>;
    consensusMap?: Map<string, ConsensusData>;
  }): Promise<boolean> {
    const picked = args.matches.filter((m) => args.userPredictions.has(m.id) && !m.isDerby);
    const hasDerby = args.matches.some((m) => m.isDerby && args.userPredictions.has(m.id));
    const shown = picked.slice(0, 5);
    const rows = shown.map((m) => {
      const pick = args.userPredictions.get(m.id)!;
      return {
        match: `${formatTeamName(m.homeTeam.name)} vs ${formatTeamName(m.awayTeam.name)}`,
        pick: this.pickName(m, pick),
        votes: this.votesForPick(pick, args.consensusMap?.get(m.id)),
      };
    });
    return this.presentCard(slipCard({
      rows,
      hidden: picked.length - shown.length,
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
