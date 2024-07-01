import { WebSocket } from 'ws';
import { EmployeeService } from '../services/employeeService';
import { Util } from '../utils/Util';

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  public async viewSelectedMenuItems(ws: WebSocket) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const selectedRecommendations = await this.employeeService.getSelectedMenuItems(start, end);
      const formattedTables = this.employeeService.formatSelectedRecommendationsToTables(selectedRecommendations);
      ws.send(`Selected menu items for today:\n\n${formattedTables}`);
    } catch (error) {
      console.error('Error viewing selected menu items:', error);
      ws.send('An error occurred while fetching the selected menu items. Please try again later.');
    }
  }

  public async viewPreparedMenuItems(ws: WebSocket) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const finalSelections = await this.employeeService.getPreparedMenuItems(start, end);
      const formattedTables = this.employeeService.formatFinalSelectionsToTables(finalSelections);
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
}
