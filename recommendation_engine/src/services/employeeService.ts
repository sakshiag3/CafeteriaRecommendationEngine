import { EmployeeRepository } from '../repositories/employeeRepository';
import { SentimentAnalyzer } from './sentimentAnalyzer';
import { User } from '../entity/User';
import { Feedback } from '../entity/Feedback';
import { Vote } from '../entity/Vote';
import { FeedbackForm } from '../entity/FeedbackForm';
import { UserProfileResponse } from '../entity/UserProfileResponse';
import { SelectedRecommendation } from '../entity/SelectedRecommendation';
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
    try {
      return await this.employeeRepository.findSelectedRecommendations(start, end);
    } catch (error) {
      console.error('Error fetching selected menu items:', error);
      throw new Error('An error occurred while fetching the selected menu items. Please try again later.');
    }
  }

  public async checkMenuItemExists(menuItemId: number) {
    try {
      const menuItem = await this.employeeRepository.findMenuItem(menuItemId);
      return !!menuItem;
    } catch (error) {
      console.error('Error checking if menu item exists:', error);
      throw new Error('An error occurred while checking the menu item. Please try again later.');
    }
  }

  public async getPreparedMenuItems(start: Date, end: Date) {
    try {
      return await this.employeeRepository.findFinalSelections(start, end);
    } catch (error) {
      console.error('Error fetching prepared menu items:', error);
      throw new Error('An error occurred while fetching the prepared menu items. Please try again later.');
    }
  }

  public async castVote(userId: number, selectedRecommendationId: number, meal: string, start: Date, end: Date) {
    try {
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
    } catch (error) {
      console.error('Error casting vote:', error);
      throw new Error('An error occurred while casting your vote. Please try again later.');
    }
  }

  public async giveFeedback(userId: number, menuItemId: number, rating: number, comment: string) {
    try {
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
      return 'Your feedback has been recorded';
    } catch (error) {
      console.error('Error giving feedback:', error);
      throw new Error('An error occurred while recording your feedback. Please try again later.');
    }
  }

  public async getSurveys(userId: number) {
    try {
      const discardedItems = await this.employeeRepository.findAllDiscardedMenuItems();
      const feedbackForms = await this.employeeRepository.findFeedbackForms(userId);
      const completedSurveyIds = feedbackForms.map(form => form.discardedMenuItem.id);
      const surveys = discardedItems.filter(item => !completedSurveyIds.includes(item.id));
      return surveys;
    } catch (error) {
      console.error('Error fetching surveys:', error);
      throw new Error('An error occurred while fetching surveys. Please try again later.');
    }
  }

  public async getSurveyQuestions() {
    try {
      return await this.employeeRepository.findAllQuestions();
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      throw new Error('An error occurred while fetching survey questions. Please try again later.');
    }
  }

  public async submitSurvey(userId: number, menuItemId: number, responses: string[]) {
    try {
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
    } catch (error) {
      console.error('Error submitting survey:', error);
      throw new Error('An error occurred while submitting your survey. Please try again later.');
    }
  }

  public async getProfileQuestions() {
    try {
      return await this.employeeRepository.findAllProfileQuestions();
    } catch (error) {
      console.error('Error fetching profile questions:', error);
      throw new Error('An error occurred while fetching profile questions. Please try again later.');
    }
  }

  public async getProfileResponses(userId: number) {
    try {
      return await this.employeeRepository.findProfileResponsesByUser(userId);
    } catch (error) {
      console.error('Error fetching profile responses:', error);
      throw new Error('An error occurred while fetching profile responses. Please try again later.');
    }
  }

  public async saveProfileResponses(userId: number, responses: { questionId: number; response: string }[]) {
    try {
      for (const res of responses) {
        const response = new UserProfileResponse();
        response.user = { id: userId } as User;
        response.question = { id: res.questionId } as UserProfileQuestion;
        response.response = res.response;
        await this.employeeRepository.saveProfileResponse(response);
      }
    } catch (error) {
      console.error('Error saving profile responses:', error);
      throw new Error('An error occurred while saving profile responses. Please try again later.');
    }
  }

  public async recommendMenuItems(userId: number, menuItems: MenuItem[]) {
    try {
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
    } catch (error) {
      console.error('Error recommending menu items:', error);
      throw new Error('An error occurred while recommending menu items. Please try again later.');
    }
  }
}
