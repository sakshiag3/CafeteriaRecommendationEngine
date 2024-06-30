import { Repository, Between } from 'typeorm';
import { MenuItem } from '../entity/MenuItem';
import { FoodCategory } from '../entity/FoodCategory';
import { Recommendation } from '../entity/Recommendation';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { Feedback } from '../entity/Feedback';
import { SentimentScore } from '../entity/SentimentScore';

export class RecommendationService {
  constructor(
    private recommendationRepository: Repository<Recommendation>,
    private selectedRecommendationRepository: Repository<SelectedRecommendation>,
    private feedbackRepository: Repository<Feedback>,
    private sentimentScoreRepository: Repository<SentimentScore>
  ) {}

  async fetchRecommendations(
    menuItemRepository: Repository<MenuItem>,
    foodCategoryRepository: Repository<FoodCategory>
  ): Promise<any[]> {
    const breakfastCategory = await foodCategoryRepository.findOne({ where: { name: 'Breakfast' } });
    const lunchCategory = await foodCategoryRepository.findOne({ where: { name: 'Lunch' } });
    const dinnerCategory = await foodCategoryRepository.findOne({ where: { name: 'Dinner' } });

    if (!breakfastCategory || !lunchCategory || !dinnerCategory) {
      throw new Error('One or more food categories not found');
    }

    const breakfastItems = await this.getMenuItemsWithScores(menuItemRepository, breakfastCategory);
    const lunchItems = await this.getMenuItemsWithScores(menuItemRepository, lunchCategory);
    const dinnerItems = await this.getMenuItemsWithScores(menuItemRepository, dinnerCategory);

    const recommendations = [
      ...this.getTopItems(breakfastItems, 2, 'Breakfast'),
      ...this.getTopItems(lunchItems, 2, 'Lunch'),
      ...this.getTopItems(dinnerItems, 2, 'Dinner')
    ];

    // Save the recommendations
    for (const rec of recommendations) {
      const recommendation = new Recommendation();
      recommendation.menuItem = rec.menuItem;
      recommendation.meal = rec.meal.toLowerCase();
      recommendation.date = new Date();
      await this.saveRecommendation(recommendation);
    }

    return recommendations.map(item => ({
      menuItem: item.menuItem,
      avgRating: item.avgRating,
      sentimentScore: item.sentimentScore,
      meal: item.meal
    }));
  }

  private async getMenuItemsWithScores(menuItemRepository: Repository<MenuItem>, category: FoodCategory) {
    const menuItems = await menuItemRepository.find({ where: { category } });
    const itemsWithScores = [];

    for (const item of menuItems) {
      if (item.id === undefined) continue;

      const avgRating = await this.getAverageRating(item.id);
      const sentimentScore = await this.getSentimentScore(item.id);
      itemsWithScores.push({ menuItem: item, avgRating, sentimentScore, meal: category.name.toLowerCase() });
    }

    return itemsWithScores;
  }

  private async getAverageRating(menuItemId: number): Promise<number> {
    const feedbacks = await this.feedbackRepository.find({ where: { menuItem: { id: menuItemId } } });
    const totalRating = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return feedbacks.length ? totalRating / feedbacks.length : 0;
  }

  private async getSentimentScore(menuItemId: number): Promise<number> {
    const sentiments = await this.sentimentScoreRepository.find({ where: { menuItem: { id: menuItemId } } });
    const totalScore = sentiments.reduce((acc, sentiment) => acc + sentiment.score, 0);
    return sentiments.length ? totalScore / sentiments.length : 0;
  }

  private getTopItems(items: any[], count: number, meal: string) {
    return items
      .sort((a, b) => b.avgRating - a.avgRating || b.sentimentScore - a.sentimentScore)
      .slice(0, count)
      .map(item => ({ ...item, meal }));
  }

  async getRecommendationById(id: number): Promise<Recommendation | null> {
    try {
      const recommendation = await this.recommendationRepository.findOne({ where: { id } });
      return recommendation || null;
    } catch (error) {
      console.error(`Error fetching recommendation by ID ${id}:`, error);
      return null;
    }
  }

  async saveRecommendation(recommendation: Recommendation) {
    return this.recommendationRepository.save(recommendation);
  }

  async saveSelectedRecommendation(selectedRecommendation: SelectedRecommendation) {
    return this.selectedRecommendationRepository.save(selectedRecommendation);
  }

  async getRecommendationByMenuItemId(menuItemId: number): Promise<Recommendation | null> {
    try {
      const recommendation = await this.recommendationRepository.findOne({ where: { menuItem: { id: menuItemId } } });
      return recommendation || null;
    } catch (error) {
      console.error(`Error fetching recommendation by MenuItem ID ${menuItemId}:`, error);
      return null;
    }
  }

  async getRecommendationsByDateRange(start: Date, end: Date): Promise<any[]> {
    const recommendations = await this.recommendationRepository.find({
      where: {
        date: Between(start, end)
      },
      relations: ['menuItem', 'menuItem.category']
    });

    const recommendationsWithScores = [];

    for (const recommendation of recommendations) {
      const avgRating = await this.getAverageRating(recommendation.menuItem.id!);
      const sentimentScore = await this.getSentimentScore(recommendation.menuItem.id!);

      recommendationsWithScores.push({
        menuItem: recommendation.menuItem,
        avgRating,
        sentimentScore,
        meal: recommendation.meal
      });
    }

    return recommendationsWithScores;
  }

  async getSelectedRecommendationsByDateRange(start: Date, end: Date): Promise<SelectedRecommendation[]> {
    return this.selectedRecommendationRepository.find({
      where: {
        date: Between(start, end)
      },
      relations: ['menuItem', 'menuItem.category']
    });
  }
}
