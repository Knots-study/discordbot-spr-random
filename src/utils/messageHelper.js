
/**
 * エラーメッセージを送信
 * @param {Message} message
 * @param {string} errorText
 */
export async function sendError(message, errorText) {
  await message.reply(`❌ ${errorText}`);
}

/**
 * 成功メッセージを送信
 * @param {Message} message
 * @param {string} successText
 */
export async function sendSuccess(message, successText) {
  await message.reply(`✅ ${successText}`);
}

/**
 * 情報メッセージを送信
 * @param {Message} message
 * @param {string} infoText
 */
export async function sendInfo(message, infoText) {
  await message.reply(`📋 ${infoText}`);
}
