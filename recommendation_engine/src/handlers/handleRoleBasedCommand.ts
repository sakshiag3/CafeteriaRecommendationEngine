import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { RoleController } from '../controllers/roleController';
import { MenuItemController } from '../controllers/menuItemController';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';
import { MenuItemService } from '../services/menuItemService';
import { showUsers } from '../handlers/showUsers';
import { showRoles } from '../handlers/showRoles';
import { showMenuItems } from '../handlers/showMenuItems';
import { handleLogout } from '../handlers/logoutHandler';

export async function handleRoleBasedCommand(
  ws: WebSocket,
  user: User,
  command: string,
  roleController: RoleController,
  menuItemController: MenuItemController,
  userController: UserController,
  userService: UserService,
  roleService: RoleService,
  menuItemService: MenuItemService,
  currentStateSetter: (state: string) => void
) {
  if (user.role.name === 'Admin') {
    if (command === '1') {
      ws.send('Admin: Add User');
      ws.send('Please enter username for the new user:');
      currentStateSetter('addUserUsername');
    } else if (command === '2') {
      ws.send('Admin: Add Role');
      ws.send('Please enter role name:');
      currentStateSetter('addRole');
    } else if (command === '3') {
      ws.send('Admin: Add Menu Item');
      ws.send('Please enter name for the new menu item:');
      currentStateSetter('addMenuItemName');
    } else if (command === '4') {
      await showUsers(ws, userService);
    } else if (command === '5') {
      await showRoles(ws, roleService);
    } else if (command === '6') {
      await showMenuItems(ws, menuItemService);
    } else if (command === '7') {
      ws.send('Admin: Update Menu Item');
      ws.send('Please enter the ID of the menu item to update:');
      currentStateSetter('updateMenuItemId');
    } else if (command === '8') {
      ws.send('Admin: Delete Menu Item');
      ws.send('Please enter the ID of the menu item to delete:');
      currentStateSetter('deleteMenuItemId');
    } else if (command.toLowerCase() === 'logout') {
      await handleLogout(ws, userService, user);
    } else {
      ws.send('Unknown command.');
    }
  } else if (user.role.name === 'Chef') {
    if (command === '1') {
      // Implement view menu functionality
    } else if (command === '2') {
      // Implement recommend menu functionality
    } else if (command === '3') {
      currentStateSetter('fetchRecommendations');
      ws.send('Fetching recommendations...');
    } else if (command.toLowerCase() === 'logout') {
      await handleLogout(ws, userService, user);
    } else {
      ws.send('Unknown command.');
    }
  } else if (user.role.name === 'Employee') {
    if (command === '1') {
      // Implement give feedback functionality
    } else if (command === '2') {
      // Implement cast vote functionality
    } else if (command.toLowerCase() === 'logout') {
      await handleLogout(ws, userService, user);
    } else {
      ws.send('Unknown command.');
    }
  }
}