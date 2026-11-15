import { firstValueFrom } from 'rxjs';
import { MockRoleRepository } from './mock-role.repository';

describe('MockRoleRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prevents deletion of system roles', async () => {
    const repository = new MockRoleRepository();
    await expect(firstValueFrom(repository.delete('role-owner'))).rejects.toThrow(
      'System roles cannot be deleted.',
    );
  });

  it('creates and deletes a custom role', async () => {
    const repository = new MockRoleRepository();
    const role = await firstValueFrom(
      repository.create({
        name: 'Support specialist',
        description: 'Handles customer support workflows.',
        permissionIds: ['members.view'],
      }),
    );
    await expect(firstValueFrom(repository.delete(role.id))).resolves.toBeUndefined();
  });
});
