import { Repository } from 'typeorm';
import { Question } from '../entity/Question';
import { AppDataSource } from '../data-source';

export class QuestionRepository {
  private questionRepository: Repository<Question>;

  constructor() {
    this.questionRepository = AppDataSource.getRepository(Question);
  }

  async saveQuestion(question: Partial<Question>): Promise<Question> {
    return this.questionRepository.save(question);
  }

  async findAllQuestions(): Promise<Question[]> {
    return this.questionRepository.find();
  }
}
