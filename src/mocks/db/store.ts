import { env } from '@/shared/config/env';
import { isScenarioId, type ScenarioId } from '@/mocks/scenarios/presets';
import { nftFixtures } from '@/mocks/fixtures/nfts';
import { userFixtures } from '@/mocks/fixtures/users';
import { walletFixtures } from '@/mocks/fixtures/wallets';
import type { NftSummary, User, Wallet } from '@/shared/contracts';

export class MockDatabase {
  private currentScenario: ScenarioId;
  private nfts = new Map<string, NftSummary>();
  private users = new Map<string, User>();
  private wallets = new Map<string, Wallet>();

  constructor(initialScenario = env.defaultScenario) {
    const storedScenario =
      typeof localStorage === 'undefined' ? undefined : localStorage.getItem('junglenft:scenario');
    const candidate = storedScenario ?? initialScenario;
    this.currentScenario = isScenarioId(candidate) ? candidate : 'default';
    this.reset();
  }

  get scenario() {
    return this.currentScenario;
  }

  setScenario(scenario: string) {
    this.currentScenario = isScenarioId(scenario) ? scenario : 'default';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('junglenft:scenario', this.currentScenario);
    }
  }

  listNfts() {
    return Array.from(this.nfts.values());
  }

  getNft(id: string) {
    return this.nfts.get(id);
  }

  updateNft(id: string, patch: Partial<NftSummary>) {
    const current = this.nfts.get(id);
    if (!current) return undefined;

    const updated = { ...current, ...patch, version: current.version + 1 };
    this.nfts.set(id, updated);
    return updated;
  }

  listUsers() {
    return Array.from(this.users.values());
  }

  getUser(id: string) {
    return this.users.get(id);
  }

  listWallets(userId?: string) {
    const wallets = Array.from(this.wallets.values());
    return userId ? wallets.filter((wallet) => wallet.userId === userId) : wallets;
  }

  reset() {
    this.nfts = new Map(nftFixtures.map((nft) => [nft.id, structuredClone(nft)]));
    this.users = new Map(userFixtures.map((user) => [user.id, structuredClone(user)]));
    this.wallets = new Map(walletFixtures.map((wallet) => [wallet.id, structuredClone(wallet)]));
  }
}

export const mockDatabase = new MockDatabase();
