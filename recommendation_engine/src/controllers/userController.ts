import { UserService } from '../services/userService';
import { User } from '../entity/User';
import { userDataRequest } from '../Interface/userDataRequest';

export class UserController {
  constructor(private userService: UserService) {}

  async handleAddUser(userData: userDataRequest) {
    try {
      const { username, password, role } = userData;
      await this.userService.addUser(username, password, role);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async findByUsername(username: string) {
    try {
      return await this.userService.findByUsername(username);
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  async save(user: User) {
    return this.userService.save(user);
  }

  async getNotifications(user: User) {
    try {
      return await this.userService.getNotifications(user);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  async checkUsername(username: string) {
    try {
      return await this.userService.checkUsername(username);
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
      return await this.userService.getUsers();
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }
}
