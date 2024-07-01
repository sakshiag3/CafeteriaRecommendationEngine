import { WebSocket } from 'ws';
import { handleUserInputs } from './handleUserInputs';
import { handleMenuItemInputs } from './handleMenuItemInputs';
import { handleRoleBasedCommand } from '../Client/handleRoleBasedCommand';
import { handleChefInputs } from './handleChefInputs';
import { showRoleBasedOptions } from '../Client/showRoleBasedOptions';

export async function handleUserConnection(
  ws: WebSocket,
  controllers: any,
  services: any
) {
  let currentUser: any | null = null;
  let currentState = 'username';
  let currentCommand: string | null = null;
  let selectedIdsByMeal: { meal: string; ids: string[] }[] = [];

  const currentStateSetter = (state: string) => {
    currentState = state;
  };

  ws.send('Please enter your username:');

  ws.on('message', async (message) => {
    const msg = message.toString().trim();
    console.log(`Received message: ${msg}`);

    if (currentState === 'username') {
      currentUser = await controllers.userController.handleUsername(ws, msg);
      if (currentUser) {
        currentState = 'password';
      }
    } else if (currentState === 'password') {
      const authenticated = await controllers.userController.handlePassword(ws, msg, currentUser);
      if (authenticated) {
        currentState = 'authenticated';
        showRoleBasedOptions(ws, currentUser.role.name);
        const notifications = await controllers.userController.getNotifications(currentUser);
        if (notifications.length > 0) {
          notifications.forEach((notification: any) => {
            ws.send(`Notification: ${notification.content}`);
          });
        } else {
          ws.send('No new notifications.');
        }
      } else {
        currentState = 'username';
      }
    } else if (currentState === 'authenticated') {
      if (currentUser) {
        await handleRoleBasedCommand(
          ws,
          currentUser,
          msg,
          services.userService,
          services.menuItemService,
          controllers.adminController,
          controllers.chefController,
          controllers.employeeController,
          controllers.menuItemController,
          currentStateSetter
        );
        showRoleBasedOptions(ws, currentUser.role.name);
      } else {
        ws.send('An error occurred. Please reconnect.');
      }
    } else if (currentState === 'selectRecommendations') {
      await handleChefInputs(ws, msg, currentState, controllers.chefController, services.userService, services.roleService, currentStateSetter, selectedIdsByMeal);
    } else if (currentState === 'selectItemToPrepare') {
      const selectedIds = msg.split(',').map(id => parseInt(id.trim(), 10));
      const meals = ['Breakfast', 'Lunch', 'Dinner'];
      const selectedMealsIds = meals.map((meal, index) => ({ meal, id: selectedIds[index] }));
      await controllers.chefController.selectItemToPrepare(ws, selectedMealsIds);
      currentState = 'authenticated';
    } else if (currentState === 'employeeCastVote') {
      const [meal, menuItemId] = msg.split(',').map(part => part.trim());
      await controllers.employeeController.castVote(ws, currentUser.id, parseInt(menuItemId, 10), meal);
      currentState = 'authenticated';
    } else if (currentState === 'employeeGiveFeedback') {
      const [menuItemId, rating, ...commentParts] = msg.split(',');
      const comment = commentParts.join(',').trim();
      await controllers.employeeController.giveFeedback(ws, currentUser.id, parseInt(menuItemId, 10), parseInt(rating, 10), comment);
      currentStateSetter('authenticated');
    } else if (currentState === 'changeAvailability') {
      await controllers.adminController.changeAvailability(ws, msg);
      currentStateSetter('authenticated');
    } else if (currentState.startsWith('addUser') || currentState.startsWith('updateUser') || currentState.startsWith('deleteUser')) {
      await handleUserInputs(ws, msg, currentState, controllers.userController, services.roleService, services.userService, currentStateSetter);
    } else if (currentState.startsWith('addMenuItem') || currentState.startsWith('updateMenuItem') || currentState.startsWith('deleteMenuItem')) {
      await handleMenuItemInputs(ws, msg, currentState, services.userService, services.roleService, services.menuItemService, currentStateSetter);
    } else if (currentState === 'addRole') {
      await controllers.userController.handleAddRole({ name: msg });
    }
  });
}
