import weaponRepository from '../repositories/WeaponRepository.js';
import { sendError, sendSuccess } from '../utils/messageHelper.js';

/**
 * 武器除外解除コマンド
 * Dependency Injection を使用してリポジトリに依存
 */
class AddCommand {
  constructor(weaponRepository) {
    this.weaponRepository = weaponRepository;
  }

  async execute(message, args) {
    const input = args.join(' ');
    
    if (!input) {
      return sendError(message, '追加する武器名または武器種別を指定してください！\n例: `!add わかばシューター` または `!add フデ`');
    }

    const weaponTypes = this.weaponRepository.getWeaponTypes();
    
    // 武器種別の場合
    if (weaponTypes.includes(input)) {
      const result = await this.weaponRepository.enableWeaponType(input);
      
      if (result.success) {
        return sendSuccess(message, `**${input}** の武器 ${result.count}種類を除外リストから削除しました！`);
      }
      return sendError(message, result.message);
    }
    
    // 個別武器の場合
    const result = await this.weaponRepository.enableWeapon(input);
    
    if (result.success) {
      return sendSuccess(message, `**${input}** を除外リストから削除しました！`);
    }
    return sendError(message, result.message);
  }
}

// コマンド定義（DIでインスタンス化）
const addCommand = new AddCommand(weaponRepository);

export default {
  name: 'add',
  description: '武器または武器種別を除外リストから削除',
  execute: (message, args) => addCommand.execute(message, args)
};
