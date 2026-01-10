import weaponRepository from '../repositories/WeaponRepository.js';
import { sendError, sendSuccess } from '../utils/messageHelper.js';

/**
 * 武器除外コマンド
 * Dependency Injection を使用してリポジトリに依存
 */
class RemoveCommand {
  constructor(weaponRepository) {
    this.weaponRepository = weaponRepository;
  }

  async execute(message, args) {
    const input = args.join(' ');
    
    if (!input) {
      return sendError(message, '除外する武器名または武器種別を指定してください！\n例: `!remove わかばシューター` または `!remove フデ`');
    }

    const weaponTypes = this.weaponRepository.getWeaponTypes();
    
    // 武器種別の場合
    if (weaponTypes.includes(input)) {
      const result = await this.weaponRepository.disableWeaponType(input);
      
      if (result.success) {
        return sendSuccess(message, `**${input}** の武器 ${result.count}種類を除外リストに追加しました！`);
      }
      return sendError(message, result.message);
    }
    
    // 個別武器の場合
    const allWeapons = this.weaponRepository.getAllWeapons();
    if (!allWeapons.includes(input)) {
      return sendError(message, 'その武器は存在しません。`!all`でリストを確認してください。');
    }

    const result = await this.weaponRepository.disableWeapon(input);
    
    if (result.success) {
      return sendSuccess(message, `**${input}** を除外リストに追加しました！`);
    }
    return sendError(message, result.message);
  }
}

// コマンド定義（DIでインスタンス化）
const removeCommand = new RemoveCommand(weaponRepository);

export default {
  name: 'remove',
  description: '武器または武器種別を除外リストに追加',
  execute: (message, args) => removeCommand.execute(message, args)
};
