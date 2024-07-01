import { RoleRepository } from '../repositories/roleRepository';
import { Role } from '../entity/Role';

export class RoleService {
  private roleRepository: RoleRepository
  constructor() {
    this.roleRepository= new RoleRepository() }

  async addRole(name: string) {
    const role = await this.roleRepository.findByName(name);
    if (!role) {
      await this.roleRepository.save({ name } as Role);
    }
  }

  async getRoleByName(name: string) {
    return this.roleRepository.findByName(name);
  }

  async getRoles() {
    return this.roleRepository.findRoles();
  }

  async checkRole(name: string) {
    const role = await this.roleRepository.findByName(name);
    return { exists: !!role };
  }
}
