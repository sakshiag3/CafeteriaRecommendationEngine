import { WebSocket } from 'ws';
import { EmployeeController } from '../controllers/employeeController';

export async function handleEmployeeInputs(
  ws: WebSocket,
  msg: string,
  currentState: string,
  currentStateSetter: (state: string) => void,
  userId: number
) {

  const employeeController = new EmployeeController();
  switch (currentState) {
    case 'employeeCastVote':
      await employeeController.handleCastVote(ws, msg, userId, currentStateSetter);
      break;
    case 'employeeGiveFeedback':
      await employeeController.handleGiveFeedback(ws, msg, userId, currentStateSetter);
      break;
    default:
      ws.send('Unknown state. Please try again.');
  }
}
