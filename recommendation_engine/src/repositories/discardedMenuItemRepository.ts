import { Repository } from 'typeorm';
import { DiscardedMenuItem } from '../entity/DiscardedMenuItem';
import { AppDataSource } from '../data-source';

export class DiscardedMenuItemRepository {
  private discardedMenuItemRepository: Repository<DiscardedMenuItem>;

  constructor() {
    this.discardedMenuItemRepository = AppDataSource.getRepository(DiscardedMenuItem);
  }

  async saveDiscardedItem(discardedItem: DiscardedMenuItem): Promise<DiscardedMenuItem> {
    return this.discardedMenuItemRepository.save(discardedItem);
  }

  async findByMenuItemId(menuItemId: number): Promise<DiscardedMenuItem | undefined> {
    const discardedMenuItem = await this.discardedMenuItemRepository.findOne({ where: { menuItem: { id: menuItemId } } });
    return discardedMenuItem ?? undefined;
  }

  async findAll(): Promise<DiscardedMenuItem[]> {
    return this.discardedMenuItemRepository.find();
  }
}
