import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../data-source';
import { MenuItem } from '../entity/MenuItem';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { Vote } from '../entity/Vote';
import { FinalSelection } from '../entity/FinalSelection';

export class ChefRepository {
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

  findMenuItemById(id: number): Promise<MenuItem | null> {
    return this.menuItemRepository.findOne({ where: { id } });
  }

  saveSelectedRecommendation(selectedRecommendation: SelectedRecommendation): Promise<SelectedRecommendation> {
    return this.selectedRecommendationRepository.save(selectedRecommendation);
  }

  findSelectedRecommendationById(id: number): Promise<SelectedRecommendation | null> {
    return this.selectedRecommendationRepository.findOne({ where: { id }, relations: ['menuItem'] });
  }

  findVotesForDateRange(start: Date, end: Date): Promise<Vote[]> {
    return this.voteRepository.find({
      where: {
        date: Between(start, end),
      },
      relations: ['selectedRecommendation', 'selectedRecommendation.menuItem', 'user'],
    });
  }

  saveFinalSelection(finalSelection: FinalSelection): Promise<FinalSelection> {
    return this.finalSelectionRepository.save(finalSelection);
  }

  findFinalSelectionsForDate(start: Date, end: Date): Promise<FinalSelection[]> {
    return this.finalSelectionRepository.find({
      where: {
        date: Between(start, end),
      },
      relations: ['selectedRecommendation', 'selectedRecommendation.menuItem'],
    });
  }
}
