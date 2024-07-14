import { WebSocket } from 'ws';
import { AdminService } from '../services/adminService';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';
import { UserController } from '../controllers/userController';
import { Util } from '../utils/Util';

let newUserDetails: { username?: string; password?: string; roleName?: string } = {};

export class AdminController {
  private adminService: AdminService;
  private userService: UserService;
  private roleService: RoleService;
  private userController: UserController;

  constructor() {
    this.adminService = new AdminService();
    this.userService = new UserService();
    this.roleService = new RoleService();
    this.userController = new UserController();
  }

  public async viewDiscardList(ws: WebSocket) {
    try {
      const discardList = await this.adminService.getDiscardList();
      const formattedList = Util.formatDiscardListToTable(discardList);
      ws.send(`Discard Menu Item List:\n\n${formattedList}`);
    } catch (error) {
      console.error('Error viewing discard list:', error);
      throw error;
    }
  }

  public async changeAvailability(ws: WebSocket, itemId: number, availability: boolean) {
    try {
      const menuItem = await this.adminService.changeAvailability(itemId, availability);
      ws.send(`Menu item ${menuItem.name} availability changed to ${availability}.`);
    } catch (error) {
      console.error('Error changing availability:', error);
      throw error;
    }
  }

  public async handleAddUserUsername(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    const existingUser = await this.userService.findByUsername(msg);
    if (existingUser) {
      ws.send(`Error: User with username ${msg} already exists. Please enter a different username:`);
    } else {
      newUserDetails.username = msg;
      ws.send(`Enter password for the new user ${newUserDetails.username}:`);
      currentStateSetter('addUserPassword');
    }
  }

  public async handleAddUserPassword(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    newUserDetails.password = msg;
    const roles = await this.roleService.getRoles();
    const roleNames = roles.map(role => role.name);
    ws.send(`Enter role for the new user ${newUserDetails.username}. Available roles: ${roleNames.join(', ')}:`);
    currentStateSetter('addUserRole');
  }

  public async handleAddUserRole(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    const roleExists = await this.roleService.checkRole(msg);
    if (!roleExists.exists) {
      const roles = await this.roleService.getRoles();
      ws.send(`Error: Role ${msg} does not exist. Available roles: ${roles.map(role => role.name).join(', ')}. Please enter a valid role:`);
    } else {
      newUserDetails.roleName = msg;
      await this.userController.handleAddUser({
        username: newUserDetails.username!,
        password: newUserDetails.password!,
        role: newUserDetails.roleName!
      });
      ws.send(`User ${newUserDetails.username} added successfully.`);
      newUserDetails = {};
      currentStateSetter('authenticated');
    }
  }
}
