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

    // 最終削除モード中は常に最終ページへ
    if (GameState.site_erased) {
      if (window.location.hash !== '#/final') {
        window.location.hash = '#/final'
      }
      const finalTemplate = PageTemplates.final
      if (finalTemplate) {
        this.render(finalTemplate, {}, 'final')
      }
      return
    }

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

    // Preserve focus across re-renders (e.g. BBS auto-post refreshes).
    // Router.navigate does not always update hash, but it does re-render; without this, form focus is lost.
    let focusState = null
    try {
      const ae = document.activeElement
      if (
        ae &&
        ae.id &&
        app.contains(ae) &&
        (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')
      ) {
        focusState = {
          id: ae.id,
          tag: ae.tagName,
          selectionStart: typeof ae.selectionStart === 'number' ? ae.selectionStart : null,
          selectionEnd: typeof ae.selectionEnd === 'number' ? ae.selectionEnd : null,
          scrollTop: typeof ae.scrollTop === 'number' ? ae.scrollTop : null,
        }
      }
    } catch (e) {
      focusState = null
    }

    // HTML を生成
    const pageHtml = template.render(params)
    const layoutHtml = this.wrapLayout(pageHtml, key, params)

    // DOM を更新
    app.innerHTML = layoutHtml

	    // 現在表示中のBBSスレIDを記録（Router.navigate は hash を更新しないため）
	    try {
	      if (typeof PageTemplates !== 'undefined' && PageTemplates) {
	        if (key === 'bbs-thread' && params && params.id != null) {
	          PageTemplates._activeBbsThreadId = Number(params.id)
	        } else {
	          PageTemplates._activeBbsThreadId = null
	        }
	      }
	    } catch (e) {
	      // ignore
	    }

    // onMount コールバックを実行
    template.onMount(params)

    // Restore focus after onMount so form values/listeners are ready.
    if (focusState && focusState.id) {
      try {
        const el = document.getElementById(focusState.id)
        if (el && el.tagName === focusState.tag && !el.disabled) {
          el.focus({ preventScroll: true })
          if (
            typeof el.setSelectionRange === 'function' &&
            typeof focusState.selectionStart === 'number' &&
            typeof focusState.selectionEnd === 'number'
          ) {
            el.setSelectionRange(focusState.selectionStart, focusState.selectionEnd)
          }
          if (typeof focusState.scrollTop === 'number') {
            el.scrollTop = focusState.scrollTop
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // うらなみルート: 8->9目撃後に「BBSへ戻った」扱いを堅牢に立てる
    // (同一ハッシュを踏む等でテンプレ側の onMount が走らないケースでも拾う)
    if (
      GameState.maister_story_started &&
      GameState.maister_swap_done &&
      !GameState.maister_bbs_reentered_after_swap &&
      String(key || '').startsWith('bbs')
    ) {
      GameState.markMaisterBbsReenteredAfterSwap()
    }

    // あずさ投稿後の管理人連投を継続（ページ移動後も進行）
    if (typeof PageTemplates.scheduleAzusaFollowup === 'function') {
      PageTemplates.scheduleAzusaFollowup()
    }
    if (typeof PageTemplates.scheduleMaisterStory === 'function') {
      PageTemplates.scheduleMaisterStory()
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

    // うらなみルート完走後: 全ページの全テキストを文字化け
    if (GameState.global_mojibake && typeof PageTemplates.applyGlobalMojibake === 'function') {
      PageTemplates.applyGlobalMojibake(app)
      try {
        document.title = PageTemplates.toMojibake()
      } catch (e) {
        // ignore
      }
    }
  },

  /**
   * ページを共通レイアウトでラップ
   * @param {string} pageHtml - ページのHTML
   * @returns {string} レイアウト付きHTML
   */
  wrapLayout(pageHtml, key = '', params = {}) {
    if (GameState.site_erased || key === 'final') {
      return `
        <div class="global-container final-mode">
          <main class="content">
            ${pageHtml}
          </main>
        </div>
      `
    }

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
	            </div>
	          </nav>
	          <main class="content">
	            ${pageHtml}
	          </main>
	        </div>
	        <footer class="site-footer" data-no-corrupt="1">
	          <small>※本サイトはフィクションです。実際の個人・団体とは一切関係ありません。©Nel_HIME</small>
	        </footer>
	      </div>
	    `
	  },
}
