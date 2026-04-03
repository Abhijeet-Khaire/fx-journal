
import { test, expect } from 'vitest';
import { evaluateChallenge, calculateEquityCurve } from '../src/lib/challengeEngine';

test('Max Drawdown Calculation', () => {
    const mockConfig: any = {
        accountSize: 100000,
        maxDrawdownLimit: 10000,
        dailyDrawdownLimit: 5000,
        profitTarget: 10000,
        trailingDrawdownType: 'none',
        startDate: '2024-01-01'
    };

    const mockTrades: any[] = [
        { date: '2024-01-01', time: '10:00', profitLoss: 1000 },
        { date: '2024-01-01', time: '11:00', profitLoss: -2000 },
        { date: '2024-01-01', time: '12:00', profitLoss: 3000 },
        { date: '2024-01-01', time: '13:00', profitLoss: -4000 },
    ];

    // Correct expected sequence:
    // 0 -> 1000 (Peak 1000, DD 0)
    // 1000 -> -1000 (Peak 1000, DD 2000)
    // -1000 -> 2000 (Peak 2000, DD 0)
    // 2000 -> -2000 (Peak 2000, DD 4000)
    // Max DD should be 4000.

    const evaluation = evaluateChallenge(mockConfig, mockTrades);
    expect(evaluation.maxDD).toBe(4000);
});

test('Max Drawdown Calculation (Out of Order)', () => {
    const mockConfig: any = {
        accountSize: 100000,
        maxDrawdownLimit: 10000,
        dailyDrawdownLimit: 5000,
        profitTarget: 10000,
        trailingDrawdownType: 'none',
        startDate: '2024-01-01'
    };

    const outOfOrderTrades: any[] = [
        { date: '2024-01-01', time: '13:00', profitLoss: -4000 },
        { date: '2024-01-01', time: '10:00', profitLoss: 1000 },
        { date: '2024-01-01', time: '12:00', profitLoss: 3000 },
        { date: '2024-01-01', time: '11:00', profitLoss: -2000 },
    ];

    const evaluation = evaluateChallenge(mockConfig, outOfOrderTrades);
    expect(evaluation.maxDD).toBe(4000);
});

test('Trailing Drawdown (Full Trailing)', () => {
    const mockConfig: any = {
        accountSize: 100000,
        maxDrawdownLimit: 10000,
        dailyDrawdownLimit: 5000,
        profitTarget: 10000,
        trailingDrawdownType: 'full-trailing',
        startDate: '2024-01-01'
    };

    const trades: any[] = [
        { date: '2024-01-01', time: '10:00', profitLoss: 5000 }, // Equity 105k. DD Floor 95k.
        { date: '2024-01-01', time: '11:00', profitLoss: -6000 }, // Equity 99k. Still above 95k.
    ];

    const evaluation = evaluateChallenge(mockConfig, trades);
    expect(evaluation.status).toBe('active');

    // Now hit the trailing floor
    const trades2 = [...trades, { date: '2024-01-01', time: '12:00', profitLoss: -5000 }]; // Equity 94k. Breach!
    const evaluation2 = evaluateChallenge(mockConfig, trades2);
    expect(evaluation2.status).toBe('failed');
});

test('Max Drawdown Calculation (Missing Time String)', () => {
    const mockConfig: any = {
        accountSize: 100000,
        maxDrawdownLimit: 10000,
        dailyDrawdownLimit: 5000,
        profitTarget: 10000,
        trailingDrawdownType: 'none',
        startDate: '2024-01-01'
    };

    const tradesWithMissingTime: any[] = [
        { date: '2024-01-01', profitLoss: 1000 }, // No time, should default to 00:00
        { date: '2024-01-01', time: '10:00', profitLoss: -2000 },
    ];

    const evaluation = evaluateChallenge(mockConfig, tradesWithMissingTime);
    // 0 -> 1000 (at 00:00) -> -1000 (at 10:00)
    // Max DD should be 1000 (from 0 to -1000) or 2000 (from peak 1000 to -1000)?
    // Wait, peak is 1000. Current is -1000. DD is 2000. Correct.
    expect(evaluation.maxDD).toBe(2000);
});
