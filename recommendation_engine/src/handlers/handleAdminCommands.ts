import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { UserService } from '../services/userService';
import { MenuItemService } from '../services/menuItemService';
import { AdminController } from '../controllers/adminController';
import { handleLogout } from './logoutHandler';
import { MenuItemController } from '../controllers/menuItemController';

export async function handleAdminCommands(
  ws: WebSocket,
  command: string,
  currentStateSetter: (state: string) => void,
  userService: UserService,
  user: User,
  menuItemController: MenuItemController,
  menuItemService: MenuItemService,
  adminController: AdminController
) {
  switch (command) {
    case '1':
      ws.send('Admin: Add User');
      ws.send('Please enter username for the new user:');
      currentStateSetter('addUserUsername');
      break;
    case '2':
      ws.send('Admin: Add Menu Item');
      ws.send('Please enter the new menu item details in the format "name,description,price,category":');
      currentStateSetter('addMenuItemDetails');
      break;
    case '3':
      await menuItemController.showMenuItems(ws, menuItemService);
      break;
    case '4':
      ws.send('Admin: Update Menu Item');
      ws.send('Please enter the ID of the menu item to update:');
      currentStateSetter('updateMenuItemId');
      break;
    case '5':
      ws.send('Admin: Delete Menu Item');
      ws.send('Please enter the ID of the menu item to delete:');
      currentStateSetter('deleteMenuItemId');
      break;
    case '6':
      await adminController.viewDiscardList(ws);
      currentStateSetter('authenticated');
      break;
    case '7':
      ws.send('Admin: Change Menu Item Availability');
      ws.send('Please enter the menu item ID and new availability (true/false) in the format "itemId,availability":');
      currentStateSetter('changeAvailability');
      break;
    case 'logout':
      await handleLogout(ws, userService, user);
      break;
    default:
      ws.send('Unknown command.');
  }
}
