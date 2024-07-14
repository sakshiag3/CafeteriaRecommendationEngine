import { WebSocket } from 'ws';
import { handleUserInputs } from './handleUserInputs';
import { handleMenuItemInputs } from './handleMenuItemInputs';
import { handleRoleBasedCommand } from '../Client/handleRoleBasedCommand';
import { handleChefInputs } from './handleChefInputs';
import { handleEmployeeInputs } from './handleEmployeeInputs';
import { showRoleBasedOptions } from '../Client/showRoleBasedOptions';
import { surveyHandler } from './surveyHandler';

export async function handleUserConnection(
  ws: WebSocket,
  controllers: any,
  services: any
) {
  let currentUser: any | null = null;
  let currentState = 'username';
  let selectedIdsByMeal: { meal: string; ids: string[] }[] = [];
  let currentSurveyMenuItemId = 0;
  let currentSurveyResponses: string[] = [];
  let currentQuestionIndex = 0;

  const currentStateSetter = (state: string) => {
    currentState = state;
  };

  const currentSurveyMenuItemIdSetter = (id: number) => {
    currentSurveyMenuItemId = id;
  };

  const currentSurveyResponsesSetter = (responses: string[]) => {
    currentSurveyResponses = responses;
  };

  const currentQuestionIndexSetter = (index: number) => {
    currentQuestionIndex = index;
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
          controllers.adminController,
          controllers.chefController,
          controllers.employeeController,
          controllers.menuItemController,
          currentStateSetter
        );
        // showRoleBasedOptions(ws, currentUser.role.name);
      } else {
        ws.send('An error occurred. Please reconnect.');
      }
    } else if (currentState.startsWith('employeeCastVote') || currentState.startsWith('employeeGiveFeedback')) {
      await handleEmployeeInputs(ws, msg, currentState, controllers.employeeController, services.employeeService, currentStateSetter, currentUser.id);
    } else if (currentState.startsWith('selectRecommendations') || currentState.startsWith('selectItemToPrepare')){
      await handleChefInputs(ws, msg, currentState, controllers.chefController, services.userService, services.roleService, currentStateSetter, selectedIdsByMeal);
    } else if (currentState === 'changeAvailability') {
      await services.adminService.changeAvailability(ws, msg);
      currentStateSetter('authenticated');
    } else if (currentState.startsWith('addUser')) {
      await handleUserInputs(ws, msg, currentState, controllers.userController, services.roleService, services.userService, currentStateSetter);
    } else if (currentState.startsWith('addMenuItem') || currentState.startsWith('updateMenuItem') || currentState.startsWith('deleteMenuItem')) {
      await handleMenuItemInputs(ws, msg, currentState, services.userService, services.roleService, services.menuItemService, currentStateSetter);
    } else if (currentState === 'addRole') {
      await controllers.userController.handleAddRole({ name: msg });
    } else if (currentState === 'employeeEnterMenuItemIdForSurvey' || currentState === 'employeeAnsweringSurvey') {
      await surveyHandler(
        ws,
        msg,
        controllers.employeeController,
        currentUser.id,
        currentState,
        currentStateSetter,
        currentSurveyMenuItemIdSetter,
        currentSurveyResponsesSetter,
        currentSurveyMenuItemId,
        currentSurveyResponses,
        currentQuestionIndexSetter,
        currentQuestionIndex
      );
    }
  });
}
