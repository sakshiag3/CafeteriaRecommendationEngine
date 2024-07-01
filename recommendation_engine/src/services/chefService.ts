import { ChefRepository } from '../repositories/chefRepository';
import { MenuItem } from '../entity/MenuItem';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { Vote } from '../entity/Vote';
import { FinalSelection } from '../entity/FinalSelection';

export class ChefService {
  private chefRepository: ChefRepository;

  constructor() {
    this.chefRepository = new ChefRepository();
  }

  public async selectRecommendations(selectedIdsByMeal: { meal: string; ids: string[] }[]) {
    const selectedRecommendations: { menuItem: MenuItem; meal: string }[] = [];
    for (const { meal, ids } of selectedIdsByMeal) {
      for (const id of ids) {
        const menuItemId = parseInt(id, 10);
        const menuItem = await this.chefRepository.findMenuItemById(menuItemId);
        if (menuItem) {
          selectedRecommendations.push({ menuItem, meal });

          const selectedRecommendation = new SelectedRecommendation();
          selectedRecommendation.menuItem = menuItem;
          selectedRecommendation.meal = meal;
          selectedRecommendation.date = new Date();

          await this.chefRepository.saveSelectedRecommendation(selectedRecommendation);
        }
      }
    }
  }

  public async prepareItem(id: number, meal: string): Promise<FinalSelection> {
    const selectedRecommendation = await this.chefRepository.findSelectedRecommendationById(id);
    if (!selectedRecommendation) {
      throw new Error('Selected recommendation not found');
    }

    const finalSelection = new FinalSelection();
    finalSelection.selectedRecommendation = selectedRecommendation;
    finalSelection.meal = meal;
    finalSelection.date = new Date();

    return this.chefRepository.saveFinalSelection(finalSelection);
  }

  public async getVotesForDateRange(start: Date, end: Date): Promise<Vote[]> {
    return this.chefRepository.findVotesForDateRange(start, end);
  }

  public async getFinalSelectionsForDate(start: Date, end: Date): Promise<FinalSelection[]> {
    return this.chefRepository.findFinalSelectionsForDate(start, end);
  }
}
