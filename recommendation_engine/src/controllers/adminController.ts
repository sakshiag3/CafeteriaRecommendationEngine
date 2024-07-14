import { WebSocket } from 'ws';
import { AdminService } from '../services/adminService';
import { Util } from '../utils/Util';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  public async viewDiscardList(ws: WebSocket) {
    try {
      const discardList = await this.adminService.getDiscardList();
      const formattedList = Util.formatDiscardListToTable(discardList);
      ws.send(`Discard Menu Item List:\n\n${formattedList}`);
    } catch (error) {
      console.error('Error viewing discard list:', error);
      throw error;
    }
  }

  public async changeAvailability(ws: WebSocket, itemId: number, availability: boolean) {
    try {
      const menuItem = await this.adminService.changeAvailability(itemId, availability);
      ws.send(`Menu item ${menuItem.name} availability changed to ${availability}.`);
    } catch (error) {
      console.error('Error changing availability:', error);
      throw error;
    }
  }
}
