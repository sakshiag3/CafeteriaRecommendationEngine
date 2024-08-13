import { RoleRepository } from '../repositories/roleRepository';
import { Role } from '../entity/Role';

export class RoleService {
  private roleRepository: RoleRepository;

  constructor() {
    this.roleRepository = new RoleRepository();
  }

  async addRole(name: string) {
    try {
      const role = await this.roleRepository.findByName(name);
      if (!role) {
        await this.roleRepository.save({ name } as Role);
      }
    } catch (error) {
      console.error('Error adding role:', error);
      throw new Error('An error occurred while adding the role. Please try again later.');
    }
  }

  async getRoleByName(name: string) {
    try {
      return await this.roleRepository.findByName(name);
    } catch (error) {
      console.error('Error fetching role by name:', error);
      throw new Error('An error occurred while fetching the role. Please try again later.');
    }
  }

  async getRoles() {
    try {
      return await this.roleRepository.findRoles();
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw new Error('An error occurred while fetching roles. Please try again later.');
    }
  }

  async checkRole(name: string) {
    try {
      const role = await this.roleRepository.findByName(name);
      return { exists: !!role };
    } catch (error) {
      console.error('Error checking role:', error);
      throw new Error('An error occurred while checking the role. Please try again later.');
    }
  }
}
