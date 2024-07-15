import { pipeline } from "transformer.ts";

export class SentimentAnalyzer {
  private classifier: any;
  private initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize() {
    try {
      this.classifier = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
    } catch (error) {
      console.error('Error initializing classifier:', error);
      this.classifier = null;
    }
  }

  public async waitForInitialization() {
    await this.initializationPromise;
  }

  public async analyzeSentiment(text: string): Promise<number> {
    // Ensure initialization is complete
    await this.initializationPromise;

    if (!this.classifier) {
      throw new Error('Classifier is not initialized');
    }

    try {
      const result: any = await this.classifier(text);
      const sentiment = result[0];
      const star = parseInt(sentiment.label[0]);
      let baseScore = (star - 1) * 20;

      const scaledScore = baseScore + (sentiment.score * 20);

      return parseFloat(scaledScore.toFixed(2));
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }
}
