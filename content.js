// 有効サブステータスは数が多いと文字列が消えるので、
// 非表示になっているポップアップ（カスタムサブステータス）側のチェックで判断する
// 簡略表示のときはステータスが出ないのでそれも考慮
window.onload = () => {

// document.addEventListener('DOMContentLoaded', () => {
    const MY_CLASS = 'alk-element';

    // とりあえず親を保持->前の名前を保持し、名前が変わったら再描画
    // ↑が実装できたら次
    // ボタンが押されたらポップアップをつかみ、ポップアップのdisplayを監視する
    // displayの監視でも描画

    // キャラ親要素
    /** @type {HTMLElement | null} */
    let characterInfoElement;

    // 前回表示されたキャラ名
    /** @type {string} */
    let lastCharacterName;

    // 前回のカスタムサブステータスの表示状態
    /** @type {boolean} */
    let hasDisplayed;

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
    let characterInfoElementObserve;

    // 汎用的な要素待機関数
    function waitForElement(selector, validate = (el) => !!el, 
        options = { childList: true, subtree: true, attributes: true }) {
        return new Promise((resolve, reject) => {
            const anyObserver = new MutationObserver((mutationsList, observer) => {
                const element = document.querySelector(selector);
                if (element && validate(element)) {
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
        return waitForElement('.pc-role-detail-num', 
            (el) => el.querySelector('.c-hrd-ri-name')?.textContent.trim().length > 0);
    }


    // 監視のコールバック
    const callback = (mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.target.classList && 
                    mutation.target.classList.contains(MY_CLASS)) {
                console.log('動いたのは自作要素なので無視');
                continue;
            }
            if(observer === characterInfoElementObserve 
                && (mutation.type === 'childList' || mutation.type === 'attributes')){
                const characterNameElement = mutation.target.querySelector('.c-hrd-ri-name');
                if(characterNameElement){
                    const characterName = characterNameElement.textContent.trim();
                    if(characterName && lastCharacterName != characterName){
                        console.log('名前が変わったので再描画');
                        lastCharacterName = characterName;
                        reDraw();
                    }
                }
            } 
            // else if(observer === chracterNameElementObserve 
            //     && (mutation.type === 'attributes' || mutation.type === 'characterData')){
            //     if(lastCharacterName === mutation.target.textContent.trim()){
            //         console.log('前回とキャラ名が同じだったので無視');
            //         continue;
            //     }
            //     lastCharacterName = mutation.target.textContent.trim();
            //     reDraw();
            // }
        }
    };

    // 監視設定
    const config = {
        childList: true,
        attributes: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: false,
        attributeOldValue: false,
    };

    // 監視を再設定する関数
    function setObservers() {
        // 既存の監視を解除
        if (characterInfoElementObserve) {
            characterInfoElementObserve.disconnect();
        }
        characterInfoElementObserve = new MutationObserver(callback);
        characterInfoElementObserve.observe(characterInfoElement, config);
    }

    // 簡略モード中
    function isSimpleMode(){
        // TODO: 簡略モードかどうか判断
        return false;
    }


    // スコアを計算し返す
    function calculateScore(index){
        // 頭、手、胴体、脚、オーブ、縄
        const relicElements = relicListElement.querySelectorAll('.c-hrdr-item');
        // 上記のいずれか
        const relicElement = relicElements[index];
        // 聖遺物1つあたりが持つサブステータス要素すべて
        const supPropNameAndValues = Array.from(relicElement.querySelectorAll('.c-hrdr-btm-item'))
            .map(item => ({
                name: item.querySelector('.c-hrdr-name').textContent.trim(), 
                value: item.querySelector('.c-hrdr-num').textContent.trim()
            }));
        let score = 0;
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
        // スコアにならないステータス
        if (!subPropNames.includes(subPropName)) {
            return 0;
        }
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

    // スコア要素作成
    function createScoreElement(){
        const newDiv = document.createElement('div');
        newDiv.classList.add(MY_CLASS);
        newDiv.textContent = 'テスト';
        // スタイル設定
        return newDiv;
    }

    // 描画
    function draw(){
        if (characterInfoElement) {
            characterInfoElement.querySelectorAll(`.${MY_CLASS}`).forEach(element => {
                element.remove();
            });
            const relicElements = characterInfoElement.querySelectorAll('.c-hrdr-item');
            for(let i = 0; i < relicElements.length; i++){
                const parent = relicElements[i];
                const titleElement = parent.querySelector('.c-hrdr-title');
                const newDiv = createScoreElement();
                parent.insertBefore(newDiv, titleElement);
                console.log(`要素を作った(${i})`);
            }
        }else{
            console.log('遺物リスト要素が取得できないので描画失敗');
        }
    }

    // 非同期処理を分離
    async function reDraw() {
        // if(!isElementVisible(subPropListElement)){
        //     if (relicListElementObserve) {
        //         relicListElementObserve.disconnect();
        //     }
        //     const subPropsElement = await waitForElement('.sub-props');
        //     subPropListElement = subPropsElement.querySelector('.prop-list');
        //     relicListElementObserve = new MutationObserver(callback);
        //     relicListElementObserve.observe(subPropListElement, config);
        // }
        // if(!isElementVisible(basicInfoElement)){
        //     if (basicInfoElementObserve) {
        //         basicInfoElementObserve.disconnect();
        //     }
        //     basicInfoElement = await waitForElement('.basic-info');
        //     basicInfoElementObserve = new MutationObserver(callback);
        //     basicInfoElementObserve.observe(basicInfoElement, config);
        // }
        draw();
    }

    // 最初に実行
    async function setup(){
        // コピー対象のスタイルプロパティ
        // const allowedProperties = ['font-size', 'text-align', 'font-family', 'color'];
        // 説明用のスタイル取得
        // const artifactHeaderElement = await waitForElement('.artifact-info header');
        // const descriptionElements = artifactHeaderElement.querySelectorAll('div');
        // let descriptionElement = null;
        // const searchKeyForDescription = 'ハイライトされたステータス';
        // for (let el of descriptionElements) {
        //     if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
        //         if (el.textContent.includes(searchKeyForDescription)) {
        //             descriptionElement = el;
        //             break;
        //         }
        //     }
        // }
        // const descriptionTextStyle = window.getComputedStyle(descriptionElement);
        // for (let style of allowedProperties) {
        //     descriptionStyleObject[style] = descriptionTextStyle.getPropertyValue(style);
        // }

        // キャラ名
        characterInfoElement = await getCharacterInfoElements();
        lastCharacterName = characterInfoElement
            .querySelector('.c-hrd-ri-name').textContent.trim();

        // const subPropsElement = await waitForElement('.sub-props');
        // // 項目ラベル用のスタイル取得
        // const subPropsElements = subPropsElement.querySelectorAll('p');
        // let labelElement = null;
        // const searchKeyForLabel = '追加ステータス';
        // for (let el of subPropsElements) {
        //     if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
        //         if (el.textContent.includes(searchKeyForLabel)) {
        //             labelElement = el;
        //             break;
        //         }
        //     }
        // }
        // const labelTextStyle = window.getComputedStyle(labelElement);
        // for (let style of allowedProperties) {
        //     labelStyleObject[style] = labelTextStyle.getPropertyValue(style);
        // }
        // subPropListElement = subPropsElement.querySelector('.c-rdd-mark-options');
        // 数値用スタイル取得
        // const finalTextElement = await waitForElement('.final-text');
        // const finalTextStyle = window.getComputedStyle(finalTextElement);
        // for (let style of allowedProperties) {
        //     numberStyleObject[style] = finalTextStyle.getPropertyValue(style);
        // }

        // 変更監視開始
        setObservers();
        addEventListenerToButton();
    }

    function addEventListenerToButton(){
        document.querySelector('.pc-rdnp-mark').addEventListener('click', () => {
            console.log("カスタムサブステータスボタンが押された");
          
            // // 2. ポップアップ要素が生成されるまで待つ
            // const checkPopup = setInterval(() => {
            //   const popup = document.querySelector("#popupElement"); // ポップアップのIDやクラスを適宜変更
          
            //   if (popup) {
            //     clearInterval(checkPopup); // 見つかったら監視停止
            //     console.log("ポップアップが表示された");
          
            //     // 3. ポップアップの削除や非表示を監視
            //     const observer = new MutationObserver(mutations => {
            //       mutations.forEach(mutation => {
            //         if (mutation.type === "attributes" && mutation.attributeName === "style") {
            //           // display: none の場合
            //           if (getComputedStyle(popup).display === "none") {
            //             console.log("ポップアップが非表示になった");
            //             observer.disconnect(); // 監視を停止
            //             afterPopupHidden(); // 追加処理を実行
            //           }
            //         } else if (mutation.type === "childList" && !document.contains(popup)) {
            //           // ポップアップが削除された場合
            //           console.log("ポップアップが削除された");
            //           observer.disconnect();
            //           afterPopupHidden();
            //         }
            //       });
            //     });
          
            //     observer.observe(popup, { attributes: true, attributeFilter: ["style"], childList: true });
          
            //     console.log("ポップアップの非表示監視を開始");
            //   }
            // }, 100);
          });
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
// });
};