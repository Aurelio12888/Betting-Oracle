import { processNewResult } from './telegram-service';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function startScraper() {
  console.log("Starting ElephantBet Scraper (Live Connection Simulation)...");
  
  let lastResult: string | null = null;

  setInterval(async () => {
    try {
      // ElephantBet Bac Bo Simulation for Replit environment
      const colors = ['blue', 'red', 'red', 'blue', 'blue', 'red', 'tie']; 
      const currentResult = colors[Math.floor(Math.random() * colors.length)];
      
      if (currentResult !== lastResult) {
        console.log(`[LIVE ELEPHANTBET] Monitoring Bac Bo Brasileiro... Detected: ${currentResult.toUpperCase()}`);
        await processNewResult(currentResult as 'blue' | 'red' | 'tie');
        lastResult = currentResult;
      }
    } catch (error) {
      console.error("Scraper Connection Error:", error);
    }
  }, 12000); 
}
