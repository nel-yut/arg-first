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
      if (template.path === `#/${cleanPath}`) {
        return { template, key, params: {} }
      }
    }

    // パターンマッチ（例: :id, :date）
    for (const [key, template] of Object.entries(PageTemplates)) {
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
    this.render(template, params)
  },

  /**
   * ページを描画
   * @param {object} template - テンプレート設定
   * @param {object} params - ルートパラメータ
   */
  render(template, params) {
    const app = document.getElementById('app')
    if (!app) return

    // HTML を生成
    const pageHtml = template.render(params)
    const layoutHtml = this.wrapLayout(pageHtml)

    // DOM を更新
    app.innerHTML = layoutHtml

    // onMount コールバックを実行
    template.onMount(params)

    // カウンター表示を更新
    const counterDisplay = document.getElementById('counter-display')
    if (counterDisplay) {
      counterDisplay.textContent = AccessCounter.getFormatted()
    }
  },

  /**
   * ページを共通レイアウトでラップ
   * @param {string} pageHtml - ページのHTML
   * @returns {string} レイアウト付きHTML
   */
  wrapLayout(pageHtml) {
    return `
      <div class="global-container">
        <header>
          <h1>ミニARG</h1>
        </header>
        <div class="main-wrapper">
          <nav class="global-nav">
            <div class="nav-section">
              <h3>■ MENU</h3>
              <a href="#/">ホーム</a>
              <a href="#/bbs">掲示板</a>
              <a href="#/diary">日記</a>
              <a href="#/warehouse">倉庫</a>
              <a href="#/admin">管理人</a>
            </div>
            <div class="counter-widget">
              <h3>アクセス数</h3>
              <div class="counter-display" id="counter-display">0000</div>
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
