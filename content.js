window.onload = () => {
    const config = window.AppConfig;
    const MY_CLASS = config.MY_CLASS;
    
    // 言語対応の設定取得
    let currentUIStrings = config.getUIStrings();
    let currentStatNames = config.getStatNames();
    
    // 言語設定を更新する関数
    function updateLanguageSettings() {
        currentUIStrings = config.getUIStrings();
        currentStatNames = config.getStatNames();
    }
    
    // テキストを正規化する関数
    function normalizeText(text) {
        if (!text) return '';
        // 非改行スペース(&nbsp;)を通常スペースに変換し、前後の空白を除去
        return text.replace(/\u00A0/g, ' ').trim();
    }

    // HoyoLabページのセレクタ定数
    const SELECTORS = {
        MAIN_CONTENT: '.pc-swiper-block-layout__content', // メインコンテンツエリア
        CHARACTER_NAME: '.c-hrd-ri-name', // キャラクター名
        ROLE_DETAIL_NUM: '.pc-role-detail-num', // 全体要素
        RELIC_ITEM: '.c-hrdr-item', // 遺物アイテム
        RELIC_BOTTOM_AREA: '.c-hrdrs-btm', // 遺物下部エリア
        STAT_ITEM: '.c-hrdr-btm-item', // ステータス行
        STAT_NAME: '.c-hrdr-name', // ステータス名
        STAT_NUMBER: '.c-hrdr-num', // ステータス数値
        CHARACTER_STATS_NAME: '.c-hrdcs-name', // キャラクターステータス名
        CHARACTER_STATS_NUMBER: '.c-hrdcs-num', // キャラクターステータス数値
        DESCRIPTION_TIP: '.c-hrdrs-title-tip' // 説明テキスト
    };

    // スコアコンポーネントのインスタンス
    let scoreComponent;

    // キャラ親要素
    /** @type {HTMLElement | null} */
    let characterInfoElement;

    // 画面全体要素
    /** @type {HTMLElement | null} */
    let bodyElement;

    // 前回表示されたキャラ名
    /** @type {string} */
    let lastCharacterName;

    // スタイルそのものを保持しているとバグったので辞書にキャッシュ
    // オリジナルの数値スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let numberStyleObject = {};

    // オリジナルの説明文スタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let descriptionStyleObject = {};

    // オリジナルのラベルスタイルオブジェクト
    /** @type {{ [key: string]: string }} */
    let labelStyleObject = {};

    // キャラ情報の監視オブジェクト
    let characterInfoElementObserver;
    // カスタムサブステータス押下の監視オブジェクト
    let bodyElementObserver;
    // 簡略モードの監視オブジェクト
    let liteModeElementObserver;
    // 言語変更待機の監視オブジェクト
    let languageChangeWaitObserver;
    // メインコンテンツ存在監視オブジェクト
    let mainContentExistenceObserver;

    // 汎用的な要素待機関数
    function waitForElement(selector, validate = (el) => !!el, 
        options = { childList: true, subtree: true, attributes: true }) {
        return new Promise((resolve, reject) => {
            const anyObserver = new MutationObserver((mutationsList, observer) => {
                const element = document.querySelector(selector);
                if (element && (validate == null || validate(element))) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            // DOMの変更を監視
            anyObserver.observe(document.body, options);

            // タイムアウト処理
            setTimeout(() => {
                anyObserver.disconnect();
                reject(new Error(`${currentUIStrings.ERROR_TIMEOUT_PREFIX} ${selector} ${currentUIStrings.ERROR_TIMEOUT_SUFFIX}`));
            }, config.TIMEOUTS.ELEMENT_WAIT);
        });
    }

    // 親要素取得
    function getCharacterInfoElements() {
        return waitForElement(SELECTORS.MAIN_CONTENT, 
            (el) => el.querySelector(SELECTORS.CHARACTER_NAME)?.textContent.trim().length > 0);
    }

    // 全体
    function getBodyElements() {
        return waitForElement(SELECTORS.ROLE_DETAIL_NUM, null);
    }

    // デバウンス用のタイマー
    let characterChangeDebounceTimer;
    
    // 初期化状態の管理
    let isInitializing = true;
    
    
    // 監視のコールバック
    const callback = (mutationsList, observer) => {
        // キャラクター変更の場合、デバウンス処理を適用（初期化中は除く）
        if(observer === characterInfoElementObserver && !isInitializing) {
            // デバウンス: 50ms内の連続変更は最後のもののみ処理
            clearTimeout(characterChangeDebounceTimer);
            characterChangeDebounceTimer = setTimeout(() => {
                const characterNameElement = characterInfoElement.querySelector(SELECTORS.CHARACTER_NAME);
                if(characterNameElement){
                    const characterName = characterNameElement.textContent.trim();
                    if(characterName && characterName !== lastCharacterName){
                        console.log('[StarRailExt] [ALL_CHAR_DEBUG] キャラ変更検知 - 旧:', lastCharacterName, '新:', characterName);
                        lastCharacterName = characterName;
                        reDraw();
                    }
                }
            }, 50);
            return;
        }
        
        for (let mutation of mutationsList) {
            if (mutation.target.classList && 
                    mutation.target.classList.contains(MY_CLASS)) {
                continue;
            } 
            // カスタムサブステータス
            if(observer === bodyElementObserver 
                && mutation.type === 'attributes' 
                && mutation.attributeName  === 'class'
            ){
                const oldClassString = mutation.oldValue || '';
                const oldClassList = oldClassString.split(' ').filter(Boolean);
                const className = config.MONITOR_CLASSES.VAN_OVERFLOW_HIDDEN;
                // カスタムサブステータスを閉じたとき（=hiddenがなくなったとき）
                if(oldClassList.includes(className)
                    && !mutation.target.classList.contains(className)
                ){
                    console.log('[StarRailExt] [ALL_CHAR_DEBUG] カスタムサブステータス変更検知');
                    reDraw();
                }
            }
            // 簡略モード解除
            else if(observer === liteModeElementObserver 
                && mutation.type === 'attributes' 
                && mutation.attributeName  === 'class'
            ){
                const oldClassString = mutation.oldValue || '';
                const oldClassList = oldClassString.split(' ').filter(Boolean);
                const className = config.MONITOR_CLASSES.PC_ROLE_LITE;
                
                // カスタムサブステータスを閉じたとき（=liteがなくなったとき）
                if(oldClassList.includes(className)
                    && !mutation.target.classList.contains(className)
                    && mutation.target.classList.contains('pc-role-detail')
                ){
                    console.log('[StarRailExt] [ALL_CHAR_DEBUG] 簡略モード解除検知');
                    reDraw();
                }
            }
        }
    };


    // 監視を再設定する関数
    function setObservers() {
        // キャラ名
        if (characterInfoElementObserver) {
            characterInfoElementObserver.disconnect();
        }
        characterInfoElementObserver = new MutationObserver(callback);
        characterInfoElementObserver.observe(characterInfoElement, 
            config.OBSERVER_OPTIONS.CHARACTER_INFO);
        // カスタムサブステータス
        if(bodyElementObserver){
            bodyElementObserver.disconnect();
        }
        bodyElementObserver = new MutationObserver(callback);
        bodyElementObserver.observe(bodyElement, 
            config.OBSERVER_OPTIONS.CUSTOM_SUBSTAT);
        // 簡略モード
        if(liteModeElementObserver){
            liteModeElementObserver.disconnect();
        }
        liteModeElementObserver = new MutationObserver(callback);
        liteModeElementObserver.observe(bodyElement, 
            config.OBSERVER_OPTIONS.LITE_MODE);
    }

    // スコアを計算し返す
    function calculateScore(relicElement){
        // メインステータスを除く、有効サブステータス
        const supPropNameAndValues = Array.from(relicElement.querySelectorAll(SELECTORS.STAT_ITEM))
            .slice(1)
            .map(item => {
                const numElement = item.querySelector(SELECTORS.STAT_NUMBER);
                return numElement?.getAttribute('highlight') === 'true'
                    ? {
                        name: normalizeText(item.querySelector(SELECTORS.STAT_NAME).textContent),
                        value: normalizeText(numElement.textContent)
                    }
                    : null;
            })
            .filter(Boolean);
        let score = 0;
        // 1件目はメインステータスなので無視
        supPropNameAndValues.forEach(supPropNameAndValue => {
            score += Number(getScore(supPropNameAndValue.name
                , supPropNameAndValue.value));
        });
        return Math.floor(score * 100) / 100;
    }

    // 数値オリジナル要素のスタイルをコピー
    function applyOriginalNumberStyle(element){
        Object.assign(element.style, numberStyleObject);
    }

    // 説明文オリジナル要素のスタイルをコピー
    function applyOriginalDescriptionStyle(element){
        Object.assign(element.style, descriptionStyleObject);
    }

    // 項目名オリジナル要素のスタイルをコピー
    function applyOriginalLabelStyle(element){
        Object.assign(element.style, labelStyleObject);
    }

    // スコアにして返す
    function getScore(subPropName, subPropValue){
        const PROP_NAME = currentStatNames;
        

        // 実数かパーセントか判断できない状態
        const isRealOrPercent = [PROP_NAME.HP, PROP_NAME.ATK, PROP_NAME.DEF]
            .includes(subPropName);
        if(isRealOrPercent && subPropValue.includes('%')){
            // 言語に応じたパーセント接尾辞を付加
            subPropName += PROP_NAME.PERCENT_SUFFIX;
        }
        subPropValue = subPropValue.replace(/[%+]/g, '').trim();
        
        let score = 0;
        switch (subPropName) {
            // 実数はスコア0
            case PROP_NAME.HP:
            case PROP_NAME.ATK:
            case PROP_NAME.DEF:
                score = 0;
                break;
            // 会心ダメージ、撃破特攻
            case PROP_NAME.CRIT_DMG:
            case PROP_NAME.BREAK_EFFECT:
                score = subPropValue;
                break;
            // 会心率
            case PROP_NAME.CRIT_RATE:
                score = subPropValue * config.SCORE_COEFFICIENTS.CRIT_RATE_MULTIPLIER;
                break;
            // 攻撃力%、HP%、効果命中、効果抵抗
            case PROP_NAME.ATK_PERCENT:
            case PROP_NAME.HP_PERCENT:
            case PROP_NAME.EFFECT_HIT_RATE:
            case PROP_NAME.EFFECT_RES:
                score = subPropValue * config.SCORE_COEFFICIENTS.ATK_HP_EFFECT_MULTIPLIER;
                break;
            // 防御%
            case PROP_NAME.DEF_PERCENT:
                score = subPropValue * config.SCORE_COEFFICIENTS.DEF_MULTIPLIER;
                break;
            // 速度
            case PROP_NAME.SPD:
                score = (config.SCORE_COEFFICIENTS.SPEED_BASE / config.SCORE_COEFFICIENTS.SPEED_DIVISOR) * subPropValue;
                break;
            default:
                score = 0;
        }
        
        return score;
    }

    // 描画
    function draw(){

        console.log('[StarRailExt] [ALL_CHAR_DEBUG] draw() 開始 - characterInfoElement:', !!characterInfoElement);

        // 言語設定を最新に更新
        updateLanguageSettings();

        if (!characterInfoElement) {
            console.log('[StarRailExt] ERROR: characterInfoElement が null');
            console.log('[StarRailExt]', currentUIStrings.ERROR_NO_RELIC_LIST);
            return;
        }
        if (!scoreComponent) {
            console.log('[StarRailExt] ERROR: scoreComponent が null');
            console.log('[StarRailExt]', currentUIStrings.ERROR_NO_SCORE_COMPONENT);
            return;
        }
        
        // DOM要素を完全に再取得（言語変更後の更新のため）
        const freshCharacterInfo = document.querySelector(SELECTORS.MAIN_CONTENT);
        if (!freshCharacterInfo) {
            console.warn('[StarRailExt] ERROR: メインコンテンツが見つかりません');
            return;
        }
        
        // characterInfoElementを更新
        characterInfoElement = freshCharacterInfo;
        
        scoreComponent.removeAllScoreElements(characterInfoElement, config.MY_CLASS);
        
        // 遺物要素
        const relicElements = characterInfoElement.querySelectorAll(SELECTORS.RELIC_ITEM);
        // 遺物を1つも装備していない場合は描画しない
        if(relicElements.length == 0){
            return;
        }
        
        let totalScore = 0;
        
        // 遺物の数だけスコア描画
        for(let i = 0; i < relicElements.length; i++){
            const parent = relicElements[i];
            const firstItem = parent.querySelector(SELECTORS.STAT_ITEM);
            const backgroundColor = window.getComputedStyle(firstItem)['background-color'];
            const score = calculateScore(parent);
            totalScore += score;
            
            const relicScoreElement = scoreComponent.createRelicScoreElement(
                score, backgroundColor, firstItem, SELECTORS, {
                    scoreLabel: currentUIStrings.SCORE_LABEL,
                    scoreTextColor: config.STYLES.SCORE_TEXT_COLOR,
                    backgroundPosition: config.STYLES.BACKGROUND_POSITION,
                    elementClass: config.MY_CLASS
                }
            );
            if (relicScoreElement) {
                parent.append(relicScoreElement);
            }
        }
        
        // 合計スコア用のスタイル
        const styleApplyFunctions = {
            applyOriginalDescriptionStyle,
            applyOriginalLabelStyle,
            applyOriginalNumberStyle
        };
        
        const totalScoreElement = scoreComponent.createTotalScoreElement(
            totalScore, styleApplyFunctions, {
                scoreDescription: currentUIStrings.SCORE_DESCRIPTION,
                totalScoreLabel: currentUIStrings.TOTAL_SCORE_LABEL,
                containerHeight: config.STYLES.TOTAL_SCORE_HEIGHT,
                containerPaddingRight: config.STYLES.TOTAL_SCORE_PADDING_RIGHT,
                containerLineHeight: config.STYLES.TOTAL_SCORE_LINE_HEIGHT,
                labelPaddingLeft: config.STYLES.TOTAL_SCORE_LABEL_PADDING_LEFT
            }
        );
        
        if (totalScoreElement) {
            const relicListElement = characterInfoElement.querySelector(SELECTORS.RELIC_BOTTOM_AREA);
            relicListElement.parentNode.append(totalScoreElement);
        }
        
        // DOM要素が更新されたのでObserverを再設定
        setObservers();
        
    }

    // 非同期処理を分離
    async function reDraw() {
        draw();
    }

    // 最初に実行
    async function setup(){
        // スコアコンポーネントを初期化
        scoreComponent = new window.ScoreComponent();
        
        // キャラ名
        characterInfoElement = await getCharacterInfoElements();
        lastCharacterName = characterInfoElement
            .querySelector(SELECTORS.CHARACTER_NAME).textContent.trim();
        // ボディ
        bodyElement = await getBodyElements();

        // コピー対象のスタイルプロパティ
        const allowedProperties = config.STYLE_PROPERTIES;
        // // 項目ラベル用のスタイル取得
        const nameElement = characterInfoElement.querySelector(SELECTORS.CHARACTER_STATS_NAME);
        const nameTextStyle = window.getComputedStyle(nameElement);
        for (let style of allowedProperties) {
            labelStyleObject[style] = nameTextStyle.getPropertyValue(style);
        }
        // 数値用スタイル取得
        const numberElement = characterInfoElement.querySelector(SELECTORS.CHARACTER_STATS_NUMBER);
        const numberTextStyle = window.getComputedStyle(numberElement);
        for (let style of allowedProperties) {
            numberStyleObject[style] = numberTextStyle.getPropertyValue(style);
        }
        // 説明用のスタイル取得
        const descriptionElement = characterInfoElement.querySelector(SELECTORS.DESCRIPTION_TIP);
        const descriptionTextStyle = window.getComputedStyle(descriptionElement);
        for (let style of allowedProperties) {
            descriptionStyleObject[style] = descriptionTextStyle.getPropertyValue(style);
        }
        // 変更監視開始
        setObservers();
    }

    // スコア要素作成
    async function firstDraw(){
        try {
            console.log('[StarRailExt] [ALL_CHAR_DEBUG] firstDraw() 開始');
            await setup();
            draw();
            // 初期化完了後、少し待ってからObserverを有効化
            setTimeout(() => {
                isInitializing = false;
                console.log('[StarRailExt] [ALL_CHAR_DEBUG] 初期化完了');
            }, 100);
        } catch (error) {
            console.error('[StarRailExt]', currentUIStrings.LOG_ERROR_PREFIX, error);
        }
    }

    // 言語変更後の再描画処理（最初のc-hrdr-itemが期待言語になるまで待機）
    async function handleLanguageChangeRedraw(fromLang, toLang) {

        try {
            console.log('[StarRailExt] [ALL_CHAR_DEBUG] 言語変更検知:', fromLang, '→', toLang);

            // 現在のページが戦績画面かチェック
            if (!location.href.includes('/hsr')) {
                return;
            }

            // すべてのc-hrdr-itemが期待する言語になるまで待機
            await waitForRelicItemLanguageChange();

            draw();
            
        } catch (error) {
            console.error('[StarRailExt] 言語変更後の再描画エラー:', error);
        }
    }
    
    // すべてのc-hrdr-itemが期待する言語になるまで待機する関数
    function waitForRelicItemLanguageChange() {
        return new Promise((resolve, reject) => {
            // 既存のObserverがあればクリーンアップ
            if (languageChangeWaitObserver) {
                languageChangeWaitObserver.disconnect();
                languageChangeWaitObserver = null;
            }
            
            const timeout = setTimeout(() => {
                if (languageChangeWaitObserver) {
                    languageChangeWaitObserver.disconnect();
                    languageChangeWaitObserver = null;
                }
                console.warn('[StarRailExt] 言語変更チェックがタイムアウトしました');
                resolve();
            }, config.TIMEOUTS.ELEMENT_WAIT);
            
            const checkLanguage = () => {
                // すべての遺物アイテムを取得
                const allRelicItems = document.querySelectorAll(SELECTORS.RELIC_ITEM);
                if (!allRelicItems || allRelicItems.length === 0) {
                    return false;
                }
                
                const currentDetectedLang = config.getCurrentLanguage();
                const expectedStatNames = config.STAT_NAMES[currentDetectedLang];
                
                // すべての遺物アイテムをチェック（スコア計算と同じロジックを使用）
                let allItemsReady = true;
                const totalStatNames = [];
                
                for (let i = 0; i < allRelicItems.length; i++) {
                    const relicItem = allRelicItems[i];
                    
                    // スコア計算と同じロジック：メインステータス（1つ目）を除外してチェック
                    const statItems = relicItem.querySelectorAll(SELECTORS.STAT_ITEM);
                    if (statItems.length === 0) {
                        allItemsReady = false;
                        break;
                    }
                    
                    // 1つ目を除外（メインステータス）+ 拡張機能要素を除外
                    const subStatItems = Array.from(statItems).slice(1).filter(item => {
                        // 拡張機能が追加した要素を除外
                        return !item.classList.contains(config.MY_CLASS);
                    });
                    const actualStatNames = subStatItems.map(item => {
                        const nameElement = item.querySelector(SELECTORS.STAT_NAME);
                        return nameElement ? normalizeText(nameElement.textContent) : null;
                    }).filter(Boolean);
                    
                    totalStatNames.push(...actualStatNames);
                    
                    // この遺物アイテムのステータス名が期待される言語のものと一致するかチェック
                    const itemMatches = actualStatNames.every(statName => 
                        Object.values(expectedStatNames).includes(statName)
                    );
                    
                    if (!itemMatches || actualStatNames.length === 0) {
                        allItemsReady = false;
                        break;
                    }
                }
                
                if (allItemsReady && totalStatNames.length > 0) {
                    clearTimeout(timeout);
                    if (languageChangeWaitObserver) {
                        languageChangeWaitObserver.disconnect();
                        languageChangeWaitObserver = null;
                    }
                    resolve();
                    return true;
                }
                return false;
            };
            
            // 初回チェック
            if (checkLanguage()) {
                return;
            }
            
            // MutationObserverで変更を監視
            languageChangeWaitObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    // 拡張機能自体の変更は無視
                    if (mutation.target.classList && mutation.target.classList.contains(config.MY_CLASS)) {
                        continue;
                    }
                    
                    // 遺物関連の変更をチェック
                    if (mutation.type === 'childList' || 
                        (mutation.type === 'characterData' && 
                         mutation.target.parentElement && 
                         mutation.target.parentElement.closest(SELECTORS.STAT_NAME))) {
                        checkLanguage();
                    }
                }
            });
            
            // document全体を監視（subtree: trueで子要素の変更も監視）
            languageChangeWaitObserver.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        });
    }

    // 言語変更検知のための監視設定
    function setupLanguageChangeDetection() {
        // 言語セレクター要素の直接監視（最も効率的で正確）
        const langSelector = document.querySelector('.mhy-hoyolab-lang-selector__current-lang');
        if (langSelector) {
            const languageObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        const oldLang = mutation.oldValue;
                        const newLang = langSelector.textContent.trim();
                        if (oldLang && newLang && oldLang !== newLang) {
                            // 言語変更後の再描画処理（メニューが閉じるまで待機）
                            handleLanguageChangeRedraw(oldLang, newLang);
                        }
                    }
                });
            });
            languageObserver.observe(langSelector, {
                childList: true,
                characterData: true,
                characterDataOldValue: true,
                subtree: true
            });
        } else {
            console.warn('[StarRailExt] 言語セレクター要素が見つかりません。言語変更の自動検知は無効です。');
        }
    }

    // HoyoLab戻るボタン検知のための監視設定
    function setupBackButtonDetection() {
        let isRedrawing = false; // 再描画中フラグ
        
        // 戻るボタン後のDOM要素待機と再初期化
        async function handleBackNavigation() {
            if (isRedrawing) {
                return;
            }

            console.log('[StarRailExt] [ALL_CHAR_DEBUG] SPAナビゲーション検知（戻る/進む/ハッシュ変更）');

            isRedrawing = true;
            isInitializing = true; // SPA遷移時も初期化状態に戻す
            try {
                await firstDraw();
            } catch (error) {
                console.error('[StarRailExt] 戻るボタン後の再描画エラー:', error);
            } finally {
                // 500ms後にフラグをリセット（次の戻るボタンに備える）
                setTimeout(() => {
                    isRedrawing = false;
                }, 500);
            }
        }
        
        // popstateイベント監視（SPAナビゲーション検知）
        window.addEventListener('popstate', (event) => {
            // 戦績画面かチェック
            if (location.href.includes('/hsr')) {
                handleBackNavigation();
            }
        });
        
        // hashchangeイベント監視（URLハッシュ変更検知）
        window.addEventListener('hashchange', (event) => {
            // 戦績画面かチェック
            if (event.newURL.includes('/hsr')) {
                handleBackNavigation();
            }
        });
    }

    // メインコンテンツ存在監視設定
    function setupMainContentExistenceDetection() {
        console.log('[StarRailExt] [ALL_CHAR_DEBUG] メインコンテンツ存在監視を設定');

        // .pc-swiper-block-layout__content の親要素を監視
        const parentContainer = document.querySelector('.pc-swiper-block-layout') || document.body;

        mainContentExistenceObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // .pc-swiper-block-layout__content が新規追加されたかチェック
                    const addedNodes = Array.from(mutation.addedNodes);
                    const hasMainContent = addedNodes.some(node =>
                        node.nodeType === Node.ELEMENT_NODE &&
                        (node.matches(SELECTORS.MAIN_CONTENT) ||
                         node.querySelector(SELECTORS.MAIN_CONTENT))
                    );

                    if (hasMainContent) {
                        console.log('[StarRailExt] [ALL_CHAR_DEBUG] メインコンテンツ再構築検知 - 再初期化実行');
                        // 完全再初期化
                        isInitializing = true;
                        firstDraw();
                    }
                }
            }
        });

        mainContentExistenceObserver.observe(parentContainer, {
            childList: true,
            subtree: true
        });
    }

    setupLanguageChangeDetection(); // 言語変更検知
    setupBackButtonDetection();
    setupMainContentExistenceDetection(); // メインコンテンツ存在監視
    firstDraw();
};