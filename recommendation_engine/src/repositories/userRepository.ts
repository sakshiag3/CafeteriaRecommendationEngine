import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { Role } from '../entity/Role';

export class UserRepository {
  constructor(private repository: Repository<User>, private roleRepository: Repository<Role>) {}

  async findByUsername(username: string) {
    return this.repository.findOne({ where: { username }, relations: ['role'] });
  }
  async findRoleByName(name: string) {
    return this.roleRepository.findOne({ where: { name } });
  }

  async save(user: User) {
    return this.repository.save(user);
  }

}
