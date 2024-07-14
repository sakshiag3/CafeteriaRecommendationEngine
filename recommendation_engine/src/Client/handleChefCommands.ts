import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { ChefController } from '../controllers/chefController';
import { MenuItemController } from '../controllers/menuItemController';
import { UserController } from '../controllers/userController';

export async function handleChefCommands(
  ws: WebSocket,
  command: string,
  user: User,
  currentStateSetter: (state: string) => void
) {
   const chefController= new ChefController();
   const userController= new UserController();
  const menuItemController= new MenuItemController();

  switch (command) {
    case '1':
      await menuItemController.showMenuItems(ws);
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
      await userController.handleLogout(ws, user);
      break;
    default:
      ws.send('Unknown command.');
  }
}
