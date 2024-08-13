import { UserService } from '../services/userService';
import { User } from '../entity/User';

import bcrypt from 'bcrypt';
import { WebSocket } from 'ws';
import { RoleService } from '../services/roleService';

export class UserController {
  private userService: UserService;
  private roleService: RoleService;

  constructor() {
    this.userService = new UserService();
    this.roleService = new RoleService();
  }

  async handleAddUser(userData: { username: string; password: string; role: string }) {
    try {
      const { username, password, role } = userData;
      await this.userService.addUser(username, password, role);
    } catch (error) {
      console.error('Error adding user:', error);
      throw new Error('Failed to add user.');
    }
  }

  async getNotifications(user: User) {
    try {
      return await this.userService.getNotifications(user);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw new Error('Failed to get notifications.');
    }
  }

  async handleUsername(ws: WebSocket, username: string) {
    try {
      const { exists } = await this.userService.checkUsername(username);
      if (exists) {
        const user = await this.userService.findByUsername(username);
        ws.send('Please enter your password:');
        return user;
      } else {
        ws.send('Invalid username. Please try again:');
        return null;
      }
    } catch (error) {
      console.error('Error handling username:', error);
      ws.send('An error occurred. Please try again later.');
      return null;
    }
  }

  async handlePassword(ws: WebSocket, password: string, user: any) {
    try {
      if (user && user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          user.lastLoginTime = new Date();
          await this.userService.save(user);
          ws.send(`Welcome ${user.username} to the application. Your role is ${user.role.name}.`);
          return true;
        }
      }
      ws.send('Invalid password. Please try again:');
      return false;
    } catch (error) {
      console.error('Error handling password:', error);
      ws.send('An error occurred. Please try again later.');
      return false;
    }
  }

  async handleLogout(ws: WebSocket, user: User) {
    try {
      user.logoutTime = new Date();
      await this.userService.save(user);
      ws.send(`Logging you out, ${user.username}.`);
      ws.close();
    } catch (error) {
      console.error('Error handling logout:', error);
      ws.send('An error occurred. Please try again later.');
    }
  }
}
