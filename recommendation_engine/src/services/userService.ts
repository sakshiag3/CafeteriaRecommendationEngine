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
    try {
      const existingUser = await this.userRepository.findByUsername(username);
      return { exists: !!existingUser };
    } catch (error) {
      console.error('Error checking username:', error);
      throw new Error('Could not check username');
    }
  }

  async addUser(username: string, password: string, roleName: string) {
    try {
      const role = await this.userRepository.findRoleByName(roleName);
      if (!role) {
        throw new Error('Role not found');
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = new User();
      user.username = username;
      user.password = hashedPassword;
      user.role = role;
      await this.userRepository.save(user);
    } catch (error) {
      console.error('Error adding user:', error);
      throw new Error('Could not add user');
    }
  }

  async save(user: User) {
    try {
      await this.userRepository.save(user);
    } catch (error) {
      console.error('Error saving user:', error);
      throw new Error('Could not save user');
    }
  }

  async getNotifications(user: User) {
    try {
      return await this.notificationRepository.findNotificationsByRoleAndTime(user.role.id, user.logoutTime);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw new Error('Could not get notifications');
    }
  }

  async findByUsername(username: string) {
    try {
      return await this.userRepository.findByUsername(username);
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new Error('Could not find user by username');
    }
  }

  async createNotification(content: string, roleId: number) {
    try {
      return await this.notificationRepository.createNotification(content, roleId);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Could not create notification');
    }
  }
}
