import { WebSocket } from 'ws';
import { EmployeeService } from '../services/employeeService';
import { Util } from '../utils/Util';

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  public async viewSelectedMenuItems(ws: WebSocket) {
    const { start, end } = await Util.getCurrentDateRange();
    const selectedRecommendations = await this.employeeService.getSelectedMenuItems(start, end);
    const formattedTables = this.employeeService.formatSelectedRecommendationsToTables(selectedRecommendations);
    ws.send(`Selected menu items for today:\n\n${formattedTables}`);
  }
 
  public async viewPreparedMenuItems(ws: WebSocket) {
    const { start, end } = await Util.getCurrentDateRange();
    const finalSelections = await this.employeeService.getPreparedMenuItems(start, end);
    const formattedTables = this.employeeService.formatFinalSelectionsToTables(finalSelections);
    ws.send(`Prepared menu items for today:\n\n${formattedTables}`);
  }

  public async castVote(ws: WebSocket, userId: number, selectedRecommendationId: number, meal: string) {
    const { start, end } = await Util.getCurrentDateRange();
    const message = await this.employeeService.castVote(userId, selectedRecommendationId, meal, start, end);
    ws.send(message);
  }

  public async giveFeedback(ws: WebSocket, userId: number, menuItemId: number, rating: number, comment: string) {
    const message = await this.employeeService.giveFeedback(userId, menuItemId, rating, comment);
    ws.send(message);
  }
}
