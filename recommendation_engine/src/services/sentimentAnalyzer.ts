import { pipeline } from "transformer.ts";

class SentimentAnalyzer {
  private classifier: any;

  constructor() {
    this.initialize();
  }

  async initialize() {
    this.classifier = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
  }

  async analyzeSentiment(text: string): Promise<number> {
    const result: any = await this.classifier(text);
    const sentiment = result[0];
    const star = parseInt(sentiment.label[0]);

    let scoreRange: { min: number, max: number };
    switch (star) {
      case 5:
        scoreRange = { min: 80, max: 100 };
        break;
      case 4:
        scoreRange = { min: 60, max: 80 };
        break;
      case 3:
        scoreRange = { min: 40, max: 60 };
        break;
      case 2:
        scoreRange = { min: 20, max: 40 };
        break;
      case 1:
        scoreRange = { min: 0, max: 20 };
        break;
      default:
        throw new Error('Invalid sentiment label');
    }

    const scaledScore = scoreRange.min + (scoreRange.max - scoreRange.min) * sentiment.score;

    return parseFloat(scaledScore.toFixed(2));
  }
}

export default SentimentAnalyzer;
