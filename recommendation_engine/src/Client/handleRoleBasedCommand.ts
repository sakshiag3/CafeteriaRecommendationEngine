import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { UserService } from '../services/userService';
import { ChefController } from '../controllers/chefController';
import { EmployeeController } from '../controllers/employeeController';
import { AdminService } from '../services/adminService';
import { handleAdminCommands } from './handleAdminCommands';
import { handleChefCommands } from './handleChefCommands';
import { handleEmployeeCommands } from './handleEmployeeCommands';
import { MenuItemController } from '../controllers/menuItemController';

export async function handleRoleBasedCommand(
  ws: WebSocket,
  user: User,
  command: string,
  userService: UserService,
  adminService: AdminService,
  chefController: ChefController,
  employeeController: EmployeeController,
  menuItemController: MenuItemController,
  currentStateSetter: (state: string) => void
) {
  switch (user.role.name) {
    case 'Admin':
      await handleAdminCommands(ws, command, currentStateSetter, userService, user, menuItemController, adminService);
      break;
    case 'Chef':
      await handleChefCommands(ws, command, chefController, userService, user, menuItemController, currentStateSetter);
      break;
    case 'Employee':
      await handleEmployeeCommands(ws, command, employeeController, userService, user, currentStateSetter);
      break;
    default:
      ws.send('Unknown role.');
  }
}
