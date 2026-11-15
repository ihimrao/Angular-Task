import { firstValueFrom } from 'rxjs';
import { MockUserRepository } from './mock-user.repository';

describe('MockUserRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('filters and paginates the user directory', async () => {
    const repository = new MockUserRepository();
    const result = await firstValueFrom(
      repository.list({
        search: 'engineering',
        status: 'active',
        roleId: 'all',
        department: 'all',
        sortBy: 'name',
        sortDirection: 'asc',
        page: 1,
        pageSize: 8,
      }),
    );

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(8);
    expect(result.items.every((user) => user.status === 'active')).toBe(true);
  });

  it('creates an invited user and can suspend the account', async () => {
    const repository = new MockUserRepository();
    const invited = await firstValueFrom(
      repository.invite({
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'jordan.lee@nexora.io',
        roleId: 'role-member',
        department: 'Engineering',
        jobTitle: 'Frontend Engineer',
        message: 'Welcome to the team',
      }),
    );
    const suspended = await firstValueFrom(repository.setStatus(invited.id, 'suspended'));

    expect(invited.status).toBe('invited');
    expect(suspended.status).toBe('suspended');
  });
});
