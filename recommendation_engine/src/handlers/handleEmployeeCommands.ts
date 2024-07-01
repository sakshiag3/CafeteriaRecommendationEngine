import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { UserService } from '../services/userService';
import { handleLogout } from '../handlers/logoutHandler';
import { EmployeeController } from '../controllers/employeeController';

export async function handleEmployeeCommands(
  ws: WebSocket,
  command: string,
  employeeController: EmployeeController,
  userService: UserService,
  user: User,
  currentStateSetter: (state: string) => void
) {
  switch (command) {
    case '1':
      await employeeController.viewSelectedMenuItems(ws);
      break;
    case '2':
      ws.send('Employee: Cast Vote');
      ws.send('Please enter the meal and menu item ID to vote for in the format "Meal,MenuItemID":');
      currentStateSetter('employeeCastVote');
      break;
    case '3':
      await employeeController.viewPreparedMenuItems(ws);
      break;
    case '4':
      ws.send('Employee: Give Feedback');
      ws.send('Please enter your feedback in the format "menuItemId,rating,comment":');
      currentStateSetter('employeeGiveFeedback');
      break;
    case 'logout':
      await handleLogout(ws, userService, user);
      break;
    default:
      ws.send('Unknown command.');
  }
}
