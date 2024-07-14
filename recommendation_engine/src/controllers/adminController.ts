import { WebSocket } from 'ws';
import { AdminService } from '../services/adminService';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';
import { UserController } from '../controllers/userController';
import { Util } from '../utils/Util';
import { NewUserDetails } from '../Interface/NewUserDetails';

export class AdminController {
  private adminService: AdminService;
  private userService: UserService;
  private roleService: RoleService;
  private userController: UserController;
  private newUserDetails: NewUserDetails = {};

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
      ws.send(`Error viewing discard list`);
    }
  }

  public async changeAvailability(ws: WebSocket, itemId: number, availability: boolean) {
    try {
      const menuItem = await this.adminService.changeAvailability(itemId, availability);
      ws.send(`Menu item ${menuItem.name} availability changed to ${availability}.`);
    } catch (error) {
      console.error('Error changing availability:', error);
      ws.send(`Error changing availability`);
    }
  }

  public async handleAddUserUsername(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      const existingUser = await this.userService.findByUsername(msg);
      if (existingUser) {
        ws.send(`Error: User with username ${msg} already exists. Please enter a different username:`);
      } else {
        this.newUserDetails.username = msg;
        ws.send(`Enter password for the new user ${this.newUserDetails.username}:`);
        currentStateSetter('addUserPassword');
      }
    } catch (error) {
      console.error('Error handling username:', error);
      ws.send(`Error handling username`);
    }
  }

  public async handleAddUserPassword(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      this.newUserDetails.password = msg;
      const roles = await this.roleService.getRoles();
      const roleNames = roles.map(role => role.name);
      ws.send(`Enter role for the new user ${this.newUserDetails.username}. Available roles: ${roleNames.join(', ')}:`);
      currentStateSetter('addUserRole');
    } catch (error) {
      console.error('Error handling password:', error);
      ws.send(`Error handling password`);
    }
  }

  public async handleAddUserRole(ws: WebSocket, msg: string, currentStateSetter: (state: string) => void) {
    try {
      const roleExists = await this.roleService.checkRole(msg);
      if (!roleExists.exists) {
        const roles = await this.roleService.getRoles();
        ws.send(`Error: Role ${msg} does not exist. Available roles: ${roles.map(role => role.name).join(', ')}. Please enter a valid role:`);
      } else {
        this.newUserDetails.roleName = msg;
        await this.userController.handleAddUser({
          username: this.newUserDetails.username!,
          password: this.newUserDetails.password!,
          role: this.newUserDetails.roleName!
        });
        ws.send(`User ${this.newUserDetails.username} added successfully.`);
        this.newUserDetails = {};
        currentStateSetter('authenticated');
      }
    } catch (error) {
      console.error('Error handling role:', error);
      ws.send(`Error handling role`);
    }
  }
}
