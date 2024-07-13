import { Repository, Between } from 'typeorm';
import { MenuItem } from '../entity/MenuItem';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { FinalSelection } from '../entity/FinalSelection';
import { Vote } from '../entity/Vote';
import { Feedback } from '../entity/Feedback';
import { FeedbackForm } from '../entity/FeedbackForm';
import { SentimentScore } from '../entity/SentimentScore';
import { AppDataSource } from '../data-source';
import { DiscardedMenuItem } from '../entity/DiscardedMenuItem';
import { Question } from '../entity/Question';
import { UserProfileQuestion } from '../entity/UserProfileQuestion';
import { UserProfileResponse } from '../entity/UserProfileResponse';

export class EmployeeRepository {
  private menuItemRepository: Repository<MenuItem>;
  private selectedRecommendationRepository: Repository<SelectedRecommendation>;
  private finalSelectionRepository: Repository<FinalSelection>;
  private voteRepository: Repository<Vote>;
  private feedbackRepository: Repository<Feedback>;
  private feedbackFormRepository: Repository<FeedbackForm>;
  private sentimentScoreRepository: Repository<SentimentScore>;
  private discardedMenuItemRepository: Repository<DiscardedMenuItem>;
  private questionRepository: Repository<Question>;
  private userProfileQuestionRepository: Repository<UserProfileQuestion>;
  private userProfileResponseRepository: Repository<UserProfileResponse>;

  constructor() {
    this.menuItemRepository = AppDataSource.getRepository(MenuItem);
    this.selectedRecommendationRepository = AppDataSource.getRepository(SelectedRecommendation);
    this.finalSelectionRepository = AppDataSource.getRepository(FinalSelection);
    this.voteRepository = AppDataSource.getRepository(Vote);
    this.feedbackRepository = AppDataSource.getRepository(Feedback);
    this.feedbackFormRepository = AppDataSource.getRepository(FeedbackForm);
    this.sentimentScoreRepository = AppDataSource.getRepository(SentimentScore);
    this.discardedMenuItemRepository = AppDataSource.getRepository(DiscardedMenuItem);
    this.questionRepository = AppDataSource.getRepository(Question);
    this.userProfileQuestionRepository = AppDataSource.getRepository(UserProfileQuestion);
    this.userProfileResponseRepository = AppDataSource.getRepository(UserProfileResponse);
  }

  public findMenuItem(menuItemId: number) {
    return this.menuItemRepository.findOne({ where: { id: menuItemId } });
  }

  public findSelectedRecommendations(start: Date, end: Date) {
    return this.selectedRecommendationRepository.find({
      where: { date: Between(start, end) },
      relations: ['menuItem'],
    });
  }

  public findFinalSelections(start: Date, end: Date) {
    return this.finalSelectionRepository.find({
      where: { date: Between(start, end) },
      relations: ['selectedRecommendation', 'selectedRecommendation.menuItem'],
    });
  }

  public findVote(userId: number, meal: string, start: Date, end: Date) {
    return this.voteRepository.findOne({
      where: { user: { id: userId }, selectedRecommendation: { meal: meal }, date: Between(start, end) },
      relations: ['selectedRecommendation'],
    });
  }

  public saveVote(vote: Vote) {
    return this.voteRepository.save(vote);
  }

  public saveFeedback(feedback: Feedback) {
    return this.feedbackRepository.save(feedback);
  }

  public findSentimentScore(menuItemId: number) {
    return this.sentimentScoreRepository.findOne({ where: { menuItem: { id: menuItemId } } });
  }

  public saveSentimentScore(sentimentScore: SentimentScore) {
    return this.sentimentScoreRepository.save(sentimentScore);
  }

  public findAllDiscardedMenuItems() {
    return this.discardedMenuItemRepository.find();
  }

  public findFeedbackForms(userId: number) {
    return this.feedbackFormRepository.find({
      where: { user: { id: userId } },
      relations: ['discardedMenuItem']
    });
  }

  public findAllQuestions() {
    return this.questionRepository.find();
  }

  public saveFeedbackForm(feedbackForm: FeedbackForm) {
    return this.feedbackFormRepository.save(feedbackForm);
  }

  public findAllProfileQuestions() {
    return this.userProfileQuestionRepository.find();
  }

  public findProfileResponsesByUser(userId: number) {
    return this.userProfileResponseRepository.find({ where: { user: { id: userId } }, relations: ['question'] });
  }

  public saveProfileResponse(response: UserProfileResponse) {
    return this.userProfileResponseRepository.save(response);
  }
}
