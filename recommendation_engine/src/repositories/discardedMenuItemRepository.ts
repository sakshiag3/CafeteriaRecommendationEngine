import { Repository } from 'typeorm';
import { DiscardedMenuItem } from '../entity/DiscardedMenuItem';
import { AppDataSource } from '../data-source';
import { MenuItem } from '../entity/MenuItem'; 

export class DiscardedMenuItemRepository {
  private discardedMenuItemRepository: Repository<DiscardedMenuItem>;

  constructor() {
    this.discardedMenuItemRepository = AppDataSource.getRepository(DiscardedMenuItem);
  }

  async saveDiscardedItem(discardedItem: DiscardedMenuItem): Promise<DiscardedMenuItem> {
    return this.discardedMenuItemRepository.save(discardedItem);
  }

  async saveDiscardedMenuItem(menuItem: MenuItem, expiresAt: Date, createdAt: Date): Promise<DiscardedMenuItem> {
    const discardedMenuItem = new DiscardedMenuItem();
    discardedMenuItem.menuItem = menuItem;
    discardedMenuItem.expiresAt = expiresAt;
    discardedMenuItem.createdAt = createdAt;
    return this.discardedMenuItemRepository.save(discardedMenuItem);
  }

  async findByMenuItemId(menuItemId: number): Promise<DiscardedMenuItem | undefined> {
    const discardedMenuItem = await this.discardedMenuItemRepository.findOne({ where: { menuItem: { id: menuItemId } } });
    return discardedMenuItem ?? undefined;
  }

  async findAll(): Promise<DiscardedMenuItem[]> {
    return this.discardedMenuItemRepository.find();
  }
}
