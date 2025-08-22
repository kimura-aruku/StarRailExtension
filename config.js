// アプリケーション設定ファイル
const AppConfig = {
    // 基本設定
    MY_CLASS: 'alk-element',
    
    // スコア計算係数
    SCORE_COEFFICIENTS: {
        CRIT_RATE_MULTIPLIER: 2.0,        // 会心率の係数
        ATK_HP_EFFECT_MULTIPLIER: 1.5,    // 攻撃力%、HP%、効果命中、効果抵抗の係数
        DEF_MULTIPLIER: 1.2,              // 防御%の係数
        SPEED_BASE: 64.8,                 // 速度計算の基準値
        SPEED_DIVISOR: 25.0               // 速度計算の除数
    },
    
    // CSS関連の固定値
    STYLES: {
        SCORE_TEXT_COLOR: 'rgba(255,255,255,0.9)',
        TOTAL_SCORE_HEIGHT: 'calc(28px * 1.2)',
        TOTAL_SCORE_LINE_HEIGHT: 'calc(28px * 1.2)',
        TOTAL_SCORE_PADDING_RIGHT: '6px',
        TOTAL_SCORE_LABEL_PADDING_LEFT: '19%',
        BACKGROUND_POSITION: 'position: absolute; top: 0; left: 0; right: 0; bottom: 0;'
    },
    
    // UI表示文字列
    UI_STRINGS: {
        SCORE_LABEL: 'スコア',
        TOTAL_SCORE_LABEL: '合計スコア',
        SCORE_DESCRIPTION: 'スコアは有効サブステータスから算出されます。',
        ERROR_NO_RELIC_LIST: '遺物リスト要素が取得できないので描画失敗',
        ERROR_NO_SCORE_COMPONENT: 'スコアコンポーネントが初期化されていません',
        ERROR_TIMEOUT_PREFIX: 'Timeout: 要素',
        ERROR_TIMEOUT_SUFFIX: 'が見つかりませんでした',
        LOG_EXTENSION_START: '拡張処理開始',
        LOG_ERROR_PREFIX: 'エラー:'
    },
    
    // CSS監視関連のクラス名
    MONITOR_CLASSES: {
        VAN_OVERFLOW_HIDDEN: 'van-overflow-hidden',
        PC_ROLE_LITE: 'pc-role-lite'
    },
    
    // ステータス名の定数
    STAT_NAMES: {
        HP: 'HP',
        HP_PERCENT: 'HP割合',
        ATK: '攻撃力',
        ATK_PERCENT: '攻撃力割合',
        DEF: '防御力',
        DEF_PERCENT: '防御力割合',
        SPD: '速度',
        CRIT_RATE: '会心率',
        CRIT_DMG: '会心ダメージ',
        BREAK_EFFECT: '撃破特効',
        EFFECT_HIT_RATE: '効果命中',
        EFFECT_RES: '効果抵抗'
    },
    
    // タイムアウト設定
    TIMEOUTS: {
        ELEMENT_WAIT: 10000  // 要素待機のタイムアウト（ミリ秒）
    },
    
    // 監視設定
    OBSERVER_OPTIONS: {
        CHARACTER_INFO: { // キャラクター切り替え検知用
            childList: true,
            attributes: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: false,
            attributeOldValue: false
        },
        CUSTOM_SUBSTAT: { // カスタムサブステータス変更検知用
            childList: false,
            attributes: true,
            subtree: false,
            characterData: false,
            characterDataOldValue: false,
            attributeOldValue: true,
            attributeFilter: ['class']
        },
        LITE_MODE: { // 簡略モード解除検知用
            childList: false,
            attributes: true,
            subtree: true,
            characterData: false,
            characterDataOldValue: false,
            attributeOldValue: true,
            attributeFilter: ['class']
        }
    },
    
    // スタイルコピー対象プロパティ
    STYLE_PROPERTIES: ['font-size', 'text-align', 'font-family', 'color', 'font-weight']
};

// グローバルに公開
window.AppConfig = AppConfig;