import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { UserService } from '../services/userService';
import { MenuItemService } from '../services/menuItemService';
import { showMenuItems } from '../handlers/showMenuItems';
import { handleLogout } from '../handlers/logoutHandler';
import { ChefController } from '../controllers/chefController';

export async function handleChefCommands(
  ws: WebSocket,
  command: string,
  chefController: ChefController,
  menuItemService: MenuItemService,
  userService: UserService,
  user: User,
  currentStateSetter: (state: string) => void
) {
  switch (command) {
    case '1':
      await showMenuItems(ws, menuItemService);
      break;
    case '2':
      await chefController.fetchRecommendations(ws);
      break;
    case '3':
      currentStateSetter('selectRecommendations');
      break;
    case '4':
      await chefController.viewVotes(ws);
      break;
    case '5':
      currentStateSetter('selectItemToPrepare');
      ws.send('Please enter the IDs of the items you wish to prepare for each meal (Breakfast, Lunch, Dinner), separated by commas:');
      ws.send('Format: BreakfastID,LunchID,DinnerID');
      break;
    case 'logout':
      await handleLogout(ws, userService, user);
      break;
    default:
      ws.send('Unknown command.');
  }
}
