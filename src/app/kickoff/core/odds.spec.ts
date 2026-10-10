import { Bet } from './models';
import { CASHOUT_FACTOR, cashOutValue, formatOdds, probabilities, remainingRates, settleLeg, toOdds } from './odds';

describe('Kickoff odds engine', () => {
  describe('probabilities', () => {
    it('sums each market to 1', () => {
      const p = probabilities([0, 0], [1.6, 1.1]);
      expect(p.get('1x2:home')! + p.get('1x2:draw')! + p.get('1x2:away')!).toBeCloseTo(1, 6);
      expect(p.get('ou25:over')! + p.get('ou25:under')!).toBeCloseTo(1, 6);
      expect(p.get('btts:yes')! + p.get('btts:no')!).toBeCloseTo(1, 6);
    });

    it('favours the stronger side', () => {
      const p = probabilities([0, 0], [2.2, 0.8]);
      expect(p.get('1x2:home')!).toBeGreaterThan(p.get('1x2:away')!);
    });

    it('knows decided markets once the match is over', () => {
      const p = probabilities([2, 1], [0, 0]);
      expect(p.get('1x2:home')).toBe(1);
      expect(p.get('ou25:over')).toBe(1);
      expect(p.get('btts:yes')).toBe(1);
      expect(p.get('1x2:draw')).toBe(0);
    });

    it('locks totals that are already beaten', () => {
      const p = probabilities([1, 1], [0.8, 0.8]);
      expect(p.get('ou15:over')).toBeCloseTo(1, 9);
    });
  });

  describe('toOdds', () => {
    it('applies the margin and rounds to 2 decimals', () => {
      expect(toOdds(0.5)).toBeCloseTo(1.89, 2);
    });
    it('closes near-certain and near-impossible outcomes', () => {
      expect(toOdds(0.999)).toBeNull();
      expect(toOdds(0.001)).toBeNull();
    });
  });

  it('scales remaining expected goals with time left', () => {
    expect(remainingRates([1.8, 0.9], 45)).toEqual([0.9, 0.45]);
    expect(remainingRates([1.8, 0.9], 95)).toEqual([0, 0]);
  });

  describe('settleLeg', () => {
    it('settles 1X2, double chance, totals and BTTS', () => {
      expect(settleLeg('1x2', 'draw', [1, 1])).toBeTrue();
      expect(settleLeg('dc', '12', [1, 1])).toBeFalse();
      expect(settleLeg('ou25', 'under', [1, 1])).toBeTrue();
      expect(settleLeg('ou35', 'over', [3, 1])).toBeTrue();
      expect(settleLeg('btts', 'no', [2, 0])).toBeTrue();
    });
  });

  describe('cashOutValue', () => {
    const bet = (overrides: Partial<Bet> = {}): Bet => ({
      id: 'b1',
      placedAt: 0,
      type: 'single',
      stake: 10,
      odds: 3,
      status: 'open',
      payout: 0,
      legs: [
        {
          key: 'm1:1x2:home',
          matchId: 'm1',
          marketId: '1x2',
          outcomeId: 'home',
          odds: 3,
          matchLabel: 'A – B',
          status: 'open',
        },
      ],
      ...overrides,
    });

    it('pays more when the pick has shortened', () => {
      expect(cashOutValue(bet(), () => 1.5)).toBeCloseTo(10 * 3 / 1.5 * CASHOUT_FACTOR, 2);
    });

    it('is unavailable when a leg is suspended or lost', () => {
      expect(cashOutValue(bet(), () => null)).toBeNull();
      const lost = bet();
      lost.legs[0].status = 'lost';
      expect(cashOutValue(lost, () => 2)).toBeNull();
    });

    it('is unavailable for settled bets', () => {
      expect(cashOutValue(bet({ status: 'won' }), () => 2)).toBeNull();
    });
  });

  describe('formatOdds', () => {
    it('formats decimal, fractional and american', () => {
      expect(formatOdds(2.5, 'decimal')).toBe('2.50');
      expect(formatOdds(2.5, 'fractional')).toBe('3/2');
      expect(formatOdds(3, 'american')).toBe('+200');
      expect(formatOdds(1.5, 'american')).toBe('-200');
    });
  });
});
