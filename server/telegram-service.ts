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
  if (history.length < 5) return null; // Increased required history for higher accuracy
  
  const last1 = history[0].color;
  const last2 = history[1].color;
  const last3 = history[2].color;
  const last4 = history.length > 3 ? history[3].color : null;
  const last5 = history.length > 4 ? history[4].color : null;

  // 1. HAMMER (Extreme Streak) - Wait for 4 same colors
  if (last1 === last2 && last2 === last3 && last3 === last4) {
    return { pattern: "MARRETADA (Sequência Longa)", prediction: last1 as 'blue' | 'red', confidence: 'high' };
  }

  // 2. QUEBRA DE SEQUÊNCIA (Force break after 5)
  if (last1 === last2 && last2 === last3 && last3 === last4 && last4 === last5) {
     return { pattern: "QUEBRA AGRESSIVA", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  // 3. ZIG-ZAG SEGURO (B R B R)
  if (last1 !== last2 && last2 !== last3 && last3 !== last4 && last1 === last3 && last2 === last4) {
    return { pattern: "ZIG-ZAG CONFIRMADO", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  // 4. PADRÃO 2-2 (BB RR)
  if (last1 === last2 && last2 !== last3 && last3 === last4 && last4 === last5 && last3 !== last1) {
     return { pattern: "DUPLO FORÇADO", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'medium' };
  }

  return null;
}

export async function processNewResult(color: 'blue' | 'red' | 'tie') {
  if (color === 'tie') return;

  await storage.addGameResult({ color });
  const history = await storage.getGameHistory(15);
  const analysis = analyzePattern(history);

  if (analysis) {
    // Only send if it's a strong opportunity
    await storage.addSignal({
      pattern: analysis.pattern,
      prediction: analysis.prediction,
      confidence: analysis.confidence,
      status: 'pending'
    });

    if (bot && telegramChatId) {
      const emoji = analysis.prediction === 'blue' ? '🔵' : '🔴';
      const message = `🎲 *BAC BO – ELEPHANTBET*\n\n📊 *Oportunidade Detectada:* ${analysis.pattern}\n👉 *ENTRADA:* ${emoji} ${analysis.prediction.toUpperCase()}\n\n_IA Agressiva Monitorando..._`;
      bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' })
        .catch(err => console.error("Telegram Error:", err.message));
    }
  }
}
