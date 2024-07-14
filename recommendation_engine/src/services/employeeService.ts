import { EmployeeRepository } from '../repositories/employeeRepository';
import { SentimentAnalyzer } from './sentimentAnalyzer';
import { User } from '../entity/User';
import { Feedback } from '../entity/Feedback';
import { Vote } from '../entity/Vote';
import { FeedbackForm } from '../entity/FeedbackForm';
import { UserProfileResponse } from '../entity/UserProfileResponse';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
import { FinalSelection } from '../entity/FinalSelection';
import { MenuItem } from '../entity/MenuItem';
import { SentimentScore } from '../entity/SentimentScore';
import { Question } from '../entity/Question';
import { UserProfileQuestion } from '../entity/UserProfileQuestion';

export class EmployeeService {
  private sentimentAnalyzer: SentimentAnalyzer;
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.employeeRepository = new EmployeeRepository();
  }

  public async getSelectedMenuItems(start: Date, end: Date) {
    return this.employeeRepository.findSelectedRecommendations(start, end);
  }

  public async checkMenuItemExists(menuItemId: number) {
    const menuItem = await this.employeeRepository.findMenuItem(menuItemId);
    return !!menuItem;
  }

  public async getPreparedMenuItems(start: Date, end: Date) {
    return this.employeeRepository.findFinalSelections(start, end);
  }

  public async castVote(userId: number, selectedRecommendationId: number, meal: string, start: Date, end: Date) {
    const existingVote = await this.employeeRepository.findVote(userId, meal, start, end);

    if (existingVote) {
      return `You have already voted for ${meal} today.`;
    }

    const vote = new Vote();
    vote.user = { id: userId } as User;
    vote.selectedRecommendation = { id: selectedRecommendationId } as SelectedRecommendation;
    vote.date = new Date();
    await this.employeeRepository.saveVote(vote);
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
    await this.employeeRepository.saveFeedback(feedback);

    const sentimentScore = await this.sentimentAnalyzer.analyzeSentiment(comment);
    const existingSentiment = await this.employeeRepository.findSentimentScore(menuItemId);

    if (existingSentiment) {
      existingSentiment.score = (existingSentiment.score + sentimentScore) / 2;
      await this.employeeRepository.saveSentimentScore(existingSentiment);
    } else {
      const sentiment = new SentimentScore();
      sentiment.menuItem = { id: menuItemId } as MenuItem;
      sentiment.score = sentimentScore;
      sentiment.date = new Date();
      await this.employeeRepository.saveSentimentScore(sentiment);
    }
    return 'Your Feedback has been recorded';
  }

  public async getSurveys(userId: number) {
    const discardedItems = await this.employeeRepository.findAllDiscardedMenuItems();

    const feedbackForms = await this.employeeRepository.findFeedbackForms(userId);

    const completedSurveyIds = feedbackForms.map(form => form.discardedMenuItem.id);
    const surveys = discardedItems.filter(item => !completedSurveyIds.includes(item.id));

    return surveys;
  }



  public async getSurveyQuestions() {
    return this.employeeRepository.findAllQuestions();
  }

  public async submitSurvey(userId: number, menuItemId: number, responses: string[]) {
    const discardedItem = await this.employeeRepository.findAllDiscardedMenuItems().then(items => items.find(item => item.menuItem.id === menuItemId));

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
      await this.employeeRepository.saveFeedbackForm(feedbackForm);
    }

    return 'Thank you for your feedback!';
  }

  public async getProfileQuestions() {
    return this.employeeRepository.findAllProfileQuestions();
  }

  public async getProfileResponses(userId: number) {
    return this.employeeRepository.findProfileResponsesByUser(userId);
  }

  public async saveProfileResponses(userId: number, responses: { questionId: number; response: string }[]) {
    for (const res of responses) {
      const response = new UserProfileResponse();
      response.user = { id: userId } as User;
      response.question = { id: res.questionId } as UserProfileQuestion;
      response.response = res.response;
      await this.employeeRepository.saveProfileResponse(response);
    }
  }

  public async recommendMenuItems(userId: number, menuItems: MenuItem[]) {
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
