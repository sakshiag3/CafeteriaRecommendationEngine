import { AppDataSource } from '../data-source';
import { Between, Repository } from 'typeorm';
import { Recommendation } from '../entity/Recommendation';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { Vote } from '../entity/Vote';
import { FinalSelection } from '../entity/FinalSelection';
import { MenuItem } from '../entity/MenuItem';

export class ChefService {
  private menuItemRepository: Repository<MenuItem>;
  private selectedRecommendationRepository: Repository<SelectedRecommendation>;
  private voteRepository: Repository<Vote>;
  private finalSelectionRepository: Repository<FinalSelection>;

  constructor() {
    this.menuItemRepository = AppDataSource.getRepository(MenuItem);
    this.selectedRecommendationRepository = AppDataSource.getRepository(SelectedRecommendation);
    this.voteRepository = AppDataSource.getRepository(Vote);
    this.finalSelectionRepository = AppDataSource.getRepository(FinalSelection);
  }

  public async selectRecommendations(selectedIdsByMeal: { meal: string; ids: string[] }[]) {
    const selectedRecommendations: { menuItem: MenuItem; meal: string }[] = [];
    for (const { meal, ids } of selectedIdsByMeal) {
      for (const id of ids) {
        const menuItemId = parseInt(id, 10);
        const menuItem = await this.menuItemRepository.findOne({ where: { id: menuItemId } });
        if (menuItem) {
          selectedRecommendations.push({ menuItem, meal });

          const selectedRecommendation = new SelectedRecommendation();
          selectedRecommendation.menuItem = menuItem;
          selectedRecommendation.meal = meal;
          selectedRecommendation.date = new Date();

          await this.selectedRecommendationRepository.save(selectedRecommendation);
        }
      }
    }
  }

  public async prepareItem(id: number, meal: string): Promise<FinalSelection> {
    const selectedRecommendation = await this.selectedRecommendationRepository.findOne({
      where: { id },
      relations: ['menuItem'],
    });
    if (!selectedRecommendation) {
      throw new Error('Selected recommendation not found');
    }

    const finalSelection = new FinalSelection();
    finalSelection.selectedRecommendation = selectedRecommendation;
    finalSelection.meal = meal;
    finalSelection.date = new Date();

    return this.finalSelectionRepository.save(finalSelection);
  }

  public async getVotesForDateRange(start: Date, end: Date): Promise<Vote[]> {
    return this.voteRepository.find({
      where: {
        date: Between(start, end),
      },
      relations: ['selectedRecommendation', 'selectedRecommendation.menuItem', 'user'],
    });
  }

  public async getFinalSelectionsForDate(start: Date, end: Date): Promise<FinalSelection[]> {
    return this.finalSelectionRepository.find({
      where: {
        date: Between(start, end),
      },
      relations: ['selectedRecommendation', 'selectedRecommendation.menuItem'],
    });
  }
}
