import { UserService } from '../services/userService';
import { User } from '../entity/User';

export class UserController {
  constructor(private userService: UserService) {}

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

  async getUsers() {
    return this.userService.getUsers();
  }
}
