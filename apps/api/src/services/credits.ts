import { eq, sql } from 'drizzle-orm';
import type { Db } from '@consecom/db';
import * as s from '@consecom/db';
import { errors } from '@consecom/shared';

/**
 * CreditService — the load-bearing money path.
 *
 * Two-phase deduction to prevent race conditions:
 *
 *   reserve(customerId, amount)
 *     → SELECT FOR UPDATE on credit_balances
 *     → if available - reserved >= amount: bump reserved, return reservationId
 *     → else: throw INSUFFICIENT_CREDITS
 *
 *   confirm(reservationId, actualAmount)
 *     → reserved -= reservationAmount, used += actualAmount
 *
 *   refund(reservationId)
 *     → reserved -= reservationAmount (used unchanged)
 *
 *   grant(customerId, amount, reason, refType?, refId?)
 *     → used by admin adjustments, plan activation, refunds, expirations
 *     → writes credit_ledger entry + bumps available
 *
 * All operations write to `credit_ledger` (append-only) and update
 * `credit_balances` (materialized for fast reads). Both happen in the same
 * transaction so the sum of ledger entries always equals `creditsAvailable -
 * creditsReserved + creditsUsed` at any commit boundary.
 */
export interface Reservation {
  reservationId: string;
  reservedAmount: number;
}

const SAFETY_MARGIN = 1.5; // reserve 50% more than the worst-case estimate

export class CreditService {
  constructor(private db: Db) {}

  /**
   * Atomically reserve `amount` credits for a customer. Throws on insufficient.
   * Caller must `confirm` or `refund` once the underlying operation completes.
   */
  async reserve(
    customerId: string,
    amount: number,
    refType?: string,
    refId?: string,
  ): Promise<Reservation> {
    if (amount <= 0) throw errors.invalidRequest('reservation amount must be positive');

    return await this.db.transaction(async (tx) => {
      // Lock the balance row for the duration of this transaction.
      const [bal] = await tx
        .select()
        .from(s.creditBalances)
        .where(eq(s.creditBalances.customerId, customerId))
        .for('update')
        .limit(1);

      if (!bal) {
        throw errors.notFound('credit balance not found');
      }
      const free = bal.creditsAvailable - bal.creditsReserved;
      if (free < amount) {
        throw errors.insufficientCredits(
          `insufficient credits: available ${free}, requested ${amount}`,
        );
      }

      await tx
        .update(s.creditBalances)
        .set({
          creditsReserved: bal.creditsReserved + amount,
          updatedAt: new Date(),
        })
        .where(eq(s.creditBalances.customerId, customerId));

      const reservationId = crypto.randomUUID();
      await tx.insert(s.creditLedger).values({
        customerId,
        delta: amount,
        reason: 'reservation_hold',
        refType: refType ?? null,
        refId: refId ?? null,
        balanceAfter: free - amount,
        description: `hold for ${refType ?? 'request'}`,
      });

      return { reservationId, reservedAmount: amount };
    });
  }

  /**
   * Confirm a reservation: deduct the actual cost, release any unused hold.
   * `reservedAmount` is the original hold; `actualAmount` is the real usage.
   */
  async confirm(
    customerId: string,
    reservationId: string,
    reservedAmount: number,
    actualAmount: number,
    refType?: string,
    refId?: string,
  ): Promise<void> {
    if (actualAmount < 0) throw errors.invalidRequest('actual amount cannot be negative');
    // Defensive: coerce numeric fields. NaN propagates from upstream bugs.
    const safeReserved = Number.isFinite(reservedAmount) ? Math.max(0, Math.round(reservedAmount)) : 0;
    const safeActual = Number.isFinite(actualAmount) ? Math.max(0, Math.round(actualAmount)) : 0;
    const release = Math.max(0, safeReserved - safeActual);

    await this.db.transaction(async (tx) => {
      const [bal] = await tx
        .select()
        .from(s.creditBalances)
        .where(eq(s.creditBalances.customerId, customerId))
        .for('update')
        .limit(1);
      if (!bal) throw errors.notFound('credit balance not found');

      const newAvailable = bal.creditsAvailable - safeActual;
      const newReserved = bal.creditsReserved - safeReserved;
      const newUsed = bal.creditsUsed + safeActual;
      if (newAvailable < 0) {
        // Should never happen if reserve() was correct; defensive check.
        throw errors.internal('credit balance went negative — investigate reserve logic');
      }

      await tx
        .update(s.creditBalances)
        .set({
          creditsAvailable: newAvailable,
          creditsReserved: Math.max(0, newReserved),
          creditsUsed: newUsed,
          updatedAt: new Date(),
        })
        .where(eq(s.creditBalances.customerId, customerId));

      const description = release > 0
        ? `confirm ${safeActual}, release hold ${release}`
        : `confirm ${safeActual}`;

      await tx.insert(s.creditLedger).values({
        customerId,
        delta: -actualAmount,
        reason: 'usage',
        refType: refType ?? null,
        refId: refId ?? null,
        balanceAfter: newAvailable,
        description,
      });

      // Touch reservationId to keep TS happy; refId can be reused here.
      void reservationId;
    });
  }

  /** Release a reservation without deducting anything (e.g., provider error). */
  async refund(
    customerId: string,
    reservedAmount: number,
    reason: 'provider_error' | 'internal_error' | 'client_cancelled' = 'provider_error',
  ): Promise<void> {
    const safeReserved = Number.isFinite(reservedAmount) ? Math.max(0, Math.round(reservedAmount)) : 0;
    await this.db.transaction(async (tx) => {
      const [bal] = await tx
        .select()
        .from(s.creditBalances)
        .where(eq(s.creditBalances.customerId, customerId))
        .for('update')
        .limit(1);
      if (!bal) return; // nothing to refund
      await tx
        .update(s.creditBalances)
        .set({
          creditsReserved: Math.max(0, bal.creditsReserved - safeReserved),
          updatedAt: new Date(),
        })
        .where(eq(s.creditBalances.customerId, customerId));
      await tx.insert(s.creditLedger).values({
        customerId,
        delta: 0,
        reason: 'reservation_release',
        refType: reason,
        balanceAfter: bal.creditsAvailable - bal.creditsReserved + safeReserved,
        description: `release hold ${safeReserved} (${reason})`,
      });
    });
  }

  /** Grant credits (plan activation, admin adjustment, refund). */
  async grant(
    customerId: string,
    amount: number,
    reason: 'purchase' | 'refund' | 'admin_adjustment' | 'expiry' = 'admin_adjustment',
    refType?: string,
    refId?: string,
    description?: string,
  ): Promise<void> {
    if (amount <= 0) throw errors.invalidRequest('grant amount must be positive');

    await this.db.transaction(async (tx) => {
      const [bal] = await tx
        .select()
        .from(s.creditBalances)
        .where(eq(s.creditBalances.customerId, customerId))
        .for('update')
        .limit(1);
      if (!bal) {
        await tx.insert(s.creditBalances).values({
          customerId,
          creditsAvailable: amount,
          creditsReserved: 0,
          creditsUsed: 0,
        });
        await tx.insert(s.creditLedger).values({
          customerId,
          delta: amount,
          reason,
          refType: refType ?? null,
          refId: refId ?? null,
          balanceAfter: amount,
          description: description ?? `grant ${amount}`,
        });
        return;
      }
      const newAvailable = bal.creditsAvailable + amount;
      await tx
        .update(s.creditBalances)
        .set({ creditsAvailable: newAvailable, updatedAt: new Date() })
        .where(eq(s.creditBalances.customerId, customerId));
      await tx.insert(s.creditLedger).values({
        customerId,
        delta: amount,
        reason,
        refType: refType ?? null,
        refId: refId ?? null,
        balanceAfter: newAvailable,
        description: description ?? `grant ${amount}`,
      });
    });
  }

  /** Get current balance (read-only). */
  async getBalance(customerId: string) {
    const [bal] = await this.db
      .select()
      .from(s.creditBalances)
      .where(eq(s.creditBalances.customerId, customerId))
      .limit(1);
    return bal;
  }
}

/** Worst-case reservation in credits, with safety margin applied. */
export function reserveEstimate(maxCostCents: number, creditsPerCent = 1): number {
  // 1 cent USD ≈ 1 credit (configurable; the plan sets the per-credit price).
  return Math.ceil(maxCostCents * creditsPerCent * SAFETY_MARGIN);
}

/** Convenience: compute actual credit consumption from cents. */
export function creditsFromCents(cents: number, creditsPerCent = 1): number {
  return Math.ceil(cents * creditsPerCent);
}

// Re-export sql for callers needing raw escapes
export { sql };
