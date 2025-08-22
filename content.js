window.onload = () => {
    const MY_CLASS = 'alk-element';

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
                reject(new Error(`Timeout: 要素 ${selector} が見つかりませんでした`));
            }, 10000);
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
                const className = 'van-overflow-hidden';
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
                const className = 'pc-role-lite';
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
        characterInfoElementObserver.observe(characterInfoElement, {
            childList: true,
            attributes: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: false,
            attributeOldValue: false
        });
        // カスタムサブステータス
        if(bodyElementObserver){
            bodyElementObserver.disconnect();
        }
        bodyElementObserver = new MutationObserver(callback);
        bodyElementObserver.observe(bodyElement, {
            childList: false,
            attributes: true,
            subtree: false,
            characterData: false,
            characterDataOldValue: false,
            attributeOldValue: true,
            attributeFilter: ['class']
        });
        // 簡略モード
        if(liteModeElementObserver){
            liteModeElementObserver.disconnect();
        }
        liteModeElementObserver = new MutationObserver(callback);
        liteModeElementObserver.observe(bodyElement, {
            childList: false,
            attributes: true,
            subtree: true,
            characterData: false,
            characterDataOldValue: false,
            attributeOldValue: true,
            attributeFilter: ['class']
        });
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
        const PROP_NAME = Object.freeze({
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
        });

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
                return subPropValue * 2.0;
            // 攻撃力%、HP%、効果命中、効果抵抗
            case PROP_NAME.ATK_PERCENT:
            case PROP_NAME.HP_PERCENT:
            case PROP_NAME.EFFECT_HIT_RATE:
            case PROP_NAME.EFFECT_RES:
                return subPropValue * 1.5;
            // 防御%
            case PROP_NAME.DEF_PERCENT:
                return subPropValue * 1.2;
            // 速度
            case PROP_NAME.SPD:
                return (64.8/25.0) * subPropValue;
            default:
                return 0;
        }
    }

    // 描画
    function draw(){
        if (!characterInfoElement) {
            console.log('遺物リスト要素が取得できないので描画失敗');
            return;
        }
        characterInfoElement.querySelectorAll(`.${MY_CLASS}`).forEach(element => {
            element.remove();
        });
        // 遺物要素
        const relicElements = characterInfoElement.querySelectorAll(SELECTORS.RELIC_ITEM);
        // 聖遺物を1つも装備していない場合は描画しない
        if(relicElements.length == 0){
            return;
        }
        let scores = 0;
        // 聖遺物の数だけスコア描画
        for(let i = 0; i < relicElements.length; i++){
            const parent = relicElements[i];
            // メインステータス行
            const firstItem = parent.querySelector(SELECTORS.STAT_ITEM);
            const backgroundColor = window.getComputedStyle(firstItem)['background-color'];
            const clonedElement = firstItem.cloneNode(true);
            clonedElement.querySelectorAll('canvas').forEach(el => el.remove());
            clonedElement.querySelectorAll('img').forEach(el => el.remove());
            clonedElement.querySelectorAll('[highlight]').forEach(child => {
                child.removeAttribute('highlight');
            });
            const score = calculateScore(parent);
            scores += score;
            
            clonedElement.classList.add(MY_CLASS);
            const clonedNameElement = clonedElement.querySelector(SELECTORS.STAT_NAME);
            clonedNameElement.textContent = 'スコア';
            clonedNameElement.style.color = 'rgba(255,255,255,0.9)';
            const clonedNumebrElement = clonedElement.querySelector(SELECTORS.STAT_NUMBER);
            clonedNumebrElement.textContent = score.toFixed(2);
            
            // 背景用のdivを作成
            const backgroundDiv = document.createElement('div');
            backgroundDiv.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0;';
            backgroundDiv.style.backgroundColor = backgroundColor;
            // 親要素に追加
            clonedElement.style.position = 'relative';
            clonedElement.appendChild(backgroundDiv);
            parent.append(clonedElement);
        }
        // 合計スコア
        const totalScoreElement = document.createElement('div');
        totalScoreElement.style.display = 'flex';
        totalScoreElement.classList.add(MY_CLASS);
        // キャプション
        const captionSpan = document.createElement('span');
        applyOriginalDescriptionStyle(captionSpan);
        captionSpan.textContent = 'スコアは有効サブステータスから算出されます。';
        captionSpan.style.marginRight = 'auto';
        totalScoreElement.appendChild(captionSpan);
        // ラベル
        const totalLabelSpan = document.createElement('span');
        applyOriginalLabelStyle(totalLabelSpan);
        totalLabelSpan.textContent = '合計スコア';
        totalLabelSpan.style.paddingLeft = '19%';
        totalScoreElement.appendChild(totalLabelSpan);
        // スコア数値
        const totalScoreSpan = document.createElement('span');
        applyOriginalNumberStyle(totalScoreSpan);
        totalScoreSpan.textContent = scores.toFixed(2);
        totalScoreSpan.style.marginLeft = 'auto';
        totalScoreElement.appendChild(totalScoreSpan);
        // ラベル+スコア数値
        totalScoreElement.style.height = 'calc(28px * 1.2)';
        totalScoreElement.style.paddingRight = '6px';
        totalScoreElement.style.lineHeight = 'calc(28px * 1.2)';
        const relicListElement = characterInfoElement.querySelector(SELECTORS.RELIC_BOTTOM_AREA);
        relicListElement.parentNode.append(totalScoreElement);
    }

    // 非同期処理を分離
    async function reDraw() {
        draw();
    }

    // 最初に実行
    async function setup(){
        // キャラ名
        characterInfoElement = await getCharacterInfoElements();
        lastCharacterName = characterInfoElement
            .querySelector(SELECTORS.CHARACTER_NAME).textContent.trim();
        // ボディ
        bodyElement = await getBodyElements();

        // コピー対象のスタイルプロパティ
        const allowedProperties = ['font-size', 'text-align', 'font-family', 'color', 'font-weight'];
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
            console.error('エラー:', error);
        }
    }

    console.log('拡張処理開始');
    firstDraw();
};