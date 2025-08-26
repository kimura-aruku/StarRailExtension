# CLAUDE.md

このファイルは、このリポジトリでコードを操作する際のClaude Code (claude.ai/code)へのガイダンスを提供します。

## プロジェクト概要

これは崩壊：スターレイルの戦績ページ（https://act.hoyolab.com/app/community-game-records-sea/rpg/index.html）でスコアを計算して表示するChrome拡張機能です。この拡張機能は、一般的に使用されている簡略化された計算式ではなく、正確な計算方式を使用します。

## アーキテクチャ

### ファイル構成
- `manifest.json` - Chrome拡張機能のマニフェスト（v3）
- `content.js` - スコア計算機能を注入するメインのコンテンツスクリプト
- `README.md` - 日本語のプロジェクトドキュメント
- `Images/` - スクリーンショット素材（導入前後の画像）

### 主要コンポーネント

**コンテンツスクリプト (`content.js`)**
- HoyoLab戦績ページでdocument_startで実行される
- MutationObserverを使用してページの変更とキャラクター切り替えを監視
- ユーザーがハイライトした有効サブステータスに基づいてスコアを計算
- 既存のページ構造にスコア表示要素を注入

**スコア計算ロジック**
- 特定の計算式を使用: 会心ダメージ : 会心率 : 攻撃力%（HP%） = 1 : 2 : 1.5
- カスタムサブステータス選択からハイライトされた「有効サブステータス」のみをカウント
- 速度の計算式: (64.8/25.0) * 速度値
- 実数値ステータス（パーセンテージでないHP、攻撃力、防御力）のスコアは0

## 開発コマンド

このプロジェクトはビルドシステムを使用しません。ソースファイルを直接編集して開発します：

1. Chromeでパッケージ化されていない拡張機能を読み込み: `chrome://extensions` → デベロッパーモードを有効 → パッケージ化されていない拡張機能を読み込む
2. 変更後に拡張機能を再読み込み: 拡張機能カードの再読み込みボタンをクリック
3. デバッグ: 対象ページでChrome DevToolsを使用

## 対象ウェブサイト統合

拡張機能は以下のURLでのみ動作します: `https://act.hoyolab.com/app/community-game-records-sea/rpg/index.html*`

### 拡張機能が操作する主要なDOM要素

- `.pc-swiper-block-layout__content` - キャラクター情報コンテナ
- `.c-hrd-ri-name` - キャラクター名要素
- `.c-hrdr-item` - 遺物要素
- `.c-hrdr-btm-item` - 個別ステータス行
- `.c-hrdr-num[highlight="true"]` - ハイライトされた有効サブステータス

## 元のHTML構造

### メインコンテナ
```html
<!-- 【.pc-swiper-block-layout__content】キャラクター選択 + キャラクター詳細  -->
<div class="pc-swiper-block-layout__content">
  <div class="pc-role-detail">
    <!-- キャラクター選択UI -->
    <div class="pc-role-controller">
      <!-- 中略（キャラクター切り替えUI） -->
    </div>
    
    <!-- キャラクター詳細情報 -->
    <div>
      <div class="pc-role-detail-num">
        <!-- 中略（キャラクター詳細 背景） -->

        <!-- キャラクター詳細 左要素 + 右要素 -->
        <div class="pc-rdnp">
          <!-- キャラクター詳細 左要素（キャラ画像、名前、レベル、凸数、光円錐） -->
          <div class="pc-rdnp-left">
            <!-- キャラクター詳細 左要素-キャラ -->
            <div class="c-hrd-ri">
              <!-- 中略（キャラクター詳細 画像） -->
              <div class="c-hrd-ri-info">
                <div class="c-hrd-ri-1">
                  <!-- 【.c-hrd-ri-name】キャラクター名表示（拡張機能の監視対象） -->
                  <div class="c-hrd-ri-name">キャラクター名</div>
                </div>
                <!-- 中略（c-hrd-ri-2～3（属性、運命、凸数）） -->
              </div>
            </div>
            <!-- 中略（キャラクター詳細 左要素-光円錐） -->
          </div>

          <!-- キャラクター詳細 右要素（キャラステータス、遺物） -->
          <div class="pc-rdnp-right">
            <!-- 中略（タイトル、カスタムサブステータスボタン、キャラクターステータス） -->
            <!-- キャラクター詳細 右要素（遺物関連） -->
            <div class="c-hrdrs">
              <div class="c-hrdrs-title">
                <!-- 中略（タイトルラベル） -->
                <!-- 【.c-hrdrs-title-tip】説明文（拡張機能のスタイル参照用） -->
                <div class="c-hrdrs-title-tip">説明文</div>
              </div>
              <!-- 中略（有効サブステータス） -->
              <!-- キャラクター詳細 右要素（遺物x6） -->
              <div class="c-hrdrs-btm">
                <!-- 【.c-hrdr-item】個別遺物要素（拡張機能のスコア計算対象） -->
                <div class="c-hrdr-item">
                  <!-- 中略（タイトル、遺物レベル） -->
                  <!-- 遺物メインステータス + 遺物サブステータス -->
                  <div class="c-hrdr-btm">
                    <!-- メイン/サブステータスの数だけc-hrdr-itemが存在 -->
                    <div class="c-hrdr-btm-item">
                      <!-- 中略（ステータスアイコン） -->
                      <!-- 【.c-hrdcs-name】ステータス名（拡張機能のスタイル参照用） -->
                      <span class="c-hrdr-name">
                      <!-- .c-hrdcs-num】ステータス数値（拡張機能のスタイル参照用） -->
                      <span class="c-hrdr-num">
                    </div>
                    <!-- 中略（残りのc-hrdr-btm-item） -->
                  </div>
                </div>
                <!-- 中略（遺物の数だけc-hrdr-itemが存在） -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**監視システム概要:**
この拡張機能は6つの監視対象で動的変更を検知し、適切な再描画処理を実行します。

**スコア計算対象要素:**
- `.c-hrdr-item` - 各遺物のスコア計算
- `.c-hrdr-btm-item` - 個別ステータス行（メインステータスとサブステータス）
- `.c-hrdr-name` - ステータス名の取得
- `.c-hrdr-num[highlight="true"]` - ハイライトされた有効サブステータスの数値取得

**スタイル参照用要素:**
- `.c-hrdcs-name` - ラベル用スタイルの参照
- `.c-hrdcs-num` - 数値用スタイルの参照
- `.c-hrdrs-title-tip` - 説明文用スタイルの参照

**スコア表示挿入位置:**
- `.c-hrdrs-btm` の親要素内 - 合計スコア表示の挿入位置
- 各 `.c-hrdr-item` 内 - 個別遺物スコア表示の挿入位置

## 重要な注意事項

- 拡張機能は戦績が「数値」モード（「簡略」モードではない）である必要があります
- カスタムサブステータスパネルからハイライトされたサブステータスのみでスコアを計算します
- 日本語文字列を使用し、現在は日本語のみ対応
- 注入される全ての要素は識別とクリーンアップのためにCSSクラス`alk-element`を使用
- 動的コンテンツの読み込みとユーザー操作を処理するためにmutation observerを使用
- `.c-hrdr-btm` の中の1つ目の `.c-hrdr-btm-item` はメインステータスのためスコア算出の対象外

## 改善点

以下は現在のコードベースの設計面やパフォーマンス面での改善点です。プロジェクトの更新に応じて、これらの改善点も随時見直しと更新を行ってください。

### 設計面の改善点
- **モジュール化**: 単一の大きな関数内にすべてのロジックが集約されている。スコア計算、DOM操作、監視処理を別々のモジュールに分離することを推奨
- **定数管理**: ハードコードされた値（`MY_CLASS`、セレクター文字列、スコア係数など）を設定オブジェクトまたは定数ファイルに外出しすることを推奨
- **エラーハンドリング**: DOM要素の取得失敗やスタイル取得失敗時の処理が不十分。より詳細なエラーハンドリングと復旧機能の実装を推奨
- **型安全性**: JSDocコメントはあるが、TypeScriptの導入を検討することで型安全性を向上させることができる

### パフォーマンス面の改善点
- **MutationObserver最適化**: 複数のMutationObserverが同じ要素を監視しており、コールバック処理が重複している。観測対象を統合し、処理を最適化することを推奨
- **DOM操作の最適化**: `draw()`関数で毎回全ての要素を削除・再作成している。差分更新やキャッシュ機能の導入を推奨
- **メモリリーク対策**: MutationObserverの適切なクリーンアップが実装されているが、ページ離脱時の明示的なクリーンアップ処理の追加を推奨
- **計算処理の最適化**: スコア計算ロジックで文字列操作と数値変換が毎回実行されている。結果のキャッシュや前処理の導入を推奨

### 保守性の改善点
- **ログ機能の充実**: 現在は簡素なconsole.logのみ。開発・デバッグ用のログレベル管理機能の導入を推奨
- **設定機能**: スコア計算係数や表示設定をユーザーが変更できる機能の追加を推奨
- **テスト機能**: 単体テストやE2Eテストの導入によるコード品質向上を推奨
- **国際化対応**: 現在は日本語のみ対応。多言語対応のための文字列外部化を推奨

### セキュリティ面の改善点
- **CSP対応**: インラインスタイルの使用を最小限に抑え、Content Security Policy対応を強化することを推奨
- **XSS対策**: DOM要素への文字列設定時により厳密なサニタイゼーション処理の導入を推奨

## 開発ガイドライン

### Console ログの使用について

デバッグ用にconsole.logを追加する場合は、HoyoLabのログと区別するために必ず以下の接頭語を使用してください：

```javascript
// 正しい例
console.log('[StarRailExt] デバッグメッセージ');
console.warn('[StarRailExt] 警告メッセージ');
console.error('[StarRailExt] エラーメッセージ');
```

**理由:**
- HoyoLab側のconsole出力と拡張機能のログを明確に分離できる
- Chrome DevToolsのConsoleで`[StarRailExt]`でフィルタリングが可能
- デバッグ作業の効率化とログの可読性向上

**本番環境でのログ:**
- エラーログ（console.error）は残す
- 重要な状態変更のログは残す（言語変更完了など）
- デバッグ用の詳細ログ（DEBUG接頭語付き）は削除する

## content.jsの詳細仕様

### 関数構造と責任

**重要**: 以下の関数構造は動作確認済みのため、**リファクタリング時は絶対に分割・変更してはならない**

#### 初期化系関数
- **`setup()`**: 
  - DOM要素取得（characterInfoElement, bodyElement）
  - スタイル取得（labelStyleObject, numberStyleObject, descriptionStyleObject）
  - MutationObserver設定
  - **責任**: 拡張機能の完全な初期化
  
- **`firstDraw()`**: 
  - setup()呼び出し → draw()呼び出し
  - エラーハンドリング
  - **責任**: 拡張機能の初回起動エントリーポイント

#### 描画系関数
- **`draw()`**: 
  - 言語設定更新（updateLanguageSettings()）
  - DOM要素完全再取得（characterInfoElement更新）
  - 前回スコア要素削除
  - 新しいスコア要素作成・配置
  - **責任**: スコア描画の完全な処理（**DOM再取得必須**）
  
- **`reDraw()`**: 
  - draw()のラッパー（非同期対応）
  - **責任**: キャラ変更・設定変更時の再描画

#### 言語変更処理
- **`handleLanguageChangeRedraw()`**: 
  - ページ確認 → waitForRelicItemLanguageChange() → draw()
  - **責任**: 言語変更後の再描画制御
  
- **`waitForRelicItemLanguageChange()`**: 
  - MutationObserver使用による効率的な言語変更検知
  - DOM変更を直接監視（300msポーリング廃止済み）
  - **責任**: 言語変更完了の確実な検知

### 実行フローと処理順序

#### 初期化フロー
```
window.onload → firstDraw() → setup() → draw()
                                ↓
                        DOM要素取得・スタイル取得・Observer設定
```

#### キャラ変更フロー
```
キャラクター選択（ユーザー操作）
          ↓
`.c-hrd-ri-name` 要素のテキスト変更
          ↓
characterInfoElementObserver 検知
          ↓
callback() → 文字列比較（lastCharacterName != characterName）
          ↓
lastCharacterName 更新 → reDraw() → draw()
                                    ↓
                          DOM再取得・スコア再計算・新キャラ表示
```

#### 言語変更フロー
```
言語セレクター変更検知 → handleLanguageChangeRedraw() 
                            ↓
                    waitForRelicItemLanguageChange()
                            ↓
                        draw()（DOM再取得・再描画）
```

#### カスタムサブステータス変更フロー
```
ユーザーがカスタムサブステータスボタンをクリック
          ↓
カスタムサブステータスパネルが開く
          ↓
ユーザーがサブステータス設定を変更
          ↓
パネルを閉じる（×ボタンまたは外側クリック）
          ↓
bodyElement に VAN_OVERFLOW_HIDDEN クラスが削除
          ↓
bodyElementObserver 検知
          ↓
callback() → attributes変更 && attributeName === 'class' 判定
          ↓
oldClassList に VAN_OVERFLOW_HIDDEN 含む && 現在含まない 判定
          ↓
reDraw() → draw()
          ↓
DOM再取得・新しいサブステータス設定でスコア再計算
```

#### 簡略モード変更フロー
```
ユーザーが「数値」「簡略」切り替えボタンをクリック
          ↓
bodyElement の PC_ROLE_LITE クラスが追加/削除
          ↓
liteModeElementObserver 検知
          ↓
callback() → attributes変更 && attributeName === 'class' 判定
          ↓
簡略→数値モード: oldClassList に PC_ROLE_LITE 含む && 現在含まない
          ↓
reDraw() → draw()
          ↓
DOM再取得・数値モードでスコア表示再開
```

#### SPAナビゲーション（戻るボタン）フロー
```
ユーザーが戻るボタンクリック/URLハッシュ変更
          ↓
window.popstate または window.hashchange イベント発火
          ↓
handleBackNavigation() → URL判定（/hsr 含む？）
          ↓                      ↓
   Yes（戦績画面）            No（他画面）
          ↓                      ↓
   isRedrawing フラグチェック    処理終了
          ↓
   フラグ設定 → firstDraw() → setup() + draw()
          ↓                           ↓
   500ms後フラグリセット          完全再初期化・再描画
```

### 重要な変数とDOM管理

#### グローバル変数の役割
- **`characterInfoElement`**: メインコンテナDOM参照（draw()で毎回更新必須）
- **`bodyElement`**: 監視用全体DOM参照
- **`scoreComponent`**: スコア要素作成インスタンス
- **`lastCharacterName`**: キャラ変更検知用
- **`*StyleObject`**: 元ページスタイル継承用（初期化時取得）

#### DOM要素更新の重要性
**`draw()`関数内でのDOM要素再取得は必須**:
- 言語変更後はDOM構造が変わる
- characterInfoElementを最新状態に更新
- 古いDOM参照では要素が見つからない

### 監視システムの詳細構成

#### MutationObserver（DOM変更監視）

1. **`characterInfoElementObserver`**: キャラクター切り替え検知
   - **対象**: `characterInfoElement` （`.pc-swiper-block-layout__content`）
   - **監視内容**: childList, attributes変更
   - **検知ロジック**: `.c-hrd-ri-name` 要素からキャラクター名取得 → `lastCharacterName` と比較
   - **トリガー**: 名前が異なる場合 → `lastCharacterName` 更新 → `reDraw()`実行
   - **重要**: キャラクター切り替えの主要検知メカニズム

2. **`bodyElementObserver`**: カスタムサブステータス設定変更検知  
   - **対象**: `bodyElement`のclass属性変更
   - **監視内容**: attributes変更（class属性のみ）
   - **検知ロジック**: `VAN_OVERFLOW_HIDDEN` クラスの削除タイミングを監視
   - **トリガー**: カスタムサブステータスパネルを閉じた時 → `reDraw()`実行

3. **`liteModeElementObserver`**: 簡略モード解除検知
   - **対象**: `bodyElement`のclass属性変更
   - **監視内容**: attributes変更（class属性のみ）
   - **検知ロジック**: `PC_ROLE_LITE` クラスの削除タイミングを監視
   - **トリガー**: 数値表示モードに切り替わった時 → `reDraw()`実行

4. **`languageObserver`**: 言語設定変更検知
   - **対象**: `.mhy-hoyolab-lang-selector__current-lang`
   - **監視内容**: childList, characterData, subtree変更
   - **検知ロジック**: 言語表示文字の内容変更を監視
   - **トリガー**: JP↔EN切り替え時 → `handleLanguageChangeRedraw()`実行

#### Windowイベント（SPAナビゲーション監視）

5. **`window.popstate`**: 戻るボタン・進むボタン検知
   - **対象**: ブラウザの履歴変更
   - **検知ロジック**: popstateイベント発火 + URL に `/hsr` 含むかチェック
   - **トリガー**: 戦績画面に戻った時 → `handleBackNavigation()`実行
   - **処理内容**: `isRedrawing`フラグで重複防止 + `firstDraw()`による完全再初期化
   - **重要**: SPA内での戻るボタン操作の主要検知メカニズム

6. **`window.hashchange`**: URLハッシュ変更検知
   - **対象**: URLのハッシュ部分（#以降）の変更
   - **検知ロジック**: hashchangeイベント発火 + 新URL に `/hsr` 含むかチェック
   - **トリガー**: ハッシュルートで戦績画面に遷移した時 → `handleBackNavigation()`実行
   - **重要**: SPA内のルート変更による戦績画面復帰を検知

### 動作保証要件

#### 必須動作確認項目
- **初期化**: 日本語環境での正常なスコア表示
- **キャラ変更**: 即座のスコア再計算・再表示
- **言語変更**: JP↔EN切り替え後の正常動作
- **設定変更**: カスタムサブステータス・簡略モード変更対応

#### リファクタリング時の注意事項
- ⚠️ `draw()`, `reDraw()`, `setup()`, `firstDraw()`の分割は将来的な課題（動作保証を優先）
- ❌ DOM要素再取得ロジックの変更（言語変更対応のため必須）
- ❌ 非同期処理（waitForRelicItemLanguageChange）の変更（パフォーマンス最適化済み）
- ❌ MutationObserver設定の変更（検知精度に影響）
- ❌ 言語設定更新タイミングの変更（描画前更新必須）

#### 将来のリファクタリング課題
- **関数責任分離**: 単一責任原則に基づく適切な分割
- **テスト導入**: 動作保証のためのテストファーストアプローチ
- **段階的移行**: 小さな変更を積み重ねる安全なリファクタリング

### エラーパターンと対処法

#### よくある失敗ケース
1. **「Score表記で日本語にならない」**: 言語設定更新忘れ
2. **「スコアが0になる」**: DOM要素の古い参照使用
3. **「キャラ変更で再描画されない」**: reDraw()の関数名間違い
4. **「言語変更後に動作停止」**: 存在しない関数呼び出し

#### デバッグ時の確認点
- Console で `[StarRailExt]` ログの確認
- `characterInfoElement` の最新性確認
- `currentUIStrings`, `currentStatNames` の値確認
- DOM要素の存在確認（querySelector結果）