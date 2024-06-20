import { RoleService } from '../services/roleService';

export class RoleController {
  constructor(private roleService: RoleService) {}

  async handleAddRole(roleData: { name: string }) {
    const { name } = roleData;
    await this.roleService.addRole(name);
  }

  async getRoleByName(name: string) {
    return this.roleService.getRoleByName(name);
  }

  async getRoles() {
    return this.roleService.getRoles();
  }

  async checkRole(name: string) {
    return this.roleService.checkRole(name);
  }
}
