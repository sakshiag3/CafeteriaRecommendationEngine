import { SentimentAnalyzer } from '../services/sentimentAnalyzer';
import { pipeline } from 'transformer.ts';

jest.mock('transformer.ts', () => ({
  pipeline: jest.fn(),
}));

describe('SentimentAnalyzer', () => {
  let sentimentAnalyzer: SentimentAnalyzer;
  let mockClassifier: jest.Mock;

  beforeEach(async () => {
    mockClassifier = jest.fn();
    (pipeline as jest.Mock).mockResolvedValue(mockClassifier);
    sentimentAnalyzer = new SentimentAnalyzer();
    await sentimentAnalyzer.initialize();
  });

  it('should initialize the classifier', () => {
    expect(pipeline).toHaveBeenCalledWith('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
  });

  it('should analyze positive feedback and return the scaled score', async () => {
    mockClassifier.mockResolvedValueOnce([
      { label: '5 stars', score: 0.95 },
    ]);

    const text = 'The food was absolutely delicious!';
    const score = await sentimentAnalyzer.analyzeSentiment(text);
    expect(score).toBe(99.0);
  });

  it('should analyze negative feedback and return the scaled score', async () => {
    mockClassifier.mockResolvedValueOnce([
      { label: '1 star', score: 0.85 },
    ]);

    const text = 'The food was terrible and inedible.';
    const score = await sentimentAnalyzer.analyzeSentiment(text);
    expect(score).toBe(17.0); 
  });

  it('should analyze neutral feedback and return the scaled score', async () => {
    mockClassifier.mockResolvedValueOnce([
      { label: '3 stars', score: 0.60 },
    ]);

    const text = 'The food was okay, not bad but not great either.';
    const score = await sentimentAnalyzer.analyzeSentiment(text);
    expect(score).toBe(52.0);
  });

  it('should handle unexpected sentiment labels gracefully', async () => {
    mockClassifier.mockResolvedValueOnce([
      { label: 'unknown', score: 0.50 },
    ]);

    const text = 'This feedback has an unknown sentiment.';
    const score = await sentimentAnalyzer.analyzeSentiment(text);
    expect(score).toBeNaN();
  });

  it('should handle empty feedback gracefully', async () => {
    mockClassifier.mockResolvedValueOnce([
      { label: '1 star', score: 0.0 },
    ]);

    const text = '';
    const score = await sentimentAnalyzer.analyzeSentiment(text);
    expect(score).toBe(0.0);
  });
});
