import { WebSocket } from 'ws';
import { EmployeeService } from '../services/employeeService';
import { Util } from '../utils/Util';

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  public async viewSelectedMenuItems(ws: WebSocket, userId: number) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const selectedRecommendations = await this.employeeService.getSelectedMenuItems(start, end);
      const menuItems = selectedRecommendations.map(r => r.menuItem);
      const userPreferences = await this.employeeService.recommendMenuItems(userId, menuItems);
      
      // Reconstruct SelectedRecommendation objects with sorted menu items
      const sortedRecommendations = userPreferences.map(menuItem => selectedRecommendations.find(r => r.menuItem.id === menuItem.id)!);

      const formattedTables = this.employeeService.formatSelectedRecommendationsToTables(sortedRecommendations);
      ws.send(`Selected menu items for today:\n\n${formattedTables}`);
    } catch (error) {
      console.error('Error viewing selected menu items:', error);
      ws.send('An error occurred while fetching the selected menu items. Please try again later.');
    }
  }

  public async viewPreparedMenuItems(ws: WebSocket, userId: number) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const finalSelections = await this.employeeService.getPreparedMenuItems(start, end);
      const menuItems = finalSelections.map(f => f.selectedRecommendation.menuItem);
      const userPreferences = await this.employeeService.recommendMenuItems(userId, menuItems);
      
      // Reconstruct FinalSelection objects with sorted menu items
      const sortedSelections = userPreferences.map(menuItem => finalSelections.find(f => f.selectedRecommendation.menuItem.id === menuItem.id)!);

      const formattedTables = this.employeeService.formatFinalSelectionsToTables(sortedSelections);
      ws.send(`Prepared menu items for today:\n\n${formattedTables}`);
    } catch (error) {
      console.error('Error viewing prepared menu items:', error);
      ws.send('An error occurred while fetching the prepared menu items. Please try again later.');
    }
  }

  public async castVote(ws: WebSocket, userId: number, selectedRecommendationId: number, meal: string) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const message = await this.employeeService.castVote(userId, selectedRecommendationId, meal, start, end);
      ws.send(message);
    } catch (error) {
      console.error('Error casting vote:', error);
      ws.send('An error occurred while casting your vote. Please try again later.');
    }
  }

  public async giveFeedback(ws: WebSocket, userId: number, menuItemId: number, rating: number, comment: string) {
    try {
      const message = await this.employeeService.giveFeedback(userId, menuItemId, rating, comment);
      ws.send(message);
    } catch (error) {
      console.error('Error giving feedback:', error);
      ws.send('An error occurred while submitting your feedback. Please try again later.');
    }
  }

  public async viewSurveys(ws: WebSocket, userId: number) {
    try {
      const surveys = await this.employeeService.getSurveys(userId);
      const formattedSurveys = this.employeeService.formatSurveysToTable(surveys);
      ws.send(`Surveys available for feedback:\n\n${formattedSurveys}`);
    } catch (error) {
      console.error('Error viewing surveys:', error);
      ws.send('An error occurred while fetching the surveys. Please try again later.');
    }
  }

  public async submitSurvey(ws: WebSocket, userId: number, menuItemId: number, responses: string[]) {
    try {
      const message = await this.employeeService.submitSurvey(userId, menuItemId, responses);
      ws.send(message);
    } catch (error) {
      console.error('Error submitting survey:', error);
      ws.send('An error occurred while submitting your survey. Please try again later.');
    }
  }

  public async displaySurveyQuestions(ws: WebSocket) {
    try {
      const questions = await this.employeeService.getSurveyQuestions();
      let message = 'Survey Questions:\n';
      questions.forEach((question, index) => {
        message += `${index + 1}. ${question.questionText}\n`;
      });
      ws.send(message);
    } catch (error) {
      console.error('Error displaying survey questions:', error);
      ws.send('An error occurred while fetching the survey questions. Please try again later.');
    }
  }

  public async updateProfile(ws: WebSocket, userId: number) {
    const responses = await this.employeeService.getProfileResponses(userId);

    if (responses.length > 0) {
      ws.send('Your profile is already created.');
      return;
    }

    await this.askProfileQuestions(ws, userId);
  }

  public async askProfileQuestions(ws: WebSocket, userId: number, responses: { questionId: number; response: string }[] = [], currentQuestionIndex = 0) {
    const questions = await this.employeeService.getProfileQuestions();

    if (currentQuestionIndex < questions.length) {
      const question = questions[currentQuestionIndex];
      ws.send(question.questionText);
      ws.send(`Options: ${question.options.join(', ')}`);
      currentQuestionIndex++;
      ws.once('message', async (message) => {
        const response = message.toString().trim();
        responses.push({ questionId: question.id!, response });
        await this.askProfileQuestions(ws, userId, responses, currentQuestionIndex);
      });
    } else {
      await this.employeeService.saveProfileResponses(userId, responses);
      ws.send('Your profile has been updated.');
    }
  }
}
