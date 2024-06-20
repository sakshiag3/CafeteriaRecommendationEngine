import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { Role } from '../entity/Role';
import { Notification } from '../entity/Notification'; // Assuming Notification entity

export class UserRepository {
  constructor(private repository: Repository<User>, private roleRepository: Repository<Role>) {}

  async findByUsername(username: string) {
    return this.repository.findOne({ where: { username }, relations: ['role'] });
  }

  async findRoles() {
    return this.roleRepository.find();
  }

  async findRoleByName(name: string) {
    return this.roleRepository.findOne({ where: { name } });
  }

  async save(user: User) {
    return this.repository.save(user);
  }

  async findNotifications(user: User) {
    return this.repository
      .createQueryBuilder('user')
      .relation(User, 'notifications')
      .of(user)
      .loadMany();
  }

  async findAll() {
    return this.repository.find({ relations: ['role'] });
  }
}
