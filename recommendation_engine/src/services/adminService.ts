import { WebSocket } from 'ws';
import { MenuItemRepository } from '../repositories/menuItemRepository';
import { Util } from '../utils/Util';
import { RecommendationService } from './recommendationService';

export class AdminService {
  private menuItemRepository: MenuItemRepository;

  private recommendationService: RecommendationService;
  constructor() {
    this.menuItemRepository = new MenuItemRepository();
    this.recommendationService = new RecommendationService();
  }

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
    const menuItems = await this.menuItemRepository.findMenuItems(); 
    const discardList = [];

    for (const item of menuItems) {
      if (!item.id) continue; 
      const avgRating = await this.recommendationService.getAverageRating(item.id);
      const sentimentScore = await this.recommendationService.getSentimentScore(item.id);
      if (avgRating > 0 && avgRating < 2 && sentimentScore > 0 && sentimentScore < 25){ 
        discardList.push({ item, avgRating, sentimentScore });
      }
    }

    return discardList;
  }


  async changeAvailability(ws: WebSocket, msg: string) {
    try {
        const [itemId, availability] = msg.split(',').map(part => part.trim());
        console.log('Parsed itemId:', itemId, 'availability:', availability);

        const menuItem = await this.menuItemRepository.findById(parseInt(itemId));
        if (menuItem) {
            const availabilityStatus = availability.toLowerCase() === 'true';
            console.log('Setting availability to:', availabilityStatus); 
            menuItem.availabilityStatus = availabilityStatus;
            await this.menuItemRepository.save(menuItem);
            console.log('Menu item saved:', menuItem);
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
