import { Repository, MoreThan } from 'typeorm';
import { Notification } from '../entity/Notification';
import { AppDataSource } from '../data-source';

export class NotificationRepository {
  private notificationRepository: Repository<Notification>
  
  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
 }
 
  async findNotificationsByRoleAndTime(roleId: number, lastLoginTime: Date) {
    return this.notificationRepository.find({
      where: { 
        role: { id: roleId }, 
        expiryDate: MoreThan(new Date()), 
        createdAt: MoreThan(lastLoginTime) 
      }
    });
  }

  async createNotification(content: string, roleId: number) {
    const expiryDate = new Date();
    expiryDate.setHours(23, 59, 59, 999); 

    const notification = this.notificationRepository.create({
      content,
      expiryDate,
      role: { id: roleId }
    });
    await this.notificationRepository.save(notification);
    return notification;
  }
}
