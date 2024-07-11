import { Repository, Between } from 'typeorm';
import { MenuItem } from '../entity/MenuItem';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { FinalSelection } from '../entity/FinalSelection';
import { Vote } from '../entity/Vote';
import { Feedback } from '../entity/Feedback';
import { FeedbackForm } from '../entity/FeedbackForm';
import { User } from '../entity/User';
import SentimentAnalyzer from './sentimentAnalyzer';
import { SentimentScore } from '../entity/SentimentScore';
import { AppDataSource } from '../data-source';
import { DiscardedMenuItemRepository } from '../repositories/discardedMenuItemRepository';
import { QuestionRepository } from '../repositories/questionRepository';
import { Question } from '../entity/Question';
import { UserProfileQuestion } from '../entity/UserProfileQuestion';
import { UserProfileResponse } from '../entity/UserProfileResponse';
import { UserProfileQuestionRepository } from '../repositories/UserProfileQuestionRepository';
import { UserProfileResponseRepository } from '../repositories/UserProfileResponseRepository';

export class EmployeeService {
  private sentimentAnalyzer: SentimentAnalyzer;
  private selectedRecommendationRepository: Repository<SelectedRecommendation>;
  private finalSelectionRepository: Repository<FinalSelection>;
  private voteRepository: Repository<Vote>;
  private feedbackRepository: Repository<Feedback>;
  private feedbackFormRepository: Repository<FeedbackForm>;
  private sentimentScoreRepository: Repository<SentimentScore>;
  private menuItemRepository: Repository<MenuItem>;
  private discardedMenuItemRepository: DiscardedMenuItemRepository;
  private questionRepository: QuestionRepository;
  private userProfileQuestionRepository: UserProfileQuestionRepository;
  private userProfileResponseRepository: UserProfileResponseRepository;

  constructor() {
    this.feedbackRepository = AppDataSource.getRepository(Feedback);
    this.feedbackFormRepository = AppDataSource.getRepository(FeedbackForm);
    this.sentimentScoreRepository = AppDataSource.getRepository(SentimentScore);
    this.menuItemRepository = AppDataSource.getRepository(MenuItem);
    this.selectedRecommendationRepository = AppDataSource.getRepository(SelectedRecommendation);
    this.voteRepository = AppDataSource.getRepository(Vote);
    this.finalSelectionRepository = AppDataSource.getRepository(FinalSelection);
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.discardedMenuItemRepository = new DiscardedMenuItemRepository();
    this.questionRepository = new QuestionRepository();
    this.userProfileQuestionRepository = new UserProfileQuestionRepository();
    this.userProfileResponseRepository = new UserProfileResponseRepository();
  }

  public async getSelectedMenuItems(start: Date, end: Date) {
    return this.selectedRecommendationRepository.find({
      where: { date: Between(start, end) },
      relations: ['menuItem'],
    });
  }

  public async checkMenuItemExists(menuItemId: number) {
    const menuItem = await this.menuItemRepository.findOne({ where: { id: menuItemId } });
    return !!menuItem;
  }

  public async getPreparedMenuItems(start: Date, end: Date) {
    return this.finalSelectionRepository.find({
      where: { date: Between(start, end) },
      relations: ['selectedRecommendation', 'selectedRecommendation.menuItem'],
    });
  }

  public async castVote(userId: number, selectedRecommendationId: number, meal: string, start: Date, end: Date) {
    const existingVote = await this.voteRepository.findOne({
      where: { user: { id: userId }, selectedRecommendation: { meal: meal }, date: Between(start, end) },
      relations: ['selectedRecommendation'],
    });

    if (existingVote) {
      return `You have already voted for ${meal} today.`;
    }

    const vote = new Vote();
    vote.user = { id: userId } as User;
    vote.selectedRecommendation = { id: selectedRecommendationId } as SelectedRecommendation;
    vote.date = new Date();
    await this.voteRepository.save(vote);
    return `Your vote for ${meal} has been cast.`;
  }

  public async giveFeedback(userId: number, menuItemId: number, rating: number, comment: string) {
    if (rating < 1 || rating > 5) {
      return "Rating should be in between 1 and 5";
    }

    const feedback = new Feedback();
    feedback.user = { id: userId } as User;
    feedback.menuItem = { id: menuItemId } as MenuItem;
    feedback.rating = rating;
    feedback.comment = comment;
    feedback.date = new Date();
    await this.feedbackRepository.save(feedback);

    const sentimentScore = await this.sentimentAnalyzer.analyzeSentiment(comment);
    const existingSentiment = await this.sentimentScoreRepository.findOne({
      where: { menuItem: { id: menuItemId } }
    });

    if (existingSentiment) {
      existingSentiment.score = (existingSentiment.score + sentimentScore) / 2;
      await this.sentimentScoreRepository.save(existingSentiment);
    } else {
      const sentiment = new SentimentScore();
      sentiment.menuItem = { id: menuItemId } as MenuItem;
      sentiment.score = sentimentScore;
      sentiment.date = new Date();
      await this.sentimentScoreRepository.save(sentiment);
    }
    return 'Your Feedback has been recorded';
  }

  public async getSurveys(userId: number) {
    const discardedItems = await this.discardedMenuItemRepository.findAll();

    const feedbackForms = await this.feedbackFormRepository.find({
      where: { user: { id: userId } },
      relations: ['discardedMenuItem']
    });

    const completedSurveyIds = feedbackForms.map(form => form.discardedMenuItem.id);
    const surveys = discardedItems.filter(item => !completedSurveyIds.includes(item.id));

    return surveys;
  }

  public formatSurveysToTable(surveys: any[]) {
    let table = 'Surveys:\n';
    table += '+----+-----------------+--------------------+-------+\n';
    table += '| ID | Name            | Description        | Price |\n';
    table += '+----+-----------------+--------------------+-------+\n';
    surveys.forEach((item) => {
      table += `| ${String(item.id).padEnd(2)} | ${item.menuItem.name.padEnd(15)} | ${item.menuItem.description.padEnd(18)} | ${String(item.menuItem.price).padEnd(5)} |\n`;
    });
    table += '+----+-----------------+--------------------+-------+\n';
    return table;
  }

  public async getSurveyQuestions(): Promise<Question[]> {
    return this.questionRepository.findAllQuestions();
  }

  public async submitSurvey(userId: number, menuItemId: number, responses: string[]) {
    const discardedItem = await this.discardedMenuItemRepository.findByMenuItemId(menuItemId);

    if (!discardedItem) {
      return 'No feedback form available for this item.';
    }

    const questions = await this.getSurveyQuestions();

    for (let i = 0; i < questions.length; i++) {
      const feedbackForm = new FeedbackForm();
      feedbackForm.user = { id: userId } as User;
      feedbackForm.discardedMenuItem = discardedItem;
      feedbackForm.question = { id: questions[i].id } as Question;
      feedbackForm.response = responses[i];
      await this.feedbackFormRepository.save(feedbackForm);
    }

    return 'Thank you for your feedback!';
  }

  public formatSelectedRecommendationsToTables(recommendations: SelectedRecommendation[]) {
    const breakfastItems = recommendations.filter(r => r.meal === 'Breakfast');
    const lunchItems = recommendations.filter(r => r.meal === 'Lunch');
    const dinnerItems = recommendations.filter(r => r.meal === 'Dinner');

    const formatTable = (title: string, items: SelectedRecommendation[]) => {
      let table = `${title}:\n`;
      table += '+----+-----------------+--------------------+-------+------------+\n';
      table += '| ID | Name            | Description        | Price | Available  |\n';
      table += '+----+-----------------+--------------------+-------+------------+\n';
      items.forEach((item) => {
        const availabilityStatus = item.menuItem.availabilityStatus ? 'Yes' : 'No';
        table += `| ${String(item.id).padEnd(2)} | ${item.menuItem.name.padEnd(15)} | ${item.menuItem.description.padEnd(18)} | ${String(item.menuItem.price).padEnd(5)} | ${availabilityStatus.padEnd(10)} |\n`;
      });
      table += '+----+-----------------+--------------------+-------+------------+\n';
      return table;
    };

    const breakfastTable = formatTable('Breakfast', breakfastItems);
    const lunchTable = formatTable('Lunch', lunchItems);
    const dinnerTable = formatTable('Dinner', dinnerItems);

    return `${breakfastTable}\n${lunchTable}\n${dinnerTable}`;
  }

  public formatFinalSelectionsToTables(finalSelections: FinalSelection[]) {
    const breakfastItems = finalSelections.filter(r => r.selectedRecommendation.meal === 'Breakfast');
    const lunchItems = finalSelections.filter(r => r.selectedRecommendation.meal === 'Lunch');
    const dinnerItems = finalSelections.filter(r => r.selectedRecommendation.meal === 'Dinner');

    const formatTable = (title: string, items: FinalSelection[]) => {
      let table = `${title}:\n`;
      table += '+----+-----------------+--------------------+-------+-------+\n';
      table += '| ID | Name            | Description        | Price |\n';
      table += '+----+-----------------+--------------------+-------+-------+\n';
      items.forEach((item) => {
        table += `| ${String(item.id).padEnd(2)} | ${item.selectedRecommendation.menuItem.name.padEnd(15)} | ${item.selectedRecommendation.menuItem.description.padEnd(18)} | ${String(item.selectedRecommendation.menuItem.price).padEnd(5)} |\n`;
      });
      table += '+----+-----------------+--------------------+-------+-------+\n';
      return table;
    };

    const breakfastTable = formatTable('Breakfast', breakfastItems);
    const lunchTable = formatTable('Lunch', lunchItems);
    const dinnerTable = formatTable('Dinner', dinnerItems);

    return `${breakfastTable}\n${lunchTable}\n${dinnerTable}`;
  }

  public async getProfileQuestions(): Promise<UserProfileQuestion[]> {
    return this.userProfileQuestionRepository.findAllQuestions();
  }

  public async getProfileResponses(userId: number): Promise<UserProfileResponse[]> {
    return this.userProfileResponseRepository.findResponsesByUser(userId);
  }

  public async saveProfileResponses(userId: number, responses: { questionId: number; response: string }[]) {
    for (const res of responses) {
      const response = new UserProfileResponse();
      response.user = { id: userId } as User;
      response.question = { id: res.questionId } as UserProfileQuestion;
      response.response = res.response;
      await this.userProfileResponseRepository.saveResponse(response);
    }
  }

  public async recommendMenuItems(userId: number, menuItems: MenuItem[]): Promise<MenuItem[]> {
    const responses = await this.getProfileResponses(userId);
    const preferences: { [key: string]: string } = {};

    responses.forEach(res => {
      preferences[res.question.questionText] = res.response;
    });

    return menuItems.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (preferences['Please select one-'] === 'Vegetarian' && a.dietaryRestriction === 'Vegetarian') scoreA++;
      if (preferences['Please select one-'] === 'Vegetarian' && b.dietaryRestriction === 'Vegetarian') scoreB++;

      if (preferences['Please select your spice level'] === a.spiceLevel) scoreA++;
      if (preferences['Please select your spice level'] === b.spiceLevel) scoreB++;

      if (preferences['What do you prefer most?'] === a.regionalPreference) scoreA++;
      if (preferences['What do you prefer most?'] === b.regionalPreference) scoreB++;

      if (preferences['Do you have a sweet tooth?'] === 'Yes' && a.isSweet) scoreA++;
      if (preferences['Do you have a sweet tooth?'] === 'Yes' && b.isSweet) scoreB++;

      return scoreB - scoreA;
    });
  }
}
