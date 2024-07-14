import { MenuItemRepository } from '../repositories/menuItemRepository';
import { DiscardedMenuItemRepository } from '../repositories/discardedMenuItemRepository';
import { QuestionRepository } from '../repositories/questionRepository';
import { RecommendationService } from './recommendationService';
import { MenuItem } from '../entity/MenuItem';
import {
  FEEDBACK_EXPIRATION_DAYS,
  DISLIKE_THRESHOLD_RATING,
  DISLIKE_THRESHOLD_SENTIMENT,
  FEEDBACK_QUESTION_1,
  FEEDBACK_QUESTION_2,
  FEEDBACK_QUESTION_3,
  FEEDBACK_QUESTION_4
} from '../utils/Constants';

export class AdminService {
  private menuItemRepository: MenuItemRepository;
  private discardedMenuItemRepository: DiscardedMenuItemRepository;
  private questionRepository: QuestionRepository;
  private recommendationService: RecommendationService;

  constructor() {
    this.menuItemRepository = new MenuItemRepository();
    this.discardedMenuItemRepository = new DiscardedMenuItemRepository();
    this.questionRepository = new QuestionRepository();
    this.recommendationService = new RecommendationService();
  }

  public async getDiscardList() {
    try {
      const menuItems = await this.menuItemRepository.findMenuItems();
      const discardList = [];

      for (const item of menuItems) {
        if (!item.id) continue;

        const avgRating = await this.recommendationService.getAverageRating(item.id);
        const sentimentScore = await this.recommendationService.getSentimentScore(item.id);

        if (
          avgRating > 0 && avgRating < DISLIKE_THRESHOLD_RATING &&
          sentimentScore > 0 && sentimentScore < DISLIKE_THRESHOLD_SENTIMENT
        ) {
          discardList.push({ item, avgRating, sentimentScore });
        }
      }

      return discardList;
    } catch (error) {
      console.error('Error getting discard list:', error);
      throw new Error('Failed to get discard list.');
    }
  }

  public async changeAvailability(itemId: number, availability: boolean) {
    try {
      const menuItem = await this.menuItemRepository.findById(itemId);

      if (menuItem) {
        menuItem.availabilityStatus = availability;
        await this.menuItemRepository.save(menuItem);

        if (!availability) {
          await this.initiateFeedbackForDiscardedItem(menuItem);
        }
        return menuItem;
      } else {
        throw new Error('Menu item not found.');
      }
    } catch (error) {
      console.error(`Error changing availability for item ${itemId}:`, error);
      throw new Error('Failed to change availability.');
    }
  }

  private async initiateFeedbackForDiscardedItem(menuItem: MenuItem) {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + FEEDBACK_EXPIRATION_DAYS);

      await this.discardedMenuItemRepository.saveDiscardedItem({
        menuItem: menuItem,
        expiresAt: expirationDate,
        createdAt: new Date()
      });

      const questions = [
        `${FEEDBACK_QUESTION_1}${menuItem.name}?`,
        `${FEEDBACK_QUESTION_2}${menuItem.name}${FEEDBACK_QUESTION_3}`,
        FEEDBACK_QUESTION_4,
      ];

      for (const questionText of questions) {
        await this.questionRepository.saveQuestion({ questionText });
      }
    } catch (error) {
      console.error('Error initiating feedback for discarded item:', error);
      throw new Error('Failed to initiate feedback.');
    }
  }
}
