import { WebSocket } from 'ws';
import { EmployeeController } from '../controllers/employeeController';

export async function surveyHandler(
  ws: WebSocket,
  command: string,
  userId: number,
  currentState: string,
  currentStateSetter: (state: string) => void,
  currentSurveyMenuItemIdSetter: (id: number) => void,
  currentSurveyResponsesSetter: (responses: string[]) => void,
  currentSurveyMenuItemId: number,
  currentSurveyResponses: string[],
  currentQuestionIndexSetter: (index: number) => void,
  currentQuestionIndex: number
) {
  
  const employeeController= new EmployeeController();
  switch (currentState) {
    case 'employeeEnterMenuItemIdForSurvey':
      const menuItemId = parseInt(command);
      if (isNaN(menuItemId)) {
        ws.send('Invalid menu item ID. Please enter a valid menu item ID:');
        return;
      }
      await employeeController.displaySurveyQuestions(ws);
      currentSurveyMenuItemIdSetter(menuItemId);
      currentQuestionIndexSetter(0);
      currentStateSetter('employeeAnsweringSurvey');
      ws.send('Please enter your response for question 1:');
      break;
    case 'employeeAnsweringSurvey':
      currentSurveyResponses[currentQuestionIndex] = command;
      currentSurveyResponsesSetter(currentSurveyResponses);
      currentQuestionIndex++;
      if (currentQuestionIndex < 3) {
        currentQuestionIndexSetter(currentQuestionIndex);
        ws.send(`Please enter your response for question ${currentQuestionIndex + 1}:`);
      } else {
        await employeeController.submitSurvey(ws, userId, currentSurveyMenuItemId, currentSurveyResponses);
        currentStateSetter('authenticated');
      }
      break;
    default:
      ws.send('Unknown command.');
      break;
  }
}
