import { WebSocket } from 'ws';
import { User } from '../entity/User';
import { EmployeeController } from '../controllers/employeeController';
import { UserController } from '../controllers/userController';

export async function handleEmployeeCommands(
  ws: WebSocket,
  command: string,
  user: User,
  currentStateSetter: (state: string) => void
) {
  
  const userController= new UserController();
  const employeeController = new EmployeeController();
  switch (command) {
    case '1':
      await employeeController.viewSelectedMenuItems(ws, user.id);
      break;
    case '2':
      ws.send('Employee: Cast Vote');
      ws.send('Please enter the meal and menu item ID to vote for in the format "Meal,MenuItemID":');
      currentStateSetter('employeeCastVote');
      break;
    case '3':
      await employeeController.viewPreparedMenuItems(ws,user.id);
      break;
    case '4':
      ws.send('Employee: Give Feedback');
      ws.send('Please enter your feedback in the format "menuItemId,rating,comment":');
      currentStateSetter('employeeGiveFeedback');
      break;
    case '5':
      await employeeController.viewSurveys(ws, user.id);
      currentStateSetter('authenticated');
      break;
    case '6':
      ws.send('Employee: Enter Menu Item ID');
      ws.send('Please enter the menu item ID for the survey:');
      currentStateSetter('employeeEnterMenuItemIdForSurvey');
      break;
    case '7':
      ws.send('Employee: Update Your Profile');
      await employeeController.updateProfile(ws, user.id);
      currentStateSetter('authenticated');
      break;
    case 'logout':
      await userController.handleLogout(ws, user);
      break;
    default:
      ws.send('Unknown command.');
  }
  
}
