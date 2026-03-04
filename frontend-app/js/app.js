/**
 * app.js - メインアプリケーション
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 状態を sessionStorage / localStorage から読み込む
  GameState.load()
  GameState.markSessionBoot()
  BBSThreads.load()
  DiaryEntries.load()
  AccessCounter.load()
  GameState.scheduleLockExpiration()
  if (typeof PageTemplates !== 'undefined' && PageTemplates && typeof PageTemplates.preloadMojibakeMap === 'function') {
    // Load mojibake line mapping early so it is ready by the time global corruption starts.
    PageTemplates.preloadMojibakeMap()
  }

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
    if (GameState.global_mojibake) {
      return
    }
    const counterDisplay = document.getElementById('counter-display')
    if (counterDisplay) {
      counterDisplay.textContent = AccessCounter.getFormatted()
    }
  }
})
