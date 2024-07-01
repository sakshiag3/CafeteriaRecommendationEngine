import { WebSocket } from 'ws';
import { EmployeeController } from '../controllers/employeeController';
import { EmployeeService } from '../services/employeeService';

export async function handleEmployeeInputs(
  ws: WebSocket,
  msg: string,
  currentState: string,
  employeeController: EmployeeController,
  employeeService:EmployeeService,
  currentStateSetter: (state: string) => void,
  userId: number
) {
  switch (currentState) {
    case 'employeeCastVote':
      await handleCastVote(ws, msg, employeeController, userId, currentStateSetter);
      break;
    case 'employeeGiveFeedback':
      await handleGiveFeedback(ws, msg, employeeController, employeeService, userId, currentStateSetter);
      break;
    default:
      ws.send('Unknown state. Please try again.');
  }
}

async function handleCastVote(
  ws: WebSocket,
  msg: string,
  employeeController: EmployeeController,
  userId: number,
  currentStateSetter: (state: string) => void
) {
  const [meal, selectedRecommendationId] = msg.split(',').map(part => part.trim());
  await employeeController.castVote(ws, userId, parseInt(selectedRecommendationId, 10), meal);
  currentStateSetter('authenticated');
}

async function handleGiveFeedback(
  ws: WebSocket,
  msg: string,
  employeeController: EmployeeController,
  employeeService: EmployeeService,
  userId: number,
  currentStateSetter: (state: string) => void
) {
  const feedbackParts = msg.split(',').map(part => part.trim());
  const menuItemId = parseInt(feedbackParts[0], 10);
  const rating = parseInt(feedbackParts[1], 10);
  const comment = feedbackParts.slice(2).join(',');

  if (isNaN(menuItemId) || isNaN(rating) || rating < 1 || rating > 5) {
    ws.send('Invalid input. Please ensure the menu item ID is a number, the rating is between 1 and 5, and the comment is provided.');
    return;
  }

  const menuItemExists = await employeeService.checkMenuItemExists(menuItemId);
  if (!menuItemExists) {
    ws.send('Invalid menu item ID. Please ensure the menu item exists.');
    return;
  }

  await employeeController.giveFeedback(ws, userId, menuItemId, rating, comment);
  ws.send('Your feedback has been submitted.');
  currentStateSetter('authenticated');
}
