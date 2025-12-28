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
  if (history.length < 6) return null; 
  
  const last1 = history[0].color;
  const last2 = history[1].color;
  const last3 = history[2].color;
  const last4 = history[3].color;
  const last5 = history[4].color;
  const last6 = history[5].color;

  // 1. MARRETADA (Streak) - Force continuation after 3
  if (last1 === last2 && last2 === last3) {
    return { pattern: "MARRETADA", prediction: last1 as 'blue' | 'red', confidence: 'high' };
  }

  // 2. QUEBRA DE SEQUÊNCIA (Reverse after 4 same)
  if (last1 === last2 && last2 === last3 && last3 === last4) {
     return { pattern: "QUEBRA DE TENDÊNCIA", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  // 3. ZIG-ZAG (B R B R)
  if (last1 !== last2 && last2 !== last3 && last3 !== last4 && last1 === last3 && last2 === last4) {
    return { pattern: "ZIG-ZAG", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  // 4. PADRÃO 2-2 (BB RR)
  if (last1 === last2 && last3 === last4 && last1 !== last3) {
     return { pattern: "PADRÃO 2-2", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'medium' };
  }

  // 5. PADRÃO 3-1 (BBB R)
  if (last1 !== last2 && last2 === last3 && last3 === last4 && last4 !== last5) {
     return { pattern: "PADRÃO 3-1", prediction: last1 as 'blue' | 'red', confidence: 'medium' };
  }

  return null;
}

export async function processNewResult(color: 'blue' | 'red' | 'tie') {
  if (color === 'tie') return;

  await storage.addGameResult({ color });
  const history = await storage.getGameHistory(15);
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
      const colorText = analysis.prediction === 'blue' ? 'AZUL' : 'VERMELHO';
      
      const message = `🎲 *BAC BO – ELEPHANTBET*
📊 *Padrão:* ${analysis.pattern}
👉 *ENTRADA:* ${emoji} ${colorText}

⚠️ *PROTEÇÃO NO EMPATE* ⚪
🔄 *ATÉ 2 GALES*

_IA Agressiva Monitorando..._`;

      bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' })
        .catch(err => console.error("Telegram Error:", err.message));
    }
  }
}
