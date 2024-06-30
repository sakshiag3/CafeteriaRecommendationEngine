import { Repository, MoreThan } from 'typeorm';
import { Notification } from '../entity/Notification';

export class NotificationRepository {
  constructor(private repository: Repository<Notification>) {}

  async findNotificationsByRoleAndTime(roleId: number, lastLoginTime: Date) {
    return this.repository.find({
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

    const notification = this.repository.create({
      content,
      expiryDate,
      role: { id: roleId }
    });
    await this.repository.save(notification);
    return notification;
  }
}
