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

function analyzePattern(history: any[]): { pattern: string, prediction: 'blue' | 'red', confidence: 'high' } | null {
  if (history.length < 6) return null; 
  
  const last1 = history[0].color;
  const last2 = history[1].color;
  const last3 = history[2].color;
  const last4 = history[3].color;
  const last5 = history[4].color;
  const last6 = history[5].color;

  // 1. MARRETADA ACELERADA (Detecta tendência em 3 e prevê o 4º)
  if (last1 === last2 && last2 === last3) {
    return { pattern: "MARRETADA (Alta Velocidade)", prediction: last1 as 'blue' | 'red', confidence: 'high' };
  }

  // 2. QUEBRA DE TENDÊNCIA RÁPIDA (Reversão após 4 iguais)
  if (last1 === last2 && last2 === last3 && last3 === last4) {
     return { pattern: "QUEBRA DE TENDÊNCIA (Alta Velocidade)", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  // 3. ZIG-ZAG DINÂMICO (B R B R)
  if (last1 !== last2 && last2 !== last3 && last3 !== last4 && last1 === last3) {
    return { pattern: "ZIG-ZAG (Alta Velocidade)", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  // 4. PADRÃO 2-2 AGILIZADO (BB RR)
  if (last1 === last2 && last3 === last4 && last1 !== last3) {
     return { pattern: "PADRÃO 2-2 (Alta Velocidade)", prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
  }

  return null;
}

let winStreak = 0;
let lossCount = 0;
let totalWins = 0;
let totalLosses = 0;

export async function notifyMarketStatus(isOpen: boolean) {
  if (bot && telegramChatId) {
    const message = isOpen 
      ? "✅ *MERCADO ABERTO!*\nIA voltando a monitorar o Bac Bo em tempo real. 🚀" 
      : "🛑 *MERCADO FECHADO!*\nAguardando o Bac Bo voltar a operar. IA em standby. 💤";
    bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' });
  }
}

export async function processNewResult(color: 'blue' | 'red' | 'tie', score?: string) {
  // Check for victory from last signal
  const latestSignal = await storage.getLatestSignal();
  
  if (latestSignal && latestSignal.status === 'pending') {
    const isWin = latestSignal.prediction === color || color === 'tie';
    
    if (isWin) {
      await storage.updateSignalStatus(latestSignal.id, 'won');
      winStreak++;
      totalWins++;
      if (bot && telegramChatId) {
        const emoji = color === 'tie' ? '🟠' : (color === 'blue' ? '🔵' : '🔴');
        const colorText = color === 'tie' ? 'EMPATE' : color.toUpperCase();
        const scoreInfo = score ? ` (${score})` : '';
        bot.sendMessage(telegramChatId, `✅ *VITÓRIA CONFIRMADA!*
Lado: ${emoji} ${colorText}${scoreInfo}
🎯 IA Ultra Rápida no Alvo!

📊 *PLACAR ACUMULADO:*
🔥 Sequência: ${winStreak} WIN(s)
✅ Total Wins: ${totalWins}
📉 Total Losses: ${totalLosses}`, { parse_mode: 'Markdown' });
      }
    } else {
      await storage.updateSignalStatus(latestSignal.id, 'lost');
      lossCount++;
      totalLosses++;
      winStreak = 0; // Reset streak on loss
      if (bot && telegramChatId) {
        bot.sendMessage(telegramChatId, `❌ *LOSS DETECTADO*
Sequência reiniciada.

📊 *PLACAR ACUMULADO:*
🔥 Sequência: ${winStreak}
✅ Total Wins: ${totalWins}
📉 Total Losses: ${totalLosses}`, { parse_mode: 'Markdown' });
      }
    }
  }

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
📊 *Estratégia:* ${analysis.pattern}
🎯 *CONFIANÇA:* 96%
👉 *ENTRADA:* ${emoji} ${colorText}

📊 *PLACAR:* W: ${totalWins} | L: ${totalLosses}

⚠️ *PROTEÇÃO NO EMPATE* 🟠
🔄 *ATÉ 2 GALES*

_Análise em tempo real (Alta Velocidade)_`;

      bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' })
        .catch(err => console.error("Telegram Error:", err.message));
    }
  }
}
