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

  async selectRecommendations(meal: string, selectedItems: number[]): Promise<void> {
    const menuItems = await this.menuItemRepository.find({
      where: selectedItems.map(id => ({ id })),
    });

    const selectedRecommendations = menuItems.map(menuItem => {
      const selected = new SelectedRecommendation();
      selected.menuItem = menuItem;
      selected.meal = meal;
      selected.date = new Date();
      return selected;
    });

    await this.selectedRecommendationRepository.save(selectedRecommendations);
  }

  async getChefSelectionsForDay(date: Date): Promise<SelectedRecommendation[]> {
    return this.selectedRecommendationRepository.find({ where: { date } });
  }

  async getVotes(): Promise<Vote[]> {
    return this.voteRepository.find({
      relations: ['selectedRecommendation', 'selectedRecommendation.menuItem', 'user'],
    });
  }

  async prepareItem(id: number, meal: string): Promise<FinalSelection> {
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
