import { WebSocket } from 'ws';
import { MenuItemRepository } from '../repositories/menuItemRepository';
import { Repository } from 'typeorm';
import { MenuItem } from '../entity/MenuItem';
import { Feedback } from '../entity/Feedback';
import { SentimentScore } from '../entity/SentimentScore';
import { Util } from '../utils/Util';

export class AdminController {
  constructor(
    private menuItemRepository: MenuItemRepository, // Use MenuItemRepository
    private feedbackRepository: Repository<Feedback>,
    private sentimentScoreRepository: Repository<SentimentScore>
  ) {}

  async viewDiscardList(ws: WebSocket) {
    try {
      const discardList = await this.getDiscardList();
      const formattedList = Util.formatDiscardListToTable(discardList);
      ws.send(`Discard Menu Item List:\n\n${formattedList}`);
    } catch (error) {
      console.error('Error viewing discard list:', error);
      const errorMessage = (error as Error).message || 'An unknown error occurred';
      ws.send(`Error viewing discard list: ${errorMessage}. Please try again later.`);
    }
  }

  async getDiscardList() {
    const menuItems = await this.menuItemRepository.findMenuItems(); // Use findMenuItems method
    const discardList = [];

    for (const item of menuItems) {
      if (!item.id) continue; // Ensure item.id is defined
      const avgRating = await this.getAverageRating(item.id);
      const sentimentScore = await this.getSentimentScore(item.id);
      if (avgRating > 0 && avgRating < 2 && sentimentScore > 0 && sentimentScore < 25){ 
        discardList.push({ item, avgRating, sentimentScore });
      }
    }

    return discardList;
  }

  async getAverageRating(menuItemId: number): Promise<number> {
    const feedbacks = await this.feedbackRepository.find({ where: { menuItem: { id: menuItemId } } });
    const totalRating = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return feedbacks.length ? totalRating / feedbacks.length : 0;
  }

  async getSentimentScore(menuItemId: number): Promise<number> {
    const sentiments = await this.sentimentScoreRepository.find({ where: { menuItem: { id: menuItemId } } });
    const totalScore = sentiments.reduce((acc, sentiment) => acc + sentiment.score, 0);
    return sentiments.length ? totalScore / sentiments.length : 0;
  }

  async changeAvailability(ws: WebSocket, msg: string) {
    try {
        console.log('Received change availability message:', msg); // Debug statement
        const [itemId, availability] = msg.split(',').map(part => part.trim());
        console.log('Parsed itemId:', itemId, 'availability:', availability); // Debug statement

        const menuItem = await this.menuItemRepository.findById(parseInt(itemId));
        if (menuItem) {
            const availabilityStatus = availability.toLowerCase() === 'true';
            console.log('Setting availability to:', availabilityStatus); // Debug statement
            menuItem.availabilityStatus = availabilityStatus;
            await this.menuItemRepository.save(menuItem);
            console.log('Menu item saved:', menuItem); // Debug statement
            ws.send(`Menu item ${menuItem.name} availability changed to ${availabilityStatus}.`);
        } else {
            ws.send('Menu item not found.');
        }
    } catch (error) {
        console.error('Error changing availability:', error);
        const errorMessage = (error as Error).message || 'An unknown error occurred';
        ws.send(`Error changing availability: ${errorMessage}. Please try again later.`);
    }
}


}
