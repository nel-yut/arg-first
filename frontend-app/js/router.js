/**
 * router.js - ページルーティングと認証ガード
 */

const Router = {
  /**
   * パスをテンプレートキーに変換
   * @param {string} path - ハッシュパス（例: '/case/02'）
   * @returns {object} マッチしたテンプレート設定とパラメータ
   */
  matchRoute(path) {
    // パスから先頭の / を削除
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    // 完全マッチを先に探す
    for (const [key, template] of Object.entries(PageTemplates)) {
      if (!template || typeof template.path !== 'string') {
        continue
      }
      if (template.path === `#/${cleanPath}`) {
        return { template, key, params: {} }
      }
    }

    // パターンマッチ（例: :id, :date）
    for (const [key, template] of Object.entries(PageTemplates)) {
      if (!template || typeof template.path !== 'string') {
        continue
      }
      const pathPattern = template.path.replace('#/', '')
      const pathParts = cleanPath.split('/').filter(Boolean)
      const patternParts = pathPattern.split('/').filter(Boolean)

      if (pathParts.length !== patternParts.length) {
        continue
      }

      let isMatch = true
      const params = {}

      for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i]
        const pathPart = pathParts[i]

        if (patternPart.startsWith(':')) {
          // パラメータ部
          const paramName = patternPart.slice(1)
          params[paramName] = pathPart
        } else if (patternPart === pathPart) {
          // 完全マッチ
          continue
        } else {
          isMatch = false
          break
        }
      }

      if (isMatch) {
        return { template, key, params }
      }
    }

    // マッチしないので未知のパスとして扱う
    return { template: null, key: null, params: {} }
  },

  /**
   * ページをナビゲート
   * @param {string} path - ナビゲート先のパス
   */
  navigate(path) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    // ログイン失敗ロック中は常にロック画面へ固定
    if (GameState.isNavigationLocked()) {
      if (GameState.isLockExpired()) {
        GameState.resetAllAndRedirectToGoogle()
        return
      }

      if (window.location.hash !== '#/locked') {
        window.location.hash = '#/locked'
        return
      }

      const lockTemplate = PageTemplates.lockdown
      this.render(lockTemplate, {})
      return
    }

    const { template, key, params } = this.matchRoute(path)

    // テンプレートが見つからない場合はホームへ
    if (!template) {
      window.location.hash = '#/'
      return
    }

    // 認証チェック
    if (template.requiresAuth && !GameState.session_auth) {
      // ログイン必須 → /admin へリダイレクト
      window.location.hash = '#/admin'
      return
    }

    // ページを描画
    this.render(template, params, key)
  },

  /**
   * ページを描画
   * @param {object} template - テンプレート設定
   * @param {object} params - ルートパラメータ
   */
  render(template, params, key = '') {
    const app = document.getElementById('app')
    if (!app) return

    // HTML を生成
    const pageHtml = template.render(params)
    const layoutHtml = this.wrapLayout(pageHtml, key, params)

    // DOM を更新
    app.innerHTML = layoutHtml

    // onMount コールバックを実行
    template.onMount(params)

    // あずさ投稿後の管理人連投を継続（ページ移動後も進行）
    if (typeof PageTemplates.scheduleAzusaFollowup === 'function') {
      PageTemplates.scheduleAzusaFollowup()
    }

    // ページ内サブテキストをデバッグ全表示に置き換え
    const stateEntries = Object.entries(GameState)
      .filter(([stateKey, value]) =>
        typeof value !== 'function' &&
        stateKey !== 'session_auth' &&
        stateKey !== 'progress_stage'
      )
      .map(([stateKey, value]) => `${stateKey}: ${String(value)}`)

    const debugText = [
      `page: ${key || 'unknown'}`,
      `auth: ${GameState.session_auth}`,
      `stage: ${GameState.progress_stage}`,
      ...stateEntries,
    ].join(' | ')

    const pageSub = app.querySelector('.page .sub small')
    if (pageSub) {
      pageSub.textContent = debugText
    }

    // カウンター表示を更新
    const counterDisplay = document.getElementById('counter-display')
    if (counterDisplay) {
      if (counterDisplay.tagName === 'INPUT') {
        const applyCounterValue = () => {
          if (counterDisplay.value.length !== 4) {
            return false
          }
          AccessCounter.set(counterDisplay.value.trim())
          counterDisplay.value = String(AccessCounter.get())
          if (window.location.hash === '#/bbs/thread/999') {
            if (Number(counterDisplay.value) === 1234) {
              GameState.markCounter1234Reached()
              const thread999 = BBSThreads.getById(999)
              const hasFinalPost =
                thread999 &&
                thread999.posts.some(
                  (p) => p.name === '管理人' && p.content === '私の名前なんて知らないくせに'
                )
              if (!hasFinalPost) {
                BBSThreads.addPost(999, '管理人', '私の名前なんて知らないくせに')
              }
            }
            this.navigate('bbs/thread/999')
          }
          return true
        }

        counterDisplay.value = String(AccessCounter.get())
        counterDisplay.addEventListener('input', () => {
          counterDisplay.value = counterDisplay.value.replace(/\D/g, '').slice(0, 4)
          if (counterDisplay.value.length === 4) {
            applyCounterValue()
          }
        })
        counterDisplay.addEventListener('change', () => {
          if (!applyCounterValue()) {
            counterDisplay.value = String(AccessCounter.get())
          }
        })
      } else {
        counterDisplay.textContent = AccessCounter.getFormatted()
      }
    }
  },

  /**
   * ページを共通レイアウトでラップ
   * @param {string} pageHtml - ページのHTML
   * @returns {string} レイアウト付きHTML
   */
  wrapLayout(pageHtml, key = '', params = {}) {
    const isCounterEditable = key === 'bbs-thread' && String(params.id || '') === '999'
    const counterDisplayHtml = isCounterEditable
      ? `<input id="counter-display" class="counter-display" type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" value="${AccessCounter.getFormatted()}" />`
      : `<div class="counter-display" id="counter-display">0000</div>`

    return `
      <div class="global-container">
        <header>
          <h1>ぐりむの部屋</h1>
        </header>
        <div class="main-wrapper">
          <nav class="global-nav">
            <div class="nav-section">
              <h3>■ MENU</h3>
              <a href="#/">ホーム</a>
              <a href="#/bbs">BBS</a>
              <a href="#/diary">日記</a>
              <a href="#/warehouse">倉庫</a>
              <a href="#/admin">管理人</a>
            </div>
            <div class="counter-widget">
              <h3>アクセス数</h3>
              ${counterDisplayHtml}
              <div class="counter-label">since 2026</div>
            </div>
          </nav>
          <main class="content">
            ${pageHtml}
          </main>
        </div>
      </div>
    `
  },
}
