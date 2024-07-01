import { UserService } from '../services/userService';
import { User } from '../entity/User';
import { RoleService } from '../services/roleService';

export class UserController {
  private userService: UserService;
  private roleService: RoleService;
  constructor() { 
    this.userService=  new UserService();
    this.roleService=  new RoleService();
  }
  
  async handleAddUser(userData: { username: string; password: string; role: string }) {
    const { username, password, role } = userData;
    await this.userService.addUser(username, password, role);
  }

  async findByUsername(username: string) {
    return this.userService.findByUsername(username);
  }

  async save(user: User) {
    return this.userService.save(user);
  }

  async getNotifications(user: User) {
    return this.userService.getNotifications(user);
  }

  async checkUsername(username: string) {
    return this.userService.checkUsername(username);
  }
  async handleAddRole(roleData: { name: string }) {
    const { name } = roleData;
    await this.roleService.addRole(name);
  }
}
