import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

let bot: TelegramBot | null = null;

if (telegramToken) {
  bot = new TelegramBot(telegramToken, { polling: true });
  console.log("Telegram Bot initialized for polling");

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

  if (last1 === last2 && last2 === last3) {
    return { pattern: "MARRETADA", prediction: last1 as 'blue' | 'red', confidence: 'high' };
  }

  if (last1 === last2 && last2 === last3 && last3 === last4) {
     return { pattern: "QUEBRA DE TENDÊNCIA", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  if (last1 !== last2 && last2 !== last3 && last3 !== last4 && last1 === last3 && last2 === last4) {
    return { pattern: "ZIG-ZAG", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  if (last1 === last2 && last3 === last4 && last1 !== last3) {
     return { pattern: "PADRÃO 2-2", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'medium' };
  }

  if (last1 !== last2 && last2 === last3 && last3 === last4 && last4 !== last5) {
     return { pattern: "PADRÃO 3-1", prediction: last1 as 'blue' | 'red', confidence: 'medium' };
  }

  return null;
}

let winStreak = 0;
let lossCount = 0;

export async function processNewResult(color: 'blue' | 'red' | 'tie', score?: string) {
  if (color === 'tie') {
    const latestSignal = await storage.getLatestSignal();
    if (latestSignal && latestSignal.status === 'pending') {
      if (bot && telegramChatId) {
        bot.sendMessage(telegramChatId, "⚪ *EMPATE DETECTADO!*\nProteção ativada. Seguimos para a próxima.", { parse_mode: 'Markdown' });
      }
    }
    return;
  }

  // Check for victory from last signal BEFORE adding the new result to storage
  const latestSignal = await storage.getLatestSignal();
  if (latestSignal && latestSignal.status === 'pending') {
    if (latestSignal.prediction === color) {
      await storage.updateSignalStatus(latestSignal.id, 'won');
      winStreak++;
      lossCount = 0;
      if (bot && telegramChatId) {
        const emoji = color === 'blue' ? '🔵' : '🔴';
        const scoreInfo = score ? ` (${score})` : '';
        bot.sendMessage(telegramChatId, `✅ *VITÓRIA CONFIRMADA!*
Lado: ${emoji} ${color.toUpperCase()}${scoreInfo}
🎯 IA Agressiva no Alvo!

🔥 *Sequência:* ${winStreak} WIN(s)`, { parse_mode: 'Markdown' });
      }
    } else {
      await storage.updateSignalStatus(latestSignal.id, 'lost');
      lossCount++;
      winStreak = 0; // Reset streak on loss
      if (bot && telegramChatId) {
        bot.sendMessage(telegramChatId, `❌ *LOSS DETECTADO*
Sequência reiniciada.
📊 Erros seguidos: ${lossCount}`, { parse_mode: 'Markdown' });
      }
    }
  }

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
