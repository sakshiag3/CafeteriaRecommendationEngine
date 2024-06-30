import { WebSocket } from 'ws';
import { ChefController } from '../controllers/chefController';
import { UserService } from '../services/userService';
import { RoleService } from '../services/roleService';
import { Util } from '../utils/Util';

export async function handleChefInputs(
  ws: WebSocket,
  msg: string,
  currentState: string,
  chefController: ChefController,
  userService: UserService,
  roleService: RoleService,
  currentStateSetter: (state: string) => void,
  selectedIdsByMeal: { meal: string; ids: string[] }[]
) {
  if (currentState === 'selectRecommendations') {
    if (selectedIdsByMeal.length === 0) {
      const { start, end } = await Util.getCurrentDateRange();
      const existingSelectedRecommendations = await chefController.getSelectedRecommendationsByDateRange(start, end);

      if (existingSelectedRecommendations.length > 0) {
        const formattedTables = Util.formatSelectedRecommendationsToTables(existingSelectedRecommendations);
        ws.send(`Recommendations have already been selected for today.\n\n${formattedTables}`);
        currentStateSetter('authenticated');
        return;
      }

      ws.send('Please enter the IDs of the items you wish to select for Breakfast, separated by commas:');
      selectedIdsByMeal.push({ meal: 'Breakfast', ids: [] });
    } else if (selectedIdsByMeal.length === 1) {
      selectedIdsByMeal[0].ids = msg.split(',').map(id => id.trim());
      ws.send('Please enter the IDs of the items you wish to select for Lunch, separated by commas:');
      selectedIdsByMeal.push({ meal: 'Lunch', ids: [] });
    } else if (selectedIdsByMeal.length === 2) {
      selectedIdsByMeal[1].ids = msg.split(',').map(id => id.trim());
      ws.send('Please enter the IDs of the items you wish to select for Dinner, separated by commas:');
      selectedIdsByMeal.push({ meal: 'Dinner', ids: [] });
    } else if (selectedIdsByMeal.length === 3) {
      selectedIdsByMeal[2].ids = msg.split(',').map(id => id.trim());
      await chefController.selectRecommendations(ws, selectedIdsByMeal);
      currentStateSetter('authenticated');
    }
    const chefRole = await roleService.getRoleByName('Employee');
    if (chefRole) {
      await userService.createNotification(
        `Menu Items have been rolled out for today. Please cast your vote!`,
        chefRole.id
      );
      ws.send('Notification sent to Employee role.');
    }
  } else if (currentState === 'viewVotes') {
    await chefController.viewVotes(ws);
    currentStateSetter('authenticated');
  } else if (currentState === 'selectItemToPrepare') {
    const [breakfastId, lunchId, dinnerId] = msg.split(',').map(id => parseInt(id.trim(), 10));
    const mealIds = [
      { meal: 'Breakfast', id: breakfastId },
      { meal: 'Lunch', id: lunchId },
      { meal: 'Dinner', id: dinnerId }
    ];

    const { start, end } = await Util.getCurrentDateRange();
    const existingSelections = await chefController.getFinalSelectionsForDate(start, end);

    if (existingSelections.length > 0) {
      ws.send(`Final selections have already been made for today.`);
      currentStateSetter('authenticated');
      return;
    }

    for (const { meal, id } of mealIds) {
      await chefController.prepareFinalSelection(ws, id, meal);
    }
    const chefRole = await roleService.getRoleByName('Employee');
    if (chefRole) {
      await userService.createNotification(
        `Food items have been prepared and served for today. Please provide your feedback!`,
        chefRole.id
      );
      ws.send('Notification sent to Employee role.');
    }

    ws.send('Final selections have been saved.');
    currentStateSetter('authenticated');
  }
}
