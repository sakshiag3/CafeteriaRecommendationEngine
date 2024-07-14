import { MenuItemRepository } from '../repositories/menuItemRepository';
import { DiscardedMenuItemRepository } from '../repositories/discardedMenuItemRepository';
import { QuestionRepository } from '../repositories/questionRepository';
import { RecommendationService } from './recommendationService';
import { MenuItem } from '../entity/MenuItem';

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
    const menuItems = await this.menuItemRepository.findMenuItems();
    const discardList = [];

    for (const item of menuItems) {
      if (!item.id) continue;
      const avgRating = await this.recommendationService.getAverageRating(item.id);
      const sentimentScore = await this.recommendationService.getSentimentScore(item.id);
      if (avgRating > 0 && avgRating < 2 && sentimentScore > 0 && sentimentScore < 25) {
        discardList.push({ item, avgRating, sentimentScore });
      }
    }

    return discardList;
  }

  public async changeAvailability(itemId: number, availability: boolean) {
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
  }

  private async initiateFeedbackForDiscardedItem(menuItem: MenuItem) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    await this.discardedMenuItemRepository.saveDiscardedItem({
      menuItem: menuItem,
      expiresAt: expirationDate,
      createdAt: new Date()
    });

    const questions = [
      'What didn’t you like about ' + menuItem.name + '?',
      'How would you like ' + menuItem.name + ' to taste?',
      'Share your mom’s recipe.',
    ];

    for (const questionText of questions) {
      await this.questionRepository.saveQuestion({ questionText });
    }
  }
}
