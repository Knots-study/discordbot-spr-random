import { clearDisabledWeapons } from '../database.js';
import { sendInfo, sendSuccess } from '../utils/messageHelper.js';

export default {
  name: 'clear',
  description: '除外リストをクリア',
  
  async execute(message, args) {
    const result = await clearDisabledWeapons();
    
    if (result.count === 0) {
      return sendInfo(message, '除外リストは既に空です。');
    }

    await sendSuccess(message, `除外リストをクリアしました！（${result.count}個の武器を有効化）`);
  }
};
