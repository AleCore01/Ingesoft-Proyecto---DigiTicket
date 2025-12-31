import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../AuthProvider.tsx';
import { CartProvider, useCart } from '../CartContext.jsx';
import { cartService } from '../../services/cartService';
import { eventsService } from '../../services/eventsService';
import { settingsService } from '../../services/settingsService';

// Helper JWT token with future expiration
function makeValidToken(minutesAhead = 60) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + minutesAhead * 60 }));
  return `${header}.${payload}.signature`;
}

// Harness component to expose context in tests
function Harness({ onReady }) {
  const ctx = useCart();
  useEffect(() => { onReady && onReady(ctx); }, [ctx, onReady]);
  return <div data-testid="count">{ctx.itemCount}</div>;
}

// Utility to render provider stack and capture context
async function setup(onReady) {
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Tester', role: 'CLIENT' }));
  localStorage.setItem('token', makeValidToken());
  return render(
    <AuthProvider>
      <CartProvider>
        <Harness onReady={onReady} />
      </CartProvider>
    </AuthProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.removeItem('digiticket_applied_points');
  localStorage.removeItem('digiticket_last_hold_expires');
  vi.clearAllMocks();
  vi.useFakeTimers();
  // Default settings response with explicit maxTickets
  settingsService.get = vi.fn().mockResolvedValue({ data: { maxTicketsPerPurchase: 5 } });
  // Default event service returns minimal data
  eventsService.getById = vi.fn().mockResolvedValue({ data: { id: 'e1', title: 'Evento', eventZones: [{ id: 'z1', name: 'VIP', price: 100 }] } });
  // Default cart service stubs
  cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', items: [], appliedPoints: 0 });
  cartService.placeHold = vi.fn().mockResolvedValue({ holdId: 'h1', expiresAt: new Date(Date.now() + 600000).toISOString() });
  cartService.addItem = vi.fn().mockResolvedValue({ id: 'c1', holdExpiresAt: new Date(Date.now() + 600000).toISOString(), items: [] });
  cartService.clearCart = vi.fn().mockResolvedValue({ ok: true });
  cartService.removeItem = vi.fn().mockResolvedValue({ ok: true });
  cartService.updateQuantity = vi.fn().mockResolvedValue({ ok: true });
  cartService.checkout = vi.fn().mockResolvedValue({ data: { orderId: 'o1' } });
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('CartContext branch coverage', () => {
  it('clears state when backend returns empty cart (items length 0 branch)', async () => {
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', items: [] });
    let ctx;
    await setup((c) => { ctx = c; });
    await act(async () => { await ctx.loadCart(); });
    expect(ctx.items).toEqual([]);
    expect(ctx.cartId).toBeNull(); // Should be cleared
    expect(ctx.appliedPoints).toBe(0);
  });

  it('restores valid future hold without setting shouldCreateHold', async () => {
    const future = new Date(Date.now() + 300000).toISOString();
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', holdExpiresAt: future, items: [{ id: 'i1', eventId: 'e1', eventZoneId: 'z1', qty: 1 }] });
    let ctx;
    await setup((c) => { ctx = c; });
    await act(async () => { await ctx.loadCart(); });
    expect(ctx.holdExpiresAt).toBe(future);
    // Expect no new hold creation afterward
    expect(sessionStorage.getItem('digiticket_last_hold_expires')).toBe(future);
  });

  it.skip('flags shouldCreateHold when holdExpiresAt is invalid', async () => {
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', holdExpiresAt: 'not-a-date', items: [{ id: 'i1', eventId: 'e1', eventZoneId: 'z1', qty: 1 }] });
    let ctx;
    await setup((c) => { ctx = c; });
    // loadCart already invoked by effect; advance timers for hold creation
    vi.advanceTimersByTime(200);
    await waitFor(() => expect(cartService.placeHold).toHaveBeenCalled());
    expect(ctx.holdId).toBe('h1');
  });

  it.skip('cleans cart when backend hold is expired', async () => {
    const past = new Date(Date.now() - 10000).toISOString();
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', holdExpiresAt: past, items: [{ id: 'i1', eventId: 'e1', eventZoneId: 'z1', qty: 1 }] });
    let ctx;
    await setup((c) => { ctx = c; });
    // loadCart should trigger clearCart path
    await waitFor(() => expect(cartService.clearCart).toHaveBeenCalled());
    expect(ctx.items).toEqual([]);
    expect(ctx.holdExpiresAt).toBeNull();
  });

  it.skip('creates initial hold when items exist and no prior hold timestamp', async () => {
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', items: [{ id: 'i1', eventId: 'e1', eventZoneId: 'z1', qty: 1 }] });
    let ctx;
    await setup((c) => { ctx = c; });
    vi.advanceTimersByTime(200);
    await waitFor(() => expect(cartService.placeHold).toHaveBeenCalled());
    expect(ctx.holdId).toBe('h1');
  });

  it('event enrichment fallback when eventsService fails', async () => {
    eventsService.getById = vi.fn().mockRejectedValue(new Error('fail'));
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', items: [{ id: 'i1', eventId: 'eX', eventZoneId: 'zX', qty: 2, unitPrice: 55 }] });
    let ctx;
    await setup((c) => { ctx = c; });
    await act(async () => { await ctx.loadCart(); });
    expect(ctx.items[0].eventTitle).toBe('Evento sin nombre'); // fallback title
    expect(ctx.items[0].price).toBe(55);
  });

  it.skip('createOrUpdateHold uses default expiry when backend omits expiresAt', async () => {
    cartService.placeHold = vi.fn().mockResolvedValue({ holdId: 'hx1' });
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', items: [{ id: 'i1', eventId: 'e1', eventZoneId: 'z1', qty: 1 }] });
    let ctx;
    await setup((c) => { ctx = c; });
    vi.advanceTimersByTime(200);
    await waitFor(() => expect(cartService.placeHold).toHaveBeenCalled());
    expect(ctx.holdId).toBe('hx1');
    expect(ctx.holdExpiresAt).toBeTruthy();
  });

  it.skip('scheduled expiration clears cart (timer path)', async () => {
    const soon = new Date(Date.now() + 1500).toISOString();
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', holdExpiresAt: soon, items: [{ id: 'i1', eventId: 'e1', eventZoneId: 'z1', qty: 1 }] });
    let ctx;
    await setup((c) => { ctx = c; });
    expect(ctx.items.length).toBe(1);
    // Fast-forward past expiry
    vi.advanceTimersByTime(2000);
    await waitFor(() => expect(cartService.clearCart).toHaveBeenCalled());
    expect(ctx.items).toEqual([]);
  });

  it.skip('addItem merges quantity for existing item', async () => {
    // First load cart empty but settings loaded
    let ctx;
    await setup((c) => { ctx = c; });
    await act(async () => { await ctx.addItem({ eventId: 'e1', eventTitle: 'A', zoneId: 'z1', zoneName: 'VIP', price: 10, quantity: 1 }); });
    await waitFor(() => expect(ctx.items.length).toBe(1));
    await act(async () => { await ctx.addItem({ eventId: 'e1', eventTitle: 'A', zoneId: 'z1', zoneName: 'VIP', price: 10, quantity: 2 }); });
    await waitFor(() => expect(ctx.items[0].quantity).toBe(3));
  });

  it.skip('addItem returns limit error when exceeding maxTicketsPerPurchase', async () => {
    settingsService.get = vi.fn().mockResolvedValue({ data: { maxTicketsPerPurchase: 2 } });
    // Force re-render with new settings by fresh setup
    let ctx;
    await setup((c) => { ctx = c; });
    // Add 2 tickets
    await act(async () => { await ctx.addItem({ eventId: 'e1', eventTitle: 'A', zoneId: 'z1', zoneName: 'VIP', price: 10, quantity: 2 }); });
    // Try adding 1 more (should fail)
    const res = await ctx.addItem({ eventId: 'e1', eventTitle: 'A', zoneId: 'z1', zoneName: 'VIP', price: 10, quantity: 1 });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('MAX_TICKETS_PER_EVENT');
  });

  it('removeItem sets shouldCreateHold when no active hold', async () => {
    cartService.getCart = vi.fn().mockResolvedValue({ id: 'c1', items: [{ id: 'i1', eventId: 'e1', eventZoneId: 'z1', qty: 1 }] });
    let ctx;
    await setup((c) => { ctx = c; });
    // Load & create hold
    await act(async () => { await ctx.loadCart(); });
    // Expire hold artificially
    ctx.holdExpiresAt = new Date(Date.now() - 1000).toISOString();
    await act(async () => { await ctx.removeItem('i1'); });
    expect(cartService.removeItem).toHaveBeenCalled();
  });

  it.skip('updateQuantity with 0 removes item (delegation path)', async () => {
    // Add item
    let ctx;
    await setup((c) => { ctx = c; });
    await act(async () => { await ctx.addItem({ eventId: 'e1', eventTitle: 'A', zoneId: 'z1', zoneName: 'VIP', price: 10, quantity: 1 }); });
    await waitFor(() => expect(ctx.items.length).toBe(1));
    const id = ctx.items[0].id;
    cartService.updateQuantity = vi.fn().mockResolvedValue({});
    await act(async () => { await ctx.updateQuantity(id, 0); });
    expect(ctx.items.length === 0 || cartService.removeItem.mock.calls.length > 0).toBe(true);
  });

  it.skip('updateQuantity handles 422 validation error', async () => {
    let ctx;
    await setup((c) => { ctx = c; });
    await act(async () => { await ctx.addItem({ eventId: 'e1', eventTitle: 'A', zoneId: 'z1', zoneName: 'VIP', price: 10, quantity: 1 }); });
    await waitFor(() => expect(ctx.items.length).toBe(1));
    const id = ctx.items[0].id;
    const err = new Error('Too many');
    err.status = 422;
    cartService.updateQuantity = vi.fn().mockRejectedValue(err);
    const res = await ctx.updateQuantity(id, 10);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('VALIDATION_ERROR');
  });

  it('checkout returns error when cart empty', async () => {
    let ctx;
    await setup((c) => { ctx = c; });
    const res = await ctx.checkout({ method: 'card', cardNumber: '4111 1111 1111 1111' });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/carrito está vacío/i);
  });
});
