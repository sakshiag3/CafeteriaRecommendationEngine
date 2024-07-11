import { Repository } from 'typeorm';
import { UserProfileQuestion } from '../entity/UserProfileQuestion';
import { AppDataSource } from '../data-source';

export class UserProfileQuestionRepository {
  private userProfileQuestionRepository: Repository<UserProfileQuestion>;

  constructor() {
    this.userProfileQuestionRepository = AppDataSource.getRepository(UserProfileQuestion);
  }

  async saveQuestion(question: Partial<UserProfileQuestion>): Promise<UserProfileQuestion> {
    return this.userProfileQuestionRepository.save(question);
  }

  async findAllQuestions(): Promise<UserProfileQuestion[]> {
    return this.userProfileQuestionRepository.find();
  }
}
