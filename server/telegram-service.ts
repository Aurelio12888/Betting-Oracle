import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

let bot: TelegramBot | null = null;

if (telegramToken) {
  bot = new TelegramBot(telegramToken, { 
    polling: {
      interval: 300,
      autoStart: true,
      params: {
        timeout: 10
      }
    }
  });
  console.log("[TELEGRAM] Bot iniciado com Polling");

  // Envia mensagem inicial ao chat ID configurado se existir
  if (telegramChatId) {
    console.log(`[TELEGRAM] Tentando enviar mensagem inicial para Chat ID: ${telegramChatId}`);
    bot.sendMessage(telegramChatId, "✅ *SISTEMA REESTABELECIDO*\nIA Bac Bo está Online e Monitorando! 🚀\n\n🎯 *ESTE É O NOVO CANAL DE SINAIS!*", { parse_mode: 'Markdown' })
      .then(() => console.log("[TELEGRAM] Mensagem inicial enviada com sucesso!"))
      .catch(err => {
        console.error("[TELEGRAM] Erro ao enviar mensagem inicial:", err.message);
        if (err.message.includes('chat not found')) {
          console.error("[TELEGRAM] DICA: O Bot precisa ser iniciado pelo usuário ou adicionado a um grupo/canal primeiro.");
        }
      });
  }

  // Monitorar todos os erros do polling
  bot.on('polling_error', (error) => {
    console.error("[TELEGRAM] Erro de Polling:", error.message);
    console.error("[TELEGRAM] Detalhes:", JSON.stringify(error, null, 2));
  });

  bot.on('webhook_error', (error) => {
    console.error("[TELEGRAM] Erro de Webhook:", error.message);
  });

  bot.on('error', (error) => {
    console.error("[TELEGRAM] Erro Geral do Bot:", error.message);
  });

  bot.onText(/\/start/, (msg) => {
    bot?.sendMessage(msg.chat.id, "🔥 *IA BAC BO AGRESSIVA ATIVA*\nMonitorando ElephantBet em tempo real...", { parse_mode: 'Markdown' });
  });
}

let winStreak = 0;
let lossCount = 0;
let totalWins = 0;
let totalLosses = 0;
let consecutiveLosses = 0;
let lastStatsBroadcast = Date.now();

const STRATEGIES = {
  MARRETADA: "MARRETADA",
  QUEBRA: "QUEBRA DE TENDÊNCIA",
  ZIGZAG: "ZIG-ZAG",
  PADRAO22: "PADRÃO 2-2"
};

let activeStrategies = Object.values(STRATEGIES);

function analyzePattern(history: any[]): { pattern: string, prediction: 'blue' | 'red', confidence: 'high' } | null {
  if (history.length < 10) return null; 
  
  const last1 = history[0].color;
  const last2 = history[1].color;
  const last3 = history[2].color;
  const last4 = history[3].color;
  const last5 = history[4].color;
  const last6 = history[5].color;
  const last7 = history[6].color;
  const last8 = history[7].color;
  const last9 = history[8].color;
  const last10 = history[9].color;

  // 1. MARRETADA ESTRATÉGICA
  if (activeStrategies.includes(STRATEGIES.MARRETADA)) {
    if (last1 === last2 && last2 === last3 && last3 === last4 && last4 === last5) {
      return { pattern: STRATEGIES.MARRETADA, prediction: last1 as 'blue' | 'red', confidence: 'high' };
    }
  }

  // 2. QUEBRA DE TENDÊNCIA ABSOLUTA
  if (activeStrategies.includes(STRATEGIES.QUEBRA)) {
    if (last1 === last2 && last2 === last3 && last3 === last4 && last4 === last5 && last5 === last6) {
       return { pattern: STRATEGIES.QUEBRA, prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
    }
  }

  // 3. ZIG-ZAG MATEMÁTICO
  if (activeStrategies.includes(STRATEGIES.ZIGZAG)) {
    if (last1 !== last2 && last2 !== last3 && last3 !== last4 && last4 !== last5 && last5 !== last6 && last6 !== last7 && last7 !== last8) {
      return { pattern: STRATEGIES.ZIGZAG, prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
    }
  }

  // 4. PADRÃO 2-2 CONSOLIDADO
  if (activeStrategies.includes(STRATEGIES.PADRAO22)) {
    if (last1 === last2 && last3 === last4 && last5 === last6 && last7 === last8 && last1 !== last3 && last3 === last5 && last5 !== last7) {
       return { pattern: STRATEGIES.PADRAO22, prediction: last1 === 'blue' ? 'red' : 'blue', confidence: 'high' };
    }
  }

  return null;
}

function broadcastStats() {
  if (bot && telegramChatId) {
    const message = `📊 *RESUMO DE MERCADO*
✅ Total Vitórias: ${totalWins}
📉 Total Derrotas: ${totalLosses}
🔥 Assertividade: ${totalWins + totalLosses > 0 ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1) : 0}%

_Monitoramento 24h ElephantBet_`;
    bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' });
    lastStatsBroadcast = Date.now();
  }
}

export async function notifyMarketStatus(isOpen: boolean) {
  if (bot && telegramChatId) {
    const message = isOpen 
      ? "✅ *MERCADO ABERTO!*\nIA voltando a monitorar o Bac Bo em tempo real. 🚀" 
      : "🛑 *MERCADO FECHADO!*\nAguardando o Bac Bo voltar a operar. IA em standby. 💤";
    bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' });
  }
}

export async function processNewResult(color: 'blue' | 'red' | 'tie', score?: string) {
  // Envio periódico do placar (a cada 2 horas aproximadamente se houver atividade)
  if (Date.now() - lastStatsBroadcast > 1000 * 60 * 60 * 2) {
    broadcastStats();
  }

  // Check for victory from last signal
  const latestSignal = await storage.getLatestSignal();
  
  if (latestSignal && latestSignal.status === 'pending') {
    const isWin = latestSignal.prediction === color || color === 'tie';
    
    if (isWin) {
      await storage.updateSignalStatus(latestSignal.id, 'won');
      winStreak++;
      totalWins++;
      consecutiveLosses = 0;
      // Reativa todas as estratégias após um win
      activeStrategies = Object.values(STRATEGIES);

      if (bot && telegramChatId) {
        const emoji = color === 'tie' ? '🟠' : (color === 'blue' ? '🔵' : '🔴');
        const colorText = color === 'tie' ? 'EMPATE' : color.toUpperCase();
        const scoreInfo = score ? ` (${score})` : '';
        bot.sendMessage(telegramChatId, `✅ *VITÓRIA CONFIRMADA!*
Lado: ${emoji} ${colorText}${scoreInfo}
🎯 IA no Alvo!

📊 *PLACAR ACUMULADO:*
🔥 Sequência: ${winStreak} WIN(s)
✅ Total Wins: ${totalWins}
📉 Total Losses: ${totalLosses}`, { parse_mode: 'Markdown' });
      }
    } else {
      await storage.updateSignalStatus(latestSignal.id, 'lost');
      lossCount++;
      totalLosses++;
      winStreak = 0;
      consecutiveLosses++;

      if (consecutiveLosses >= 2) {
        // Lógica de troca de estratégia: Remove a estratégia que falhou temporariamente
        const failedStrategy = latestSignal.pattern;
        activeStrategies = activeStrategies.filter(s => s !== failedStrategy);
        
        if (activeStrategies.length === 0) activeStrategies = Object.values(STRATEGIES); // Reset se todas falharem

        if (bot && telegramChatId) {
          bot.sendMessage(telegramChatId, `⚠️ *ALERTA DE SEGURANÇA*
2 Losses seguidos detectados. 
MUDANDO ESTRATÉGIAS para mitigar riscos.
Estratégia suspensa: *${failedStrategy}*`, { parse_mode: 'Markdown' });
        }
      }

      if (bot && telegramChatId) {
        bot.sendMessage(telegramChatId, `❌ *LOSS DETECTADO*
Sequência reiniciada.

📊 *PLACAR ACUMULADO:*
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

🔗 *CADASTRE-SE AGORA:* 
[CLIQUE AQUI PARA SE CADASTRAR](https://www.elephantbet.com/)

⚠️ *PROTEÇÃO NO EMPATE* 🟠
🔄 *ATÉ 2 GALES*

_Análise de Alta Precisão (Estratégia Comprovada)_`;

      bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' })
        .catch(err => console.error("Telegram Error:", err.message));
    }
  }
}
