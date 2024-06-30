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

}
