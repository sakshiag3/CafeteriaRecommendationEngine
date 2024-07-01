import { UserRepository } from '../repositories/userRepository';
import { NotificationRepository } from '../repositories/notificationRepository';
import { User } from '../entity/User';
import bcrypt from 'bcrypt';

export class UserService {
  private userRepository: UserRepository;
  private notificationRepository: NotificationRepository;
  constructor() {
    this.userRepository = new UserRepository();
    this.notificationRepository = new NotificationRepository();
  }
  async checkUsername(username: string) {
    const existingUser = await this.userRepository.findByUsername(username);
    return { exists: !!existingUser };
  }

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

  async getNotifications(user: User) {
    return this.notificationRepository.findNotificationsByRoleAndTime(user.role.id, user.logoutTime);
  }
  
  async findByUsername(username: string) {
    return this.userRepository.findByUsername(username);
  }
  async createNotification(content: string, roleId: number) {
    return this.notificationRepository.createNotification(content, roleId);
  }
}
