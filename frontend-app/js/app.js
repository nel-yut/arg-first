/**
 * app.js - メインアプリケーション
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 状態を localStorage から読み込む
  GameState.load()
  AccessCounter.load()

  // 2. 初期ページを表示
  const initialHash = window.location.hash || '#/'
  const initialPath = initialHash.startsWith('#') ? initialHash.slice(1) : initialHash
  Router.navigate(initialPath)
  updateCounterDisplay()

  // 3. hashchange イベントをリッスン（ページ遷移）
  window.addEventListener('hashchange', () => {
    const path = window.location.hash.slice(1)
    Router.navigate(path || '/')
    updateCounterDisplay()
  })

  // カウンター表示更新関数
  function updateCounterDisplay() {
    const counterDisplay = document.getElementById('counter-display')
    if (counterDisplay) {
      counterDisplay.textContent = AccessCounter.getFormatted()
    }
  }
})
