import { disableWeapon, disableWeaponType, getAllWeapons, getWeaponTypes } from '../database.js';
import { sendError, sendSuccess } from '../utils/messageHelper.js';

export default {
  name: 'remove',
  description: '武器または武器種別を除外リストに追加',
  
  async execute(message, args) {
    const input = args.join(' ');
    
    if (!input) {
      return sendError(message, '除外する武器名または武器種別を指定してください！\n例: `!remove わかばシューター` または `!remove フデ`');
    }

    const weaponTypes = getWeaponTypes();
    
    // 武器種別の場合
    if (weaponTypes.includes(input)) {
      const result = await disableWeaponType(input);
      
      if (result.success) {
        await sendSuccess(message, `**${input}** の武器 ${result.count}種類を除外リストに追加しました！`);
      } else {
        await message.reply(`⚠️ ${result.message}`);
      }
      return;
    }
    
    // 個別武器の場合
    const allWeapons = getAllWeapons();
    if (!allWeapons.includes(input)) {
      return sendError(message, 'その武器は存在しません。`!all`でリストを確認してください。');
    }

    const result = await disableWeapon(input);
    
    if (result.success) {
      await sendSuccess(message, `**${input}** を除外リストに追加しました！`);
    } else {
      await message.reply(`⚠️ ${result.message}`);
    }
  }
};
