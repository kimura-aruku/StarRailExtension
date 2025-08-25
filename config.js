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
    
    // 言語別UI表示文字列
    UI_STRINGS: {
        JP: {
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
        EN: {
            SCORE_LABEL: 'Score',
            TOTAL_SCORE_LABEL: 'Total Score',
            SCORE_DESCRIPTION: 'Scores are calculated from effective sub-stats.',
            ERROR_NO_RELIC_LIST: 'Failed to render: relic list element not found',
            ERROR_NO_SCORE_COMPONENT: 'Score component is not initialized',
            ERROR_TIMEOUT_PREFIX: 'Timeout: element',
            ERROR_TIMEOUT_SUFFIX: 'was not found',
            LOG_EXTENSION_START: 'Extension processing started',
            LOG_ERROR_PREFIX: 'Error:'
        }
    },
    
    // CSS監視関連のクラス名
    MONITOR_CLASSES: {
        VAN_OVERFLOW_HIDDEN: 'van-overflow-hidden',
        PC_ROLE_LITE: 'pc-role-lite'
    },
    
    // 言語別ステータス名の定数
    STAT_NAMES: {
        JP: {
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
            EFFECT_RES: '効果抵抗',
            ENERGY_REGEN: 'EP回復効率',
            PERCENT_SUFFIX: '割合'
        },
        EN: {
            HP: 'HP',
            HP_PERCENT: 'HP Percentage',
            ATK: 'ATK',
            ATK_PERCENT: 'ATK Percentage',
            DEF: 'DEF',
            DEF_PERCENT: 'DEF Percentage',
            SPD: 'SPD',
            CRIT_RATE: 'CRIT Rate',
            CRIT_DMG: 'CRIT DMG',
            BREAK_EFFECT: 'Break Effect',
            EFFECT_HIT_RATE: 'Effect Hit Rate',
            EFFECT_RES: 'Effect RES',
            ENERGY_REGEN: 'Energy Regeneration Rate',
            PERCENT_SUFFIX: ' Percentage'
        }
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
    STYLE_PROPERTIES: ['font-size', 'text-align', 'font-family', 'color', 'font-weight'],
    
    // 言語検知と設定取得のヘルパー関数
    getCurrentLanguage() {
        const langElement = document.querySelector('.mhy-hoyolab-lang-selector__current-lang');
        if (langElement) {
            const langText = langElement.textContent.trim();
            return langText === 'JP' ? 'JP' : 'EN'; // JP以外はすべてENとして扱う
        }
        return 'JP'; // デフォルトは日本語
    },
    
    getUIStrings() {
        const currentLang = this.getCurrentLanguage();
        return this.UI_STRINGS[currentLang];
    },
    
    getStatNames() {
        const currentLang = this.getCurrentLanguage();
        return this.STAT_NAMES[currentLang];
    }
};

// グローバルに公開
window.AppConfig = AppConfig;