class ScoreComponent {
    constructor() {
        this.loadTemplate();
    }

    async loadTemplate() {
        try {
            const response = await fetch(chrome.runtime.getURL('score-component.html'));
            const html = await response.text();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const relicTemplate = tempDiv.querySelector('#relic-score-template');
            const totalTemplate = tempDiv.querySelector('#total-score-template');
            
            if (relicTemplate) {
                document.head.appendChild(relicTemplate);
            }
            if (totalTemplate) {
                document.head.appendChild(totalTemplate);
            }
        } catch (error) {
            console.error('スコアコンポーネントテンプレートの読み込みに失敗:', error);
        }
    }

    createRelicScoreElement(scoreValue, backgroundColor, firstItem, selectors) {
        const template = document.querySelector('#relic-score-template');
        if (!template) {
            console.error('遺物スコアテンプレートが見つかりません');
            return null;
        }

        const clonedElement = firstItem.cloneNode(true);
        clonedElement.querySelectorAll('canvas').forEach(el => el.remove());
        clonedElement.querySelectorAll('img').forEach(el => el.remove());
        clonedElement.querySelectorAll('[highlight]').forEach(child => {
            child.removeAttribute('highlight');
        });

        clonedElement.classList.add('alk-element');
        
        const clonedNameElement = clonedElement.querySelector(selectors.STAT_NAME);
        clonedNameElement.textContent = 'スコア';
        clonedNameElement.style.color = 'rgba(255,255,255,0.9)';
        
        const clonedNumberElement = clonedElement.querySelector(selectors.STAT_NUMBER);
        clonedNumberElement.textContent = scoreValue.toFixed(2);

        const backgroundDiv = document.createElement('div');
        backgroundDiv.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0;';
        backgroundDiv.style.backgroundColor = backgroundColor;
        
        clonedElement.style.position = 'relative';
        clonedElement.appendChild(backgroundDiv);

        return clonedElement;
    }

    createTotalScoreElement(totalScore, styleApplyFunctions) {
        const template = document.querySelector('#total-score-template');
        if (!template) {
            console.error('合計スコアテンプレートが見つかりません');
            return null;
        }

        const totalScoreElement = template.content.cloneNode(true).firstElementChild;
        
        const captionSpan = totalScoreElement.querySelector('.total-score-caption');
        styleApplyFunctions.applyOriginalDescriptionStyle(captionSpan);
        
        const labelSpan = totalScoreElement.querySelector('.total-score-label');
        styleApplyFunctions.applyOriginalLabelStyle(labelSpan);
        
        const valueSpan = totalScoreElement.querySelector('.total-score-value');
        styleApplyFunctions.applyOriginalNumberStyle(valueSpan);
        valueSpan.textContent = totalScore.toFixed(2);

        return totalScoreElement;
    }

    removeAllScoreElements(containerElement) {
        containerElement.querySelectorAll('.alk-element').forEach(element => {
            element.remove();
        });
    }
}

window.ScoreComponent = ScoreComponent;