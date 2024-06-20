import { MoreThan, Repository } from 'typeorm';
import { Notification } from '../entity/Notification';

export class NotificationRepository {
  constructor(private repository: Repository<Notification>) {}

  async findNotificationsByUser(userId: number) {
    return this.repository.find({ where: { user: { id: userId }, expiryDate: MoreThan(new Date()) } });
  }
}
