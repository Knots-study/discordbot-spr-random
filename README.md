#  Splatoon 武器ランダム選出 Discord Bot

Discordのボイスチャンネル参加者にSplatoon 3の武器をランダムに割り当てるBot。除外リスト機能と武器種別指定機能付き。

##  機能

- ボイスチャンネル参加者を自動検出して武器を割り当て
- メンション付きで結果を表示
- 使いたくない武器を除外リストで管理
- 武器種別（シューター、フデなど）で一括除外・追加が可能
- 武器種別を指定してランダム選出可能
- 🔄 リアクションで再抽選可能（20秒以内に1回のみ）
- 1️⃣2️⃣3️⃣ 番号リアクションで即座に武器を除外可能

##  コマンド

| コマンド | 説明 | 例 |
|---------|------|-----|
| `!random [種別]` | ボイスチャンネル参加者に武器を選出 | `!random` または `!random フデ` |
| `!remove [武器名/種別]` | 武器または武器種別を除外リストに追加 | `!remove わかばシューター` または `!remove シューター` |
| `!add [武器名/種別]` | 武器または武器種別を除外リストから削除 | `!add わかばシューター` または `!add シューター` |
| `!list` | 除外中の武器一覧を表示 | `!list` |
| `!all` | 全武器一覧を表示 | `!all` |
| `!clear` | 除外リストをクリア | `!clear` |
| `!help` | ヘルプを表示 | `!help` |

### 武器種別一覧

- シューター
- マニューバー
- ブラスター
- フデ
- ローラー
- スロッシャー
- シェルター
- スピナー
- チャージャー
- ストリンガー
- ワイパー

##  プロジェクト構成

```
discordbot-spr-random/
├── src/
│   ├── commands/           # コマンド実装
│   │   ├── add.js
│   │   ├── all.js
│   │   ├── clear.js
│   │   ├── help.js
│   │   ├── list.js
│   │   ├── random.js
│   │   └── remove.js
│   ├── events/             # イベントハンドラー
│   │   ├── handlers/       # Chain of Responsibility パターン
│   │   │   ├── ReactionHandler.js      # ハンドラー基底クラス
│   │   │   ├── RerollHandler.js        # 再抽選処理（Strategyを使用）
│   │   │   └── WeaponExclusionHandler.js # 武器除外処理
│   │   ├── strategies/     # Strategy パターン
│   │   │   └── RerollStrategy.js       # 再抽選戦略（基底・VC・シンプル）
│   │   └── reactionAdd.js  # リアクション統合ハンドラー
│   ├── utils/              # 共通ユーティリティ
│   │   ├── constants.js    # 定数定義
│   │   ├── embedBuilder.js # Embed生成
│   │   ├── messageHelper.js # メッセージヘルパー
│   │   └── weaponSelector.js # 武器選択ロジック
│   ├── data/
│   │   └── weapons.js      # 武器データ（160武器）
│   ├── db/
│   │   ├── connection.js
│   │   ├── migrations/     # Knexマイグレーション
│   │   └── seeds/
│   ├── database.js         # データベース操作
│   └── index.js            # エントリーポイント
├── tests/                  # 網羅的なテスト（145テスト）
│   ├── commands/           # コマンドテスト
│   ├── events/
│   │   ├── handlers/       # ハンドラー単体テスト
│   │   ├── strategies/     # Strategy単体テスト
│   │   └── reactionAdd.test.js # 統合テスト
│   └── ...
└── data/                   # SQLiteデータベース
```

##  アーキテクチャ

### デザインパターン

#### Chain of Responsibility パターン
リアクション処理を責任の連鎖として実装。各ハンドラーが独立して処理可能かを判断し、不可能な場合は次のハンドラーに委譲。

```
ReactionHandler (基底クラス)
    ↓
RerollHandler → WeaponExclusionHandler
```

- **RerollHandler**: 🔄 再抽選リアクションを処理
  - タイムスタンプ管理（20秒制限）
  - 1回のみ制限
  - **Strategyパターンで再抽選方法を切り替え**

- **WeaponExclusionHandler**: 1️⃣2️⃣3️⃣ 番号リアクションを処理
  - 武器名抽出
  - データベース除外処理
  - フィードバック送信

#### Strategy パターン
再抽選処理の実行方法をコンテキストに応じて動的に切り替え。

```
RerollStrategy (基底クラス)
    ↓
├── VoiceChannelRerollStrategy  ← ボイスチャンネル参加者に再割り当て
└── SimpleRerollStrategy        ← 同じ数の武器を再抽選
```

**使用箇所**: `RerollHandler.executeReroll()`
```javascript
const strategy = voiceChannel 
  ? new VoiceChannelRerollStrategy(voiceChannel)
  : new SimpleRerollStrategy();
await strategy.execute(message);
```

**利点**:
- 新しい再抽選方法を追加しても既存コードを変更不要（Open/Closed原則）
- 各戦略を独立してテスト可能
- コンテキストに応じた動的な戦略切り替え

### タイマー管理
メッセージ作成時刻を`Map`で管理し、20秒以内の再抽選のみを許可：
```javascript
messageCreationTimes.set(messageId, Date.now())
```

##  テスト

145個の網羅的なテストで品質を保証：

```bash
npm test              # 全テスト実行
npm test -- random    # 特定テストのみ実行
```

### テスト構成

- **Unit Tests**: 各ハンドラー、コマンド、ユーティリティの単体テスト
- **Integration Tests**: コマンドとリアクションの統合テスト
- **Pattern Tests**: Chain of Responsibilityの動作テスト

```
tests/
├── commands/                      # コマンドテスト
│   ├── random.integration.test.js # タイマー統合テスト（12テスト）
│   └── *.test.js                  # 各コマンドテスト（14テスト）
├── events/
│   ├── handlers/
│   │   ├── ReactionHandler.test.js        # パターンテスト（13テスト）
│   │   ├── RerollHandler.test.js          # 再抽選テスト（14テスト）
│   │   └── WeaponExclusionHandler.test.js # 除外テスト（20テスト）
│   ├── strategies/
│   │   └── RerollStrategy.test.js         # Strategy単体テスト（16テスト）
│   └── reactionAdd.test.js        # リアクション統合テスト（20テスト）
├── database.test.js               # DB操作テスト（11テスト）
├── embedBuilder.test.js           # Embed生成テスト（6テスト）
├── weaponSelector.test.js         # 武器選択ロジックテスト（8テスト）
└── weapons.test.js                # 武器データテスト（11テスト）
```

##  使い方

### 基本的な流れ

1. ボイスチャンネルに参加
2. テキストチャンネルで `!random` と送信（または `!random フデ` など種別を指定）
3. Botが参加者全員に武器を割り当てて表示

### リアクション機能

選出結果のメッセージには自動でリアクションが追加されます：

- **🔄** を押すと再抽選（最初の20秒以内に1回のみ可能）
- **1️⃣ 2️⃣ 3️⃣...** 各番号を押すと該当する武器を除外リストに追加
  - 例: 2番目のプレイヤーに割り当てられた武器を除外したい → 2️⃣ を押す
  - 除外成功時は確認メッセージが表示されます

### 除外リスト管理

コマンドでも除外リストを管理できます：

```
!remove わかばシューター    # 個別の武器を除外
!remove シューター          # 種別全体を除外
!add わかばシューター       # 除外解除
!list                       # 除外中の武器を確認
!clear                      # 全て解除
```

##  技術スタック

- **Node.js** v24.11.0
- **Discord.js** v14.14.1 - リアクションイベント処理
- **Knex.js** v3.1.0 - クエリビルダー & マイグレーション
- **SQLite3** v5.1.7 - データ永続化
- **Vitest** v4.0.6 - テストフレームワーク（145テスト）
- **dotenv** v16.3.1 - 環境変数管理

### デザインパターン
- **Chain of Responsibility**: リアクション処理の責任分離
- **Strategy**: コンテキスト依存の再抽選戦略（動的切り替え）
