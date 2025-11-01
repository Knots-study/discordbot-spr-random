import { enableWeapon, enableWeaponType, getWeaponTypes } from '../database.js';
import { sendError, sendSuccess } from '../utils/messageHelper.js';

export default {
  name: 'add',
  description: '武器または武器種別を除外リストから削除',
  
  async execute(message, args) {
    const input = args.join(' ');
    
    if (!input) {
      return sendError(message, '追加する武器名または武器種別を指定してください！\n例: `!add わかばシューター` または `!add フデ`');
    }

    const weaponTypes = getWeaponTypes();
    
    // 武器種別の場合
    if (weaponTypes.includes(input)) {
      const result = await enableWeaponType(input);
      
      if (result.success) {
        await sendSuccess(message, `**${input}** の武器 ${result.count}種類を除外リストから削除しました！`);
      } else {
        await message.reply(`⚠️ ${result.message}`);
      }
      return;
    }
    
    // 個別武器の場合
    const result = await enableWeapon(input);
    
    if (result.success) {
      await sendSuccess(message, `**${input}** を除外リストから削除しました！`);
    } else {
      await sendError(message, result.message);
    }
  }
};
