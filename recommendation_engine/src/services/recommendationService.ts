import { RecommendationRepository } from '../repositories/recommendationRepository';
import { Recommendation } from '../entity/Recommendation';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { MenuItem } from '../entity/MenuItem';
import { FoodCategory } from '../entity/FoodCategory';
import { TOP_ITEM_COUNT } from '../utils/Constants';
export class RecommendationService {
  private recommendationRepository: RecommendationRepository;

  constructor() {
    this.recommendationRepository = new RecommendationRepository();
  }
  async fetchRecommendations(): Promise<any[]> {
    try {
      const breakfastCategory = await this.recommendationRepository.findCategoryByName('Breakfast');
      const lunchCategory = await this.recommendationRepository.findCategoryByName('Lunch');
      const dinnerCategory = await this.recommendationRepository.findCategoryByName('Dinner');

      if (!breakfastCategory || !lunchCategory || !dinnerCategory) {
        throw new Error('One or more food categories not found');
      }

      const breakfastItems = await this.getMenuItemsWithScores(breakfastCategory);
      const lunchItems = await this.getMenuItemsWithScores(lunchCategory);
      const dinnerItems = await this.getMenuItemsWithScores(dinnerCategory);

      const recommendations = [
        ...this.getTopItems(breakfastItems, TOP_ITEM_COUNT, 'Breakfast'),
        ...this.getTopItems(lunchItems, TOP_ITEM_COUNT, 'Lunch'),
        ...this.getTopItems(dinnerItems, TOP_ITEM_COUNT, 'Dinner')
      ];
      for (const rec of recommendations) {
        const recommendation = new Recommendation();
        recommendation.menuItem = rec.menuItem;
        recommendation.meal = rec.meal.toLowerCase();
        recommendation.date = new Date();
        await this.recommendationRepository.saveRecommendation(recommendation);
      }

      return recommendations.map(item => ({
        menuItem: item.menuItem,
        avgRating: item.avgRating,
        sentimentScore: item.sentimentScore,
        meal: item.meal
      }));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new Error('Error fetching recommendations');
    }
  }

  private async getMenuItemsWithScores(category: FoodCategory) {
    try {
      const menuItems = await this.recommendationRepository.findMenuItemsByCategory(category);
      const itemsWithScores = [];

      for (const item of menuItems) {
        if (item.id === undefined) continue;

        const avgRating = await this.getAverageRating(item.id);
        const sentimentScore = await this.getSentimentScore(item.id);
        itemsWithScores.push({ menuItem: item, avgRating, sentimentScore, meal: category.name.toLowerCase() });
      }

      return itemsWithScores;
    } catch (error) {
      console.error('Error getting menu items with scores:', error);
      throw new Error('Error getting menu items with scores');
    }
  }

  async getAverageRating(menuItemId: number): Promise<number> {
    try {
      const feedbacks = await this.recommendationRepository.findFeedbackByMenuItemId(menuItemId);
      const totalRating = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
      return feedbacks.length ? totalRating / feedbacks.length : 0;
    } catch (error) {
      console.error('Error getting average rating:', error);
      throw new Error('Error getting average rating');
    }
  }

  async getSentimentScore(menuItemId: number): Promise<number> {
    try {
      const sentiments = await this.recommendationRepository.findSentimentScoreByMenuItemId(menuItemId);
      const totalScore = sentiments.reduce((acc, sentiment) => acc + sentiment.score, 0);
      return sentiments.length ? totalScore / sentiments.length : 0;
    } catch (error) {
      console.error('Error getting sentiment score:', error);
      throw new Error('Error getting sentiment score');
    }
  }
  getTopItems(items: any[], count: number, meal: string) {
    return items
      .sort((item1, item2) => 
        item2.avgRating - item1.avgRating || item2.sentimentScore - item1.sentimentScore
      )
      .slice(0, count)
      .map(item => ({ ...item, meal }));
  }  

  async getRecommendationById(id: number): Promise<Recommendation | null> {
    try {
      return await this.recommendationRepository.findRecommendationById(id);
    } catch (error) {
      console.error(`Error fetching recommendation by ID ${id}:`, error);
      throw new Error('Error fetching recommendation by ID');
    }
  }

  async getRecommendationsByDateRange(start: Date, end: Date): Promise<any[]> {
    try {
      const recommendations = await this.recommendationRepository.findRecommendationsByDateRange(start, end);

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
    } catch (error) {
      console.error('Error getting recommendations by date range:', error);
      throw new Error('Error getting recommendations by date range');
    }
  }

  async getSelectedRecommendationsByDateRange(start: Date, end: Date): Promise<SelectedRecommendation[]> {
    try {
      return await this.recommendationRepository.findSelectedRecommendationsByDateRange(start, end);
    } catch (error) {
      console.error('Error getting selected recommendations by date range:', error);
      throw new Error('Error getting selected recommendations by date range');
    }
  }
}
