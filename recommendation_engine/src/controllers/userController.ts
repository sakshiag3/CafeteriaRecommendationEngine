import { UserService } from '../services/userService';
import { User } from '../entity/User';

import bcrypt from 'bcrypt';
import { WebSocket } from 'ws';
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

  async getNotifications(user: User) {
    return this.userService.getNotifications(user);
  }

  async handleAddRole(roleData: { name: string }) {
    const { name } = roleData;
    await this.roleService.addRole(name);
  }

  async handleUsername(ws: WebSocket, username: string) {
    const { exists } = await this.userService.checkUsername(username);
    if (exists) {
      const user = await this.userService.findByUsername(username);
      ws.send('Please enter your password:');
      return user;
    } else {
      ws.send('Invalid username. Please try again:');
      return null;
    }
  }

  async  handlePassword(ws: WebSocket, password: string, user: any) {
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
  }

}
