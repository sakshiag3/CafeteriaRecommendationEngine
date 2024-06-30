import { UserRepository } from '../repositories/userRepository';
import { NotificationRepository } from '../repositories/notificationRepository';
import { User } from '../entity/User';
import bcrypt from 'bcrypt';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private notificationRepository: NotificationRepository
  ) {}

  async addUser(username: string, password: string, roleName: string) {
    const role = await this.userRepository.findRoleByName(roleName);
    if (!role) {
      throw new Error('Role not found');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User();
    user.username = username;
    user.password = hashedPassword;
    user.role = role;
    await this.userRepository.save(user);
  }

  async save(user: User) {
    await this.userRepository.save(user);
  }

  async findByUsername(username: string) {
    return this.userRepository.findByUsername(username);
  }
  async createNotification(content: string, roleId: number) {
    return this.notificationRepository.createNotification(content, roleId);
  }
}
