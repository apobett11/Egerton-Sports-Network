import { STORAGE_KEYS } from '../../lib/predictions/constants';
import { getStoredItem, setStoredItem } from '../../lib/predictions/utils';
import type { Match } from '../../types/predictions';

class DerbyService {
  public getUnlockedDerbies(): string[] {
    return getStoredItem<string[]>(STORAGE_KEYS.UNLOCKED_DERBIES, []);
  }

  public isDerbyUnlocked(matchId: string): boolean {
    const list = this.getUnlockedDerbies();
    return list.includes(matchId);
  }

  public unlockDerby(matchId: string): string[] {
    const list = this.getUnlockedDerbies();
    if (!list.includes(matchId)) {
      const updated = [...list, matchId];
      setStoredItem(STORAGE_KEYS.UNLOCKED_DERBIES, updated);
      return updated;
    }
    return list;
  }

  public canUnlockDerby(matches: Match[], picksCompleted: number): boolean {
    const regularMatches = matches.filter(m => !m.isDerby);
    return picksCompleted >= regularMatches.length;
  }

  public getFavouriteTeam(): string | null {
    return getStoredItem<string | null>(STORAGE_KEYS.FAVOURITE_TEAM, null);
  }

  public setFavouriteTeam(teamName: string): void {
    setStoredItem(STORAGE_KEYS.FAVOURITE_TEAM, teamName);
  }
}

export const derbyService = new DerbyService();
