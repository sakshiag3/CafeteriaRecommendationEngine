import { WebSocket } from 'ws';
import { ChefController } from '../controllers/chefController';

export async function handleChefInputs(
  ws: WebSocket,
  msg: string,
  currentState: string,
  currentStateSetter: (state: string) => void,
  selectedIdsByMeal: { meal: string; ids: string[] }[]
) {

  const chefController = new ChefController();

  switch (currentState) {
    case 'selectRecommendations':
      await chefController.handleSelectRecommendations(ws, msg,currentStateSetter, selectedIdsByMeal);
      break;
    case 'selectItemToPrepare':
      await chefController.handleSelectItemToPrepare(ws, msg, currentStateSetter);
      break;
    default:
      ws.send('Invalid state. Please try again.');
  }
}
