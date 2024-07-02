import { Repository, Between } from 'typeorm';
import { MenuItem } from '../entity/MenuItem';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { FinalSelection } from '../entity/FinalSelection';
import { Vote } from '../entity/Vote';
import { Feedback } from '../entity/Feedback';
import { User } from '../entity/User';
import SentimentAnalyzer from './sentimentAnalyzer';
import { SentimentScore } from '../entity/SentimentScore';
import { AppDataSource } from '../data-source';

export class EmployeeService {
  private sentimentAnalyzer: SentimentAnalyzer;
  private selectedRecommendationRepository: Repository<SelectedRecommendation>;
  private finalSelectionRepository: Repository<FinalSelection>;
  private voteRepository: Repository<Vote>;
  private feedbackRepository: Repository<Feedback>;
  private sentimentScoreRepository: Repository<SentimentScore>;
  private menuItemRepository: Repository<MenuItem>;
  constructor() {
    this.feedbackRepository = AppDataSource.getRepository(Feedback);
    this.sentimentScoreRepository = AppDataSource.getRepository(SentimentScore);
    this.menuItemRepository = AppDataSource.getRepository(MenuItem);
    this.selectedRecommendationRepository = AppDataSource.getRepository(SelectedRecommendation);
    this.voteRepository = AppDataSource.getRepository(Vote);
    this.finalSelectionRepository = AppDataSource.getRepository(FinalSelection);
    this.sentimentAnalyzer = new SentimentAnalyzer();
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
    const breakfastItems = finalSelections.filter(r => r.meal === 'Breakfast');
    const lunchItems = finalSelections.filter(r => r.meal === 'Lunch');
    const dinnerItems = finalSelections.filter(r => r.meal === 'Dinner');

    const formatTable = (title: string, items: FinalSelection[]) => {
      let table = `${title}:\n`;
      table += '+----+-----------------+--------------------+-------+-------+\n';
      table += '| ID | MenuItem ID | Name            | Description        | Price |\n';
      table += '+----+-----------------+--------------------+-------+-------+\n';
      items.forEach((item) => {
        table += `| ${String(item.id).padEnd(2)} | ${String(item.selectedRecommendation.menuItem.id).padEnd(10)} | ${item.selectedRecommendation.menuItem.name.padEnd(15)} | ${item.selectedRecommendation.menuItem.description.padEnd(18)} | ${String(item.selectedRecommendation.menuItem.price).padEnd(5)} |\n`;
      });
      table += '+----+-----------------+--------------------+-------+-------+\n';
      return table;
    };

    const breakfastTable = formatTable('Breakfast', breakfastItems);
    const lunchTable = formatTable('Lunch', lunchItems);
    const dinnerTable = formatTable('Dinner', dinnerItems);

    return `${breakfastTable}\n${lunchTable}\n${dinnerTable}`;
  }
}
