import weaponRepository from '../repositories/WeaponRepository.js';
import { sendInfo, sendSuccess } from '../utils/messageHelper.js';

/**
 * 除外リストクリアコマンド
 * Dependency Injection を使用してリポジトリに依存
 */
class ClearCommand {
  constructor(weaponRepository) {
    this.weaponRepository = weaponRepository;
  }

  async execute(message, args) {
    const result = await this.weaponRepository.enableAllWeapons();
    
    if (result.count === 0) {
      return sendInfo(message, '除外リストは既に空です。');
    }

    return sendSuccess(message, `除外リストをクリアしました！（${result.count}個の武器を有効化）`);
  }
}

// コマンド定義（DIでインスタンス化）
const clearCommand = new ClearCommand(weaponRepository);

export default {
  name: 'clear',
  description: '除外リストをクリア',
  execute: (message, args) => clearCommand.execute(message, args)
};
