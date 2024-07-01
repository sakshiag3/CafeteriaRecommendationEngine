import { WebSocket } from 'ws';
import { RecommendationService } from '../services/recommendationService';
import { MenuItemService } from '../services/menuItemService';
import { MenuItemRepository } from '../repositories/menuItemRepository';
import { FinalSelection } from '../entity/FinalSelection';
import { ChefService } from '../services/chefService';
import { Util } from '../utils/Util';

export class ChefController {
  private recommendationService: RecommendationService;
  private chefService: ChefService;

  private menuItemService: MenuItemService;
  private menuItemRepository: MenuItemRepository;
  constructor() {
    this.recommendationService = new RecommendationService();
    this.chefService = new ChefService();
    this.menuItemService= new MenuItemService();
    this.menuItemRepository= new MenuItemRepository();
  }

  public async fetchRecommendations(ws: WebSocket) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const existingRecommendations = await this.recommendationService.getRecommendationsByDateRange(start, end);

      if (existingRecommendations.length > 0) {
        const formattedTables = Util.formatRecommendationsToTable(existingRecommendations);
        ws.send(`Recommendations already fetched for today:\n\n${formattedTables}`);
        return;
      }

      const recommendations = await this.recommendationService.fetchRecommendations();

      const formattedTable = Util.formatRecommendationsToTable(recommendations);
      ws.send(`Today's Recommendations:\n\n${formattedTable}`);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      ws.send(`Error fetching recommendations: ${errorMessage}. Please try again later.`);
    }
  }

  public async getSelectedRecommendations(ws: WebSocket, currentStateSetter: (state: string) => void) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const existingSelectedRecommendations = await this.recommendationService.getSelectedRecommendationsByDateRange(start, end);

      if (existingSelectedRecommendations.length > 0) {
        const formattedTables = Util.formatSelectedRecommendationsToTables(existingSelectedRecommendations);
        ws.send(`Recommendations have already been selected for today.\n\n${formattedTables}`);
        currentStateSetter('authenticated');
      } else {
        ws.send('Please enter the IDs of the items you wish to select for Breakfast, separated by commas:');
      }
    } catch (error) {
      console.error('Error fetching selected recommendations:', error);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      ws.send(`Error fetching selected recommendations: ${errorMessage}. Please try again later.`);
      currentStateSetter('authenticated');
    }
  }

  public async selectRecommendations(ws: WebSocket, selectedIdsByMeal: { meal: string; ids: string[] }[]) {
    try {
      await this.chefService.selectRecommendations(selectedIdsByMeal);
      ws.send('Selected recommendations for all meals.');
    } catch (error) {
      console.error('Error selecting recommendations:', error);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      ws.send(`Error selecting recommendations: ${errorMessage}. Please try again later.`);
    }
  }

  public async viewVotes(ws: WebSocket) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const votes = await this.chefService.getVotesForDateRange(start, end);

      const voteCounts = votes.reduce((acc, vote) => {
        const selectedRecommendation = vote.selectedRecommendation;
        const menuItemIdName = `${selectedRecommendation.id} | ${selectedRecommendation.menuItem.name}`;
        if (!acc[menuItemIdName]) {
          acc[menuItemIdName] = 0;
        }
        acc[menuItemIdName]++;
        return acc;
      }, {} as { [key: string]: number });

      const formattedTable = Util.formatVotesToTable(voteCounts);
      ws.send(formattedTable);
    } catch (error) {
      console.error('Error viewing votes:', error);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      ws.send(`Error viewing votes: ${errorMessage}. Please try again later.`);
    }
  }
  async parseMealIds(msg: string): Promise<{ meal: string; id: number; }[]> {
    const [breakfastId, lunchId, dinnerId] = msg.split(',').map(id => parseInt(id.trim(), 10));
    return [
      { meal: 'Breakfast', id: breakfastId },
      { meal: 'Lunch', id: lunchId },
      { meal: 'Dinner', id: dinnerId }
    ];
  }
  
  public async getSelectedRecommendationsByDateRange(start: Date, end: Date) {
    return this.recommendationService.getSelectedRecommendationsByDateRange(start, end);
  }

  public async prepareFinalSelection(ws: WebSocket, selectedRecommendationId: number, meal: string) {
    try {
      await this.chefService.prepareItem(selectedRecommendationId, meal);
      ws.send(`Final selection for ${meal} has been saved.`);
    } catch (error) {
      console.error('Error preparing final selection:', error);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      ws.send(`Error preparing final selection: ${errorMessage}. Please try again later.`);
    }
  }

  public async selectItemToPrepare(ws: WebSocket, selectedIds: { meal: string, id: number }[]) {
    try {
      const { start, end } = await Util.getCurrentDateRange();
      const existingFinalSelections = await this.getFinalSelectionsForDate(start, end);

      for (const { meal, id } of selectedIds) {
        if (existingFinalSelections.some(selection => selection.selectedRecommendation.id === id)) {
          ws.send(`Item to prepare for ${meal} has already been selected for today.`);
          continue;
        }

        const finalSelection = await this.chefService.prepareItem(id, meal);
        ws.send(`Item to prepare for ${meal}: ${finalSelection.selectedRecommendation.menuItem.name}`);
      }
    } catch (error) {
      console.error('Error selecting item to prepare:', error);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      ws.send(`Error selecting item to prepare: ${errorMessage}. Please try again later.`);
    }
  }

  public async getFinalSelectionsForDate(start: Date, end: Date): Promise<FinalSelection[]> {
    return this.chefService.getFinalSelectionsForDate(start, end);
  }
}
