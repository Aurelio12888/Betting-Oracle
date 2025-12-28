import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

let bot: TelegramBot | null = null;

if (telegramToken) {
  bot = new TelegramBot(telegramToken, { polling: true });
  console.log("Telegram Bot initialized for polling");

  // Bot commands
  bot.onText(/\/start/, (msg) => {
    bot?.sendMessage(msg.chat.id, "🔥 *IA BAC BO AGRESSIVA ATIVA*\nMonitorando ElephantBet em tempo real...", { parse_mode: 'Markdown' });
  });
}

function analyzePattern(history: any[]): { pattern: string, prediction: 'blue' | 'red', confidence: 'high' | 'medium' } | null {
  if (history.length < 3) return null;
  
  const last1 = history[0].color;
  const last2 = history[1].color;
  const last3 = history[2].color;
  const last4 = history.length > 3 ? history[3].color : null;
  const last5 = history.length > 4 ? history[4].color : null;

  if (last1 === last2 && last2 === last3) {
    if (last4 === last1 && last5 === last1) {
       return { pattern: "TRAP (Overstreak)", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
    }
    return { pattern: "HAMMER (Streak)", prediction: last1 as 'blue' | 'red', confidence: 'high' };
  }

  if (last1 !== last2 && last2 !== last3 && last1 === last3) {
    return { pattern: "ZIG-ZAG", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'medium' };
  }

  if (last1 === last2 && last2 !== last3 && last3 === last4 && last4 !== last1) {
     return { pattern: "DOUBLE FORCED", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'medium' };
  }

  if (history.length >= 10) {
    const blueCount = history.slice(0, 10).filter(r => r.color === 'blue').length;
    if (blueCount >= 7) return { pattern: "PRESSURE (Blue Dominance)", prediction: 'red', confidence: 'high' };
    if (blueCount <= 3) return { pattern: "PRESSURE (Red Dominance)", prediction: 'blue', confidence: 'high' };
  }

  return null;
}

export async function processNewResult(color: 'blue' | 'red' | 'tie') {
  if (color === 'tie') return;

  await storage.addGameResult({ color });
  const history = await storage.getGameHistory(20);
  const analysis = analyzePattern(history);

  if (analysis) {
    await storage.addSignal({
      pattern: analysis.pattern,
      prediction: analysis.prediction,
      confidence: analysis.confidence,
      status: 'pending'
    });

    if (bot && telegramChatId) {
      const emoji = analysis.prediction === 'blue' ? '🔵' : '🔴';
      const message = `🎲 *BAC BO – ELEPHANTBET*\n\n📊 *Padrão:* ${analysis.pattern}\n👉 *ENTRADA:* ${emoji} ${analysis.prediction.toUpperCase()}\n\n_IA Agressiva v1.0_`;
      bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' })
        .catch(err => console.error("Telegram Error:", err.message));
    }
  }
}
