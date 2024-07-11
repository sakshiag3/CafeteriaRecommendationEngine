import { Repository } from 'typeorm';
import { UserProfileResponse } from '../entity/UserProfileResponse';
import { AppDataSource } from '../data-source';

export class UserProfileResponseRepository {
  private userProfileResponseRepository: Repository<UserProfileResponse>;

  constructor() {
    this.userProfileResponseRepository = AppDataSource.getRepository(UserProfileResponse);
  }

  async saveResponse(response: Partial<UserProfileResponse>): Promise<UserProfileResponse> {
    return this.userProfileResponseRepository.save(response);
  }

  async findResponsesByUser(userId: number): Promise<UserProfileResponse[]> {
    return this.userProfileResponseRepository.find({ where: { user: { id: userId } } });
  }
}
