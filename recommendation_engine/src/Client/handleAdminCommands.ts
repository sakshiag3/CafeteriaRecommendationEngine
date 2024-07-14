import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { MenuItemController } from '../controllers/menuItemController';
import { AdminController } from '../controllers/adminController';
import { UserController } from '../controllers/userController';

export async function handleAdminCommands(
  ws: WebSocket,
  command: string,
  currentStateSetter: (state: string) => void,
  user: User
) {

  const adminController= new AdminController();
  const userController= new UserController();
  const menuItemController= new MenuItemController();
  switch (command) {
    case '1':
      ws.send('Admin: Add User');
      ws.send('Please enter username for the new user:');
      currentStateSetter('addUserUsername');
      break;
    case '2':
      ws.send('Admin: Add Menu Item');
      ws.send('Please provide all details in the format "name, description, price, category, availabilityStatus, dietaryRestriction, spiceLevel, regionalPreference, isSweet:');
      currentStateSetter('addMenuItemDetails');
      break;
    case '3':
      await menuItemController.showMenuItems(ws);
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
      await userController.handleLogout(ws, user);
      break;
    default:
      ws.send('Unknown command.');
  }
}
