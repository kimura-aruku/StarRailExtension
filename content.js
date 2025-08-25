window.onload = () => {
    const config = window.AppConfig;
    const MY_CLASS = config.MY_CLASS;

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
                reject(new Error(`${config.UI_STRINGS.ERROR_TIMEOUT_PREFIX} ${selector} ${config.UI_STRINGS.ERROR_TIMEOUT_SUFFIX}`));
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

    // 監視のコールバック
    const callback = (mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.target.classList && 
                    mutation.target.classList.contains(MY_CLASS)) {
                continue;
            }
            // キャラ選択
            if(observer === characterInfoElementObserver 
                && (mutation.type === 'childList' || mutation.type === 'attributes')
            ){
                const characterNameElement = mutation.target.querySelector(SELECTORS.CHARACTER_NAME);
                if(characterNameElement){
                    const characterName = characterNameElement.textContent.trim();
                    if(characterName && lastCharacterName != characterName){
                        lastCharacterName = characterName;
                        reDraw();
                    }
                }
            } 
            // カスタムサブステータス
            else if(observer === bodyElementObserver 
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
                    && mutation.target.parentElement === characterInfoElement
                ){
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
                        name: item.querySelector(SELECTORS.STAT_NAME).textContent.trim(),
                        value: numElement.textContent.trim()
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
        const PROP_NAME = config.STAT_NAMES;

        // 実数かパーセントか判断できない状態
        const isRealOrPercent = [PROP_NAME.HP, PROP_NAME.ATK, PROP_NAME.DEF]
            .includes(subPropName);
        if(isRealOrPercent && subPropValue.includes('%')){
            subPropName += '割合';
        }
        subPropValue = subPropValue.replace(/[%+]/g, '').trim();
        switch (subPropName) {
            // 実数はスコア0
            case PROP_NAME.HP:
            case PROP_NAME.ATK:
            case PROP_NAME.DEF:
                return 0;
            // 会心ダメージ、撃破特攻
            case PROP_NAME.CRIT_DMG:
            case PROP_NAME.BREAK_EFFECT:
                return subPropValue;
            // 会心率
            case PROP_NAME.CRIT_RATE:
                return subPropValue * config.SCORE_COEFFICIENTS.CRIT_RATE_MULTIPLIER;
            // 攻撃力%、HP%、効果命中、効果抵抗
            case PROP_NAME.ATK_PERCENT:
            case PROP_NAME.HP_PERCENT:
            case PROP_NAME.EFFECT_HIT_RATE:
            case PROP_NAME.EFFECT_RES:
                return subPropValue * config.SCORE_COEFFICIENTS.ATK_HP_EFFECT_MULTIPLIER;
            // 防御%
            case PROP_NAME.DEF_PERCENT:
                return subPropValue * config.SCORE_COEFFICIENTS.DEF_MULTIPLIER;
            // 速度
            case PROP_NAME.SPD:
                return (config.SCORE_COEFFICIENTS.SPEED_BASE / config.SCORE_COEFFICIENTS.SPEED_DIVISOR) * subPropValue;
            default:
                return 0;
        }
    }

    // 描画
    function draw(){
        if (!characterInfoElement) {
            console.log(config.UI_STRINGS.ERROR_NO_RELIC_LIST);
            return;
        }
        if (!scoreComponent) {
            console.log(config.UI_STRINGS.ERROR_NO_SCORE_COMPONENT);
            return;
        }
        
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
                    scoreLabel: config.UI_STRINGS.SCORE_LABEL,
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
                scoreDescription: config.UI_STRINGS.SCORE_DESCRIPTION,
                totalScoreLabel: config.UI_STRINGS.TOTAL_SCORE_LABEL,
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
            await setup();
            draw();
        } catch (error) {
            console.error(config.UI_STRINGS.LOG_ERROR_PREFIX, error);
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
            
            isRedrawing = true;
            try {
                await firstDraw();
            } catch (error) {
                console.error('戻るボタン後の再描画エラー:', error);
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

    console.log(config.UI_STRINGS.LOG_EXTENSION_START);
    setupBackButtonDetection();
    firstDraw();
};