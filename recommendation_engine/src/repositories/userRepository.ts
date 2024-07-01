import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { Role } from '../entity/Role';
import { Notification } from '../entity/Notification';

import { AppDataSource } from '../data-source';
export class UserRepository {
  private userRepository: Repository<User>
  private roleRepository: Repository<Role>
  
  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
 }
 
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['role'],
    });
  }

  async findRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  // async findNotifications(user: User): Promise<Notification[]> {
  //   return this.notificationRepository.find({
  //     where: { user: { id: user.id } },
  //     relations: ['user'],
  //   });
  // }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['role'] });
  }
}
