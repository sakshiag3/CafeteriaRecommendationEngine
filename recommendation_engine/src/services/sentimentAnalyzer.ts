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

    // Calculate the base score according to star rating
    let baseScore = (star - 1) * 20;
    
    // Scale the sentiment score within the current star rating range
    const scaledScore = baseScore + (sentiment.score * 20);

    return parseFloat(scaledScore.toFixed(2));
  }
}

export default SentimentAnalyzer;
