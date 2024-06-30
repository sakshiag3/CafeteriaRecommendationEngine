import { RoleService } from '../services/roleService';

export class RoleController {
  constructor(private roleService: RoleService) {}



  async getRoles() {
    return this.roleService.getRoles();
  }

  async checkRole(name: string) {
    return this.roleService.checkRole(name);
  }
}
