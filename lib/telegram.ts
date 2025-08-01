import { Telegraf } from 'telegraf';

const bot = process.env.TELEGRAM_BOT_TOKEN 
  ? new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
  : null;

export async function sendTelegramMessage(chatId: string, message: string) {
  if (!bot) {
    console.warn('Telegram bot not configured');
    return;
  }

  try {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

export async function sendTelegramNotification(
  chatId: string,
  title: string,
  content: string,
  buttons?: Array<{ text: string; url?: string; callback_data?: string }>
) {
  if (!bot) {
    console.warn('Telegram bot not configured');
    return;
  }

  try {
    const message = `*${title}*\n\n${content}`;
    
    const options: any = {
      parse_mode: 'Markdown',
    };

    if (buttons && buttons.length > 0) {
      options.reply_markup = {
        inline_keyboard: [
          buttons.map(button => ({
            text: button.text,
            ...(button.url ? { url: button.url } : {}),
            ...(button.callback_data ? { callback_data: button.callback_data } : {}),
          })),
        ],
      };
    }

    await bot.telegram.sendMessage(chatId, message, options);
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

export default bot;