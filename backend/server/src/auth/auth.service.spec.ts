import { BadRequestException } from '@nestjs/common';
import { CreditsService } from '../credits/credits.service';
import { DatabaseService } from '../database/database.service';
import { AuthService } from './auth.service';

describe('AuthService.updateUserProfile consent fields', () => {
  const currentUser = {
    id: 'user-id',
    cognito_user_id: 'sub',
    email: 'person@example.com',
    stripe_customer_id: null,
    first_name: null,
    last_name: null,
    phone: '555-0100',
    birthday: null,
    country: 'CA',
    currency: 'CAD',
    language: 'English',
    marketing_opt_in: false,
    preferences: {},
    terms_accepted_at: null,
    terms_version: null,
    created_at: new Date('2026-11-01T00:00:00Z'),
    updated_at: new Date('2026-11-01T00:00:00Z'),
  };

  let query: jest.Mock;
  let service: AuthService;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue({ rows: [currentUser] });
    service = new AuthService(
      { query } as unknown as DatabaseService,
      {} as CreditsService,
    );
  });

  type QueryCall = [string, unknown[]];
  const calls = () => query.mock.calls as QueryCall[];
  const updateCalls = () =>
    calls().filter(([sql]) => sql.includes('UPDATE users'));

  it('records terms acceptance in the same single UPDATE as the profile', async () => {
    await service.updateUserProfile('user-id', {
      marketingOptIn: true,
      termsAccepted: true,
      termsVersion: 'terms:June 1, 2026|privacy:June 1, 2026',
    });

    const updates = updateCalls();
    expect(updates).toHaveLength(1);
    const [sql, params] = updates[0];
    expect(sql).toContain('terms_accepted_at = CASE WHEN $11::boolean');
    expect(params[8]).toBe(true);
    expect(params[10]).toBe(true);
    expect(params[11]).toBe('terms:June 1, 2026|privacy:June 1, 2026');
  });

  it('leaves the consent columns unchanged on ordinary profile updates', async () => {
    await service.updateUserProfile('user-id', {
      birthday: '1970-05-04',
      country: 'US',
      currency: 'USD',
    });

    const updates = updateCalls();
    expect(updates).toHaveLength(1);
    expect(updates[0][1][10]).toBe(false);
    expect(updates[0][1][11]).toBeNull();
  });

  it('rejects acceptance without a version before writing anything', async () => {
    await expect(
      service.updateUserProfile('user-id', { termsAccepted: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('saves the sign-up profile fields that the frontend sends', async () => {
    await service.updateUserProfile('user-id', {
      birthday: '1970-05-04',
      country: 'us',
      currency: 'usd',
      marketingOptIn: true,
    });

    const params = updateCalls()[0]?.[1] ?? [];
    expect(params[4]).toBe('1970-05-04');
    expect(params[5]).toBe('US');
    expect(params[6]).toBe('USD');
    expect(params[8]).toBe(true);
  });

  it('keeps the saved phone when an update omits it, and clears it on an empty string', async () => {
    await service.updateUserProfile('user-id', { country: 'US' });
    expect(updateCalls()[0][1][3]).toBe('555-0100');

    query.mockClear();
    await service.updateUserProfile('user-id', { phone: '' });
    expect(updateCalls()[0][1][3]).toBeNull();
  });
});
