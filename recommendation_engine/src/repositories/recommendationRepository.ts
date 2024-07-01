import { EntityRepository, Repository, Between } from 'typeorm';
import { Recommendation } from '../entity/Recommendation';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { Feedback } from '../entity/Feedback';
import { SentimentScore } from '../entity/SentimentScore';
import { MenuItem } from '../entity/MenuItem';
import { FoodCategory } from '../entity/FoodCategory';
import { AppDataSource } from '../data-source';

export class RecommendationRepository {
  private recommendationRepo: Repository<Recommendation>;
  private selectedRecommendationRepo: Repository<SelectedRecommendation>;
  private feedbackRepo: Repository<Feedback>;
  private sentimentScoreRepo: Repository<SentimentScore>;
  private menuItemRepo: Repository<MenuItem>;

  constructor() {
    this.recommendationRepo = AppDataSource.getRepository(Recommendation);
    this.selectedRecommendationRepo = AppDataSource.getRepository(SelectedRecommendation);
    this.feedbackRepo = AppDataSource.getRepository(Feedback);
    this.sentimentScoreRepo = AppDataSource.getRepository(SentimentScore);
    this.menuItemRepo = AppDataSource.getRepository(MenuItem);
  }

  async findCategoryByName(name: string): Promise<FoodCategory | null> {
    try {
      const category = await this.menuItemRepo.manager.findOne(FoodCategory, { where: { name } });
      return category || null;
    } catch (error) {
      console.error('Error finding category by name:', error);
      throw new Error('Error finding category by name');
    }
  }

  async findMenuItemsByCategory(category: FoodCategory): Promise<MenuItem[]> {
    try {
      return await this.menuItemRepo.find({ where: { category }, relations: ['category'] });
    } catch (error) {
      console.error('Error finding menu items by category:', error);
      throw new Error('Error finding menu items by category');
    }
  }

  async findByName(name: string): Promise<MenuItem | null> {
    try {
      const menuItem = await this.menuItemRepo.findOne({ where: { name } });
      return menuItem || null;
    } catch (error) {
      console.error('Error finding menu item by name:', error);
      throw new Error('Error finding menu item by name');
    }
  }

  async findMenuItemById(id: number): Promise<MenuItem | null> {
    try {
      const menuItem = await this.menuItemRepo.findOne({ where: { id } });
      return menuItem || null;
    } catch (error) {
      console.error('Error finding menu item by ID:', error);
      throw new Error('Error finding menu item by ID');
    }
  }

  async findFeedbackByMenuItemId(menuItemId: number): Promise<Feedback[]> {
    try {
      return await this.feedbackRepo.find({ where: { menuItem: { id: menuItemId } } });
    } catch (error) {
      console.error('Error finding feedback by menu item ID:', error);
      throw new Error('Error finding feedback by menu item ID');
    }
  }

  async findSentimentScoreByMenuItemId(menuItemId: number): Promise<SentimentScore[]> {
    try {
      return await this.sentimentScoreRepo.find({ where: { menuItem: { id: menuItemId } } });
    } catch (error) {
      console.error('Error finding sentiment score by menu item ID:', error);
      throw new Error('Error finding sentiment score by menu item ID');
    }
  }

  async saveRecommendation(recommendation: Recommendation): Promise<Recommendation> {
    try {
      return await this.recommendationRepo.save(recommendation);
    } catch (error) {
      console.error('Error saving recommendation:', error);
      throw new Error('Error saving recommendation');
    }
  }

  async saveSelectedRecommendation(selectedRecommendation: SelectedRecommendation): Promise<SelectedRecommendation> {
    try {
      return await this.selectedRecommendationRepo.save(selectedRecommendation);
    } catch (error) {
      console.error('Error saving selected recommendation:', error);
      throw new Error('Error saving selected recommendation');
    }
  }

  async findRecommendationById(id: number): Promise<Recommendation | null> {
    try {
      const recommendation = await this.recommendationRepo.findOne({ where: { id } });
      return recommendation || null;
    } catch (error) {
      console.error('Error finding recommendation by ID:', error);
      throw new Error('Error finding recommendation by ID');
    }
  }

  async findRecommendationsByDateRange(start: Date, end: Date): Promise<Recommendation[]> {
    try {
      return await this.recommendationRepo.find({
        where: { date: Between(start, end) },
        relations: ['menuItem', 'menuItem.category']
      });
    } catch (error) {
      console.error('Error finding recommendations by date range:', error);
      throw new Error('Error finding recommendations by date range');
    }
  }

  async findSelectedRecommendationsByDateRange(start: Date, end: Date): Promise<SelectedRecommendation[]> {
    try {
      return await this.selectedRecommendationRepo.find({
        where: { date: Between(start, end) },
        relations: ['menuItem', 'menuItem.category']
      });
    } catch (error) {
      console.error('Error finding selected recommendations by date range:', error);
      throw new Error('Error finding selected recommendations by date range');
    }
  }

  async getCategories(): Promise<FoodCategory[]> {
    try {
      return await this.menuItemRepo.manager.find(FoodCategory);
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Error getting categories');
    }
  }

  async saveMenuItem(menuItem: MenuItem): Promise<MenuItem> {
    try {
      return await this.menuItemRepo.save(menuItem);
    } catch (error) {
      console.error('Error saving menu item:', error);
      throw new Error('Error saving menu item');
    }
  }
}
