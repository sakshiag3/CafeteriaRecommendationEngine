import { Repository } from 'typeorm';
import { Question } from '../entity/Question';
import { AppDataSource } from '../data-source';
import { DiscardedMenuItem } from '../entity/DiscardedMenuItem';

export class QuestionRepository {
  private questionRepository: Repository<Question>;

  constructor() {
    this.questionRepository = AppDataSource.getRepository(Question);
  }

  async saveQuestion(question: Partial<Question>): Promise<Question> {
    return this.questionRepository.save(question);
  }

  async saveQuestionWithDiscardedItem(questionText: string, discardedMenuItem: DiscardedMenuItem): Promise<Question> {
    const question = new Question();
    question.questionText = questionText;
    question.discardedMenuItem = discardedMenuItem;
    return this.questionRepository.save(question);
  }
  
  async findQuestionsByDiscardedMenuItemId(discardedMenuItemId: number): Promise<Question[]> {
    return this.questionRepository.find({
      where: {
        discardedMenuItem: {
          id: discardedMenuItemId,
        },
      },
    });
  }
}
