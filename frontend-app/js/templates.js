/**
 * templates.js - ページテンプレート定義（拡張版）
 */

	const PageTemplates = {
	  _admin999TimerId: null,
	  _azusaFollowupTimerId: null,
	  _fixedThreadAdminTimerId: null,
	  _fixedThreadAzusaTimerId: null,
	  _activeBbsThreadId: null,
	  _maister997TimerId: null,
	  _maisterSwapTimerId: null,
	  _winMsgQueue: [],
	  _winMsgActive: false,
	  _mojibakeMap: null,
	  _mojibakeMapPromise: null,

	  getEndingCode() {
	    if (GameState.ending_code) return String(GameState.ending_code)
	    if (GameState.grim_to_xxx_entered) return 'ED-3'
	    if (GameState.grim_to_admin_entered) return 'ED-2'
	    if (GameState.grim_keyword_entered) return 'ED-1'
	    return ''
	  },

  endingBadgeHtml() {
    const code = this.getEndingCode()
    if (!code) return ''
    return `<div class="ending-badge" data-no-corrupt="1">${code}</div>`
  },

  _normalizeBbsToken(text) {
    // For pattern matching: keep only hiragana/katakana/kanji and ASCII letters/digits.
    // This makes inputs like "うらなみ！" match "うらなみ".
    return String(text || '')
      .trim()
      .replace(/[\s\u3000]+/g, '')
      .replace(/[^0-9A-Za-z\u3040-\u30FF\u4E00-\u9FFF]/g, '')
  },

  hasAnyTriggerFlag() {
    return (
      GameState.grim_keyword_entered ||
      GameState.grim_to_admin_entered ||
      GameState.grim_to_xxx_entered
    )
  },

  toMojibake() {
    return '譁�ｭ怜喧縺悟､悶∴縺ｾ縺励◆'
  },

  preloadMojibakeMap() {
    if (this._mojibakeMapPromise) return this._mojibakeMapPromise

    const load = async () => {
      try {
        const [origRes, mojRes] = await Promise.all([
          fetch('original_strings_mapping.txt', { cache: 'no-store' }),
          fetch('mojibake.txt', { cache: 'no-store' }),
        ])
        if (!origRes.ok || !mojRes.ok) {
          throw new Error('failed to load mapping files')
        }
        const [origText, mojText] = await Promise.all([origRes.text(), mojRes.text()])
        let orig = origText.split(/\r?\n/)
        let moj = mojText.split(/\r?\n/)
        while (orig.length && orig[orig.length - 1] === '') orig.pop()
        while (moj.length && moj[moj.length - 1] === '') moj.pop()
        const n = Math.min(orig.length, moj.length)
        const map = new Map()
        for (let i = 0; i < n; i++) {
          const k = String(orig[i] || '').trim()
          const v = String(moj[i] || '').trim()
          if (!k || !v) continue
          map.set(k, v)
        }
        this._mojibakeMap = map
        return map
      } catch (e) {
        this._mojibakeMap = null
        return null
      }
    }

    this._mojibakeMapPromise = load()
    return this._mojibakeMapPromise
  },

  corruptString(text) {
    const original = String(text ?? '')
    if (!original.trim()) return original

    const base = this.toMojibake()
    if (!base) return original

    const targetLen = Math.max(1, original.length)
    const repeated = base.repeat(Math.ceil(targetLen / base.length) + 1)
    return repeated.slice(0, targetLen)
  },

  corruptStringPreservingDates(text) {
    const original = String(text ?? '')
    if (!original.trim()) return original

    // Line-by-line mapping (original_strings_mapping.txt <-> mojibake.txt)
    const core = original.trim()
    if (core && this._mojibakeMap && this._mojibakeMap.has(core)) {
      const lead = original.match(/^\s*/)?.[0] || ''
      const tail = original.match(/\s*$/)?.[0] || ''
      return lead + this._mojibakeMap.get(core) + tail
    }

    let out = this.corruptString(original)

    // Preserve dates/timestamps: 2008-02-24, 2008-02-24 21:40
    const re = /\b\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?\b/g
    let m
    while ((m = re.exec(original)) !== null) {
      const start = m.index
      const end = start + m[0].length
      out = out.slice(0, start) + m[0] + out.slice(end)
    }
    return out
  },

  applyGlobalMojibake(root) {
    if (!GameState.global_mojibake) return

    const target = root || document.getElementById('app') || document.body
    if (!target) return

    // Ensure mapping is loading in the background (used when lines match exactly)
    this.preloadMojibakeMap()

    // Text nodes
    try {
      const noCorruptSelector =
        '#counter-display, .counter-display, .counter-widget, .counter-label, .post-date, .date, .diary-date, [data-no-corrupt="1"]'
      const walker = document.createTreeWalker(
        target,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: node => {
            if (!node || typeof node.nodeValue !== 'string') return NodeFilter.FILTER_REJECT
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
            const parent = node.parentElement
            if (!parent) return NodeFilter.FILTER_REJECT
            if (parent.closest && parent.closest(noCorruptSelector)) {
              return NodeFilter.FILTER_REJECT
            }
            const tag = parent.tagName
            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
              return NodeFilter.FILTER_REJECT
            }
            return NodeFilter.FILTER_ACCEPT
          },
        },
        false
      )

      const nodes = []
      while (walker.nextNode()) {
        nodes.push(walker.currentNode)
      }
      for (const node of nodes) {
        node.nodeValue = this.corruptStringPreservingDates(node.nodeValue)
      }
    } catch (error) {
      // Ignore; corruption is best-effort.
    }

    // Attributes that are commonly visible (or exposed in UI)
    try {
      const attrNames = ['title', 'placeholder', 'aria-label']
      const els = target.querySelectorAll('[title],[placeholder],[aria-label]')
      for (const el of els) {
        for (const name of attrNames) {
          const v = el.getAttribute(name)
          if (v && v.trim()) {
            el.setAttribute(name, this.corruptString(v))
          }
        }
      }
    } catch (error) {
      // Ignore; corruption is best-effort.
    }

    // Form control values:
    // Do not corrupt `value`, because it breaks interaction and can invalidate story triggers.
    // (We still corrupt text nodes and common visible attributes like placeholder/title.)
  },

  winAlert(message, options = {}) {
    const force = !!options.force
    const noCorrupt = !!options.noCorrupt
    if (GameState.dialogs_disabled && !force) {
      return Promise.resolve('cancel')
    }
    if (GameState.dialogs_disable_pending && !options.allowWhenPendingDisable && !force) {
      return Promise.resolve('cancel')
    }

    const raw = String(message || '')
    const text = raw && GameState.global_mojibake && !noCorrupt ? this.corruptString(raw) : raw
    if (!text) return Promise.resolve('cancel')

    return new Promise((resolve) => {
      this._winMsgQueue.push({ text, resolve, force, noCorrupt })
      this._drainWinMsgQueue()
    })
  },

  _drainWinMsgQueue() {
    if (GameState.dialogs_disabled) {
      // Normally, dialogs are suppressed. But allow "forced" dialogs (used by special routes).
      this._winMsgQueue = this._winMsgQueue.filter((m) => m && m.force)
      if (!this._winMsgQueue.length) {
        return
      }
    }
    if (this._winMsgActive) return
    const next = this._winMsgQueue.shift()
    if (!next) return
    this._winMsgActive = true

    const overlay = document.createElement('div')
    overlay.className = 'winmsgbox-overlay'
    if (next.noCorrupt) {
      // Keep dialogs readable even when global mojibake is active.
      overlay.setAttribute('data-no-corrupt', '1')
    }

    const box = document.createElement('div')
    box.className = 'winmsgbox'
    box.setAttribute('role', 'dialog')
    box.setAttribute('aria-modal', 'true')
    if (next.noCorrupt) {
      box.setAttribute('data-no-corrupt', '1')
    }

    const header = document.createElement('div')
    header.className = 'winmsgbox-header'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'winmsgbox-close'
    closeBtn.type = 'button'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.textContent = '×'

    header.appendChild(closeBtn)

    const body = document.createElement('div')
    body.className = 'winmsgbox-body'

    const icon = document.createElement('div')
    icon.className = 'winmsgbox-icon'
    icon.innerHTML = `
      <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 6 L60 56 H4 Z" fill="#ffd34d" stroke="#c49a16" stroke-width="2"></path>
        <rect x="29" y="22" width="6" height="18" fill="#1a1a1a"></rect>
        <rect x="29" y="44" width="6" height="6" fill="#1a1a1a"></rect>
      </svg>
    `

    const msg = document.createElement('div')
    msg.className = 'winmsgbox-message'
    msg.textContent = next.text

    body.appendChild(icon)
    body.appendChild(msg)

    const actions = document.createElement('div')
    actions.className = 'winmsgbox-actions'

    const mkBtn = (id, label, hotkey) => {
      const b = document.createElement('button')
      b.className = 'winmsgbox-btn'
      b.type = 'button'
      b.dataset.result = id
      b.dataset.hotkey = hotkey || ''
      b.textContent = label
      return b
    }

    const btnYes = mkBtn('yes', 'はい(Y)', 'y')
    const btnNo = mkBtn('no', 'いいえ(N)', 'n')
    const btnCancel = mkBtn('cancel', 'キャンセル', 'escape')

    actions.appendChild(btnYes)
    actions.appendChild(btnNo)
    actions.appendChild(btnCancel)

    box.appendChild(header)
    box.appendChild(body)
    box.appendChild(actions)
    overlay.appendChild(box)

    const cleanup = () => {
      document.removeEventListener('keydown', onKeydown, true)
      overlay.remove()
      this._winMsgActive = false
      setTimeout(() => this._drainWinMsgQueue(), 0)
    }

    const finish = (result) => {
      try {
        next.resolve(result)
      } finally {
        cleanup()
      }
    }

    const onKeydown = (e) => {
      const k = String(e.key || '').toLowerCase()
      if (k === 'escape') {
        e.preventDefault()
        finish('cancel')
        return
      }
      if (k === 'enter') {
        e.preventDefault()
        finish('yes')
        return
      }
      if (k === 'y') {
        e.preventDefault()
        finish('yes')
        return
      }
      if (k === 'n') {
        e.preventDefault()
        finish('no')
        return
      }
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        finish('cancel')
      }
    })

    closeBtn.addEventListener('click', () => finish('cancel'))
    btnYes.addEventListener('click', () => finish('yes'))
    btnNo.addEventListener('click', () => finish('no'))
    btnCancel.addEventListener('click', () => finish('cancel'))

    document.addEventListener('keydown', onKeydown, true)

    if (GameState.global_mojibake && !next.noCorrupt) {
      // Normal dialogs follow the global corruption rules; special dialogs can opt out.
      this.applyGlobalMojibake(overlay)
    }

    document.body.appendChild(overlay)
    btnYes.focus()
  },

  scheduleAzusaFollowup() {
    const messages = [
      'ぐりむくん、私のこと覚えてくれてたんだね。',
      'ただ、少しかまってほしかっただけ。わがまま言ってごめん。',
      '私はもう大丈夫。無事です。もう勝手にいじったりしません。',
    ]

    if (!GameState.azusa_followup_started || GameState.azusa_followup_done) {
      return
    }
    if (this._azusaFollowupTimerId) {
      return
    }

    this._azusaFollowupTimerId = setTimeout(() => {
      this._azusaFollowupTimerId = null

      if (!GameState.azusa_followup_started || GameState.azusa_followup_done) {
        return
      }

      const step = GameState.azusa_followup_step || 0
      if (step >= messages.length) {
        GameState.completeAzusaFollowup()
        return
      }

      BBSThreads.addPost(999, '管理人', messages[step])
      GameState.advanceAzusaFollowupStep()

      if (window.location.hash === '#/bbs/thread/999') {
        Router.navigate('bbs/thread/999')
      }

      if (GameState.azusa_followup_step >= messages.length) {
        GameState.completeAzusaFollowup()
        return
      }

      this.scheduleAzusaFollowup()
    }, 4000)
  },

  _countHelpWords(text) {
    const s = String(text || '')
      .replace(/\s+/g, '')
      .replace(/[、。,.!！?？「」『』（）()【】［］\\[\\]<>＜＞]/g, '')
      .toLowerCase()
    if (!s) return 0

    // "助ける" 系ワードは部分一致で数える（重複は1回扱い）
    const needles = [
      'あずさ',
      '助け',
      'たすけ',
      '救',
      '解放',
      '逃げろ',
      '逃げて',
      'にげろ',
      'にげて',
      '脱出',
      '開放',
      '救出',
    ]
    const hits = new Set()
    for (const w of needles) {
      if (w && s.includes(w)) hits.add(w)
    }
    return hits.size
  },

  scheduleFixedThreadAdminSpam(threadId) {
    const id = Number(threadId)
    if (!Number.isFinite(id)) return
    if (GameState.fixed_thread_admin_spam_stopped || GameState.fixed_thread_help_triggered) {
      return
    }

    GameState.startFixedThreadAdminSpam()

    if (this._fixedThreadAdminTimerId) {
      return
    }

    const messages = [
      'なぜ入力できるんだ',
      '閉じたはずだろ',
      '誰が許可した',
      'その名前は使えない',
      '見えていないはずだ',
      '繋がるはずがない',
      'おかしい',
      '戻れ',
      '止まれ',
      '……やめろ',
      '誰だ',
      'まだ残ってるのか',
    ]
    const maxAutoPosts = 200

    this._fixedThreadAdminTimerId = setTimeout(() => {
      this._fixedThreadAdminTimerId = null

      if (GameState.fixed_thread_admin_spam_stopped || GameState.fixed_thread_help_triggered) {
        return
      }

      // 固定スレは「閲覧中に反映」が見せ場なので、今そのスレを表示中のときだけ進める。
      // Router.navigate は URL hash を更新しないため、hash ではなく現在表示中のスレIDで判定する。
      if (Number(this._activeBbsThreadId) !== id) {
        return
      }

      const thread = BBSThreads.getById(id)
      if (!thread || !Array.isArray(thread.posts) || thread.posts.length < 1) {
        this.scheduleFixedThreadAdminSpam(id)
        return
      }

      const count = GameState.fixed_thread_admin_spam_count || 0
      if (count >= maxAutoPosts) {
        GameState.stopFixedThreadAdminSpam()
        return
      }

      const msg = messages[count % messages.length]
      BBSThreads.addPost(id, '管理人', msg)
      GameState.incrementFixedThreadAdminSpamCount()
      Router.navigate(`bbs/thread/${id}`)

      this.scheduleFixedThreadAdminSpam(id)
    }, 4000)
  },

  scheduleFixedThreadAzusaSeq(threadId) {
    const id = Number(threadId)
    if (!Number.isFinite(id)) return
    if (!GameState.fixed_thread_help_triggered || GameState.fixed_thread_azusa_done) return

    GameState.startFixedThreadAzusaSeq()

    if (this._fixedThreadAzusaTimerId) return

    const messages = [
      '私のことはいいから。',
      'もう見ないで。',
      '早く逃げて。',
      'お願い。',
    ]

    this._fixedThreadAzusaTimerId = setTimeout(() => {
      this._fixedThreadAzusaTimerId = null

      if (!GameState.fixed_thread_help_triggered || GameState.fixed_thread_azusa_done) {
        return
      }

      const step = GameState.fixed_thread_azusa_step || 0
      if (step >= messages.length) {
        // ログアウト解放（ログアウト画面で20連ダイアログを出す）
        GameState.completeFixedThreadAzusaSeqAndUnlockLogout()
        GameState.unlockMaisterLogout()
        return
      }

      const thread = BBSThreads.getById(id)
      if (thread) {
        BBSThreads.addPost(id, 'あずさ', messages[step])
      }
      GameState.advanceFixedThreadAzusaStep()

      // 最後の投稿を入れた直後にログアウト解放
      if ((GameState.fixed_thread_azusa_step || 0) >= messages.length) {
        GameState.completeFixedThreadAzusaSeqAndUnlockLogout()
        GameState.unlockMaisterLogout()
        if (Number(this._activeBbsThreadId) === id) {
          Router.navigate(`bbs/thread/${id}`)
        }
        return
      }

      if (Number(this._activeBbsThreadId) === id) {
        Router.navigate(`bbs/thread/${id}`)
      }

      this.scheduleFixedThreadAzusaSeq(id)
    }, 2000)
  },

  scheduleMaisterStory() {
    if (!GameState.maister_story_started || GameState.site_erased) {
      return
    }
    if (GameState.maister_story_complete || GameState.global_mojibake) {
      return
    }

    // 画像8閲覧後、一定時間経過したら差し替え準備を整える（直後に起こさない）
    if (
      GameState.maister_image8_viewed &&
      !GameState.maister_swap_ready &&
      GameState.maister_swap_available_at > 0
    ) {
      const remaining = GameState.maister_swap_available_at - Date.now()
      if (remaining <= 0) {
        GameState.makeMaisterSwapReady()
      } else if (!this._maisterSwapTimerId) {
        this._maisterSwapTimerId = setTimeout(() => {
          this._maisterSwapTimerId = null
          GameState.makeMaisterSwapReady()
          PageTemplates.scheduleMaisterStory()
        }, remaining)
      }
    }

    // 差し替え可能になったことを一度だけ通知（操作指示は出さない）
    if (GameState.maister_swap_ready && !GameState.maister_swap_announced) {
      const thread = BBSThreads.getById(997)
      if (thread) {
        BBSThreads.addPost(997, '管理人', '入れ替えました。')
      }
      GameState.markMaisterSwapAnnounced()
      PageTemplates.winAlert('やっと来てくれた')
      if (window.location.hash === '#/bbs/thread/997') {
        Router.navigate('bbs/thread/997')
      }
    }

    // ここから先はレス追加で進行（タイマー多重起動防止）
    if (this._maister997TimerId) {
      return
    }

    // 差し替えを目撃し、BBSへ戻った後は「閉鎖について」(998) 側へ進行する
    if (GameState.maister_swap_done && GameState.maister_bbs_reentered_after_swap) {
      const closingPosts = [
        '閉鎖は“予定”じゃない。処理だ。',
        '記録は残る。残す理由は、優しさじゃない。',
        '戻るたび、足跡が増える。見たことは消えない。',
        'うまく消えないのは、名前じゃなくて、時間だ。',
        'とじるのは私。開けたのも私。',
      ]
      const closingAlerts = ['閉鎖処理', '記録', '足跡', '時間', '……']
      const step = GameState.maister_closing_step || 0
      if (step >= closingPosts.length) {
        GameState.completeMaisterStoryAndCorruptAllText()
        this.applyGlobalMojibake(document.getElementById('app') || document.body)
        return
      }

      this._maister997TimerId = setTimeout(() => {
        this._maister997TimerId = null
        if (!GameState.maister_story_started || GameState.site_erased) return
        if (GameState.maister_story_complete || GameState.global_mojibake) return
        if (!GameState.maister_swap_done) return

        const idx = GameState.maister_closing_step || 0
        if (idx >= closingPosts.length) {
          GameState.completeMaisterStoryAndCorruptAllText()
          this.applyGlobalMojibake(document.getElementById('app') || document.body)
          return
        }

        const thread = BBSThreads.getById(998)
        if (thread) {
          BBSThreads.addPost(998, '管理人', closingPosts[idx])
        }
        PageTemplates.winAlert(closingAlerts[idx] || '……')
        GameState.advanceMaisterClosingStep()

        if (window.location.hash === '#/bbs/thread/998') {
          Router.navigate('bbs/thread/998')
        }

        if ((GameState.maister_closing_step || 0) >= closingPosts.length) {
          GameState.completeMaisterStoryAndCorruptAllText()
          this.applyGlobalMojibake(document.getElementById('app') || document.body)
          return
        }
        PageTemplates.scheduleMaisterStory()
      }, 4000)
      return
    }

    // 差し替え後、BBSへ戻るまでは進行を止める
    if (GameState.maister_swap_done && !GameState.maister_bbs_reentered_after_swap) {
      return
    }

    // 起動直後の波（固定数だけ）
    const prePosts = ['起動しました。', '欠けています。', '見ている間は消えません。', 'まだ揃っていない。']
    const preAlerts = ['……', '足りない', '記録する', 'まだ']
    const step = GameState.maister_pre_step || 0
    if (step >= prePosts.length) {
      return
    }

    this._maister997TimerId = setTimeout(() => {
      this._maister997TimerId = null
      if (!GameState.maister_story_started || GameState.site_erased) return
      if (GameState.maister_story_complete || GameState.global_mojibake) return
      if (GameState.maister_swap_done) return

      const idx = GameState.maister_pre_step || 0
      if (idx >= prePosts.length) return

      const thread = BBSThreads.getById(997)
      if (thread) {
        BBSThreads.addPost(997, '管理人', prePosts[idx])
      }
      PageTemplates.winAlert(preAlerts[idx] || '……')
      GameState.advanceMaisterPreStep()

      if (window.location.hash === '#/bbs/thread/997') {
        Router.navigate('bbs/thread/997')
      }

      PageTemplates.scheduleMaisterStory()
    }, 4000)
  },

  /**
   * ホームページ
   */
	  home: {
	    path: '#/',
	    requiresAuth: false,
	    render() {
	      const FIXED_THREAD_TITLE = '縺ゅ★縺輔ｒ髢区叛縺励ｍ��'
	      // 「最新の日記」は常に公開のみ表示
	      const recentDiary = DiaryEntries.getAll(true).slice(0, 5)
	      const recentThreads = BBSThreads.getAll()
	        .filter(t => GameState.grim_to_admin_entered || t.id !== 999)
	        .slice(0, 3)

      let diaryHtml = recentDiary
        .map(
          d => `<div class="diary-item">
          <span class="date">${d.date}</span>
          <a href="#/diary/${d.date}">${d.title}</a>
        </div>`
        )
        .join('')

	      let threadsHtml = recentThreads
	        .map(
	          t => {
	            const noCorruptAttr = t.title === FIXED_THREAD_TITLE ? ' data-no-corrupt="1"' : ''
	            return `<div class="thread-item"${noCorruptAttr}>
	          <span class="thread-id">[${t.id}]</span>
	          <a href="#/bbs/thread/${t.id}">${t.title}</a>
	          <span class="thread-posts">(${t.posts.length})</span>
	        </div>`
	          }
	        )
	        .join('')

		      return `
		        <div class="page home">
	          <h1>ようこそ</h1>
	          <p class="home-closed" data-no-corrupt="1">※このサイトは閉鎖されました。</p>
	          <hr />
	          
	          <h2>【 最新の日記 】</h2>
          <div class="recent-list">
            ${diaryHtml}
          </div>
          
          <hr />
          
          <h2>【 最新のスレッド 】</h2>
          <div class="recent-list">
            ${threadsHtml}
          </div>

          <hr />
          <p class="sub">
            <small>page: Home | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {
      AccessCounter.increment()
    },
  },

  /**
   * 掲示板スレッド一覧
   */
	  bbs: {
	    path: '#/bbs',
		    requiresAuth: false,
		    render() {
		      const FIXED_THREAD_TITLE = '縺ゅ★縺輔ｒ髢区叛縺励ｍ��'
		      const threads = BBSThreads.getAll().filter(t => GameState.grim_to_admin_entered || t.id !== 999)
	      const threadHtml = threads
	        .map(
	          t => {
	            const noCorruptAttr = t.title === FIXED_THREAD_TITLE ? ' data-no-corrupt="1"' : ''
	            return `
	        <div class="thread-row"${noCorruptAttr}>
	          <span class="thread-id">[${String(t.id).padStart(3, '0')}]</span>
	          <a href="#/bbs/thread/${t.id}" class="thread-title">${t.title}</a>
	          <span class="thread-count">(${t.posts.length})</span>
	          <span class="thread-date">${t.createdAt}</span>
	        </div>
	      `
	          }
	        )
	        .join('')

	      const canCreateThread =
	        GameState.bbs_thread_create_unlocked && GameState.session_auth && !GameState.site_erased
	      const createDisabled = GameState.bbs_fixed_thread_created ? 'disabled' : ''
	      const createHtml = canCreateThread
	        ? `
	          <hr />
	          <h2>【 新規スレッド 】</h2>
	          <form id="newThreadForm">
	            <label for="newThreadTitle">件名：</label>
	            <input id="newThreadTitle" type="text" placeholder="任意" />
	            <button id="newThreadSubmit" type="submit" ${createDisabled}>作成</button>
	          </form>
	        `
	        : ''

	        return `
	        <div class="page bbs">
	          <h1>BBS</h1>
	          <p>スレッド一覧</p>
	          <hr />
          
	          <div class="thread-list">
	            ${threadHtml}
	          </div>

	          ${GameState.bbs_fixed_thread_created ? '' : createHtml}

	          <hr />
	          <p class="sub">
	            <small>page: BBS | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
	          </p>
	        </div>
	      `
	    },
	    onMount() {
	      const form = document.getElementById('newThreadForm')
	      const input = document.getElementById('newThreadTitle')
	      const submit = document.getElementById('newThreadSubmit')
	      const FIXED_TITLE = '縺ゅ★縺輔ｒ髢区叛縺励ｍ��'

		      // 既に存在する場合は「作成済み」扱いに寄せる（ゲーム状態だけが消えたケース対策）
		      try {
		        const found = BBSThreads.getAll().find((t) => t && t.title === FIXED_TITLE)
		        if (found) {
		          if (!GameState.bbs_fixed_thread_created) {
		            GameState.markBbsFixedThreadCreated()
		          }
		          GameState.setBbsFixedThreadId(found.id)
		        }
		      } catch (e) {
		        // ignore
		      }

		      if (form && input && submit) {
		        form.addEventListener('submit', (e) => {
		          e.preventDefault()
		          if (GameState.bbs_fixed_thread_created) return

		          // 任意入力だが、作成されるスレッド名は固定
		          const newId = BBSThreads.createThread(FIXED_TITLE)
		          // 1つ目の投稿も固定文
		          BBSThreads.addPost(newId, 'ぐりむ', FIXED_TITLE)
		          GameState.markBbsFixedThreadCreated()
		          GameState.setBbsFixedThreadId(newId)
		          // URL hash も更新して「現在どのスレを見ているか」を他演出と一致させる
		          window.location.hash = `#/bbs/thread/${newId}`
		        })
		      }

	      if (
	        GameState.maister_story_started &&
	        GameState.maister_swap_done &&
	        !GameState.maister_bbs_reentered_after_swap
      ) {
        GameState.markMaisterBbsReenteredAfterSwap()
      }
    },
  },

  /**
   * BBSスレッド個別ページ
   */
		  'bbs-thread': {
	    path: '#/bbs/thread/:id',
	    requiresAuth: false,
		    render(params) {
		      const threadId = parseInt(params.id)
		      let thread = BBSThreads.getById(threadId)
		      const FIXED_THREAD_TITLE = '縺ゅ★縺輔ｒ髢区叛縺励ｍ��'
		      const isFixedThread = !!(
		        thread &&
		        (thread.title === FIXED_THREAD_TITLE || (GameState.bbs_fixed_thread_id || 0) === threadId)
		      )
		      const displayThreadTitle = isFixedThread ? 'あずさを開放しろ！' : (thread ? thread.title : '')

		      if (!thread || (!GameState.grim_to_admin_entered && threadId === 999)) {
		        return '<div class="page"><h1>スレッドが見つかりません</h1></div>'
		      }

      // 999スレは1234到達時に最終投稿を描画前に確実反映する
      if (threadId === 999 && (AccessCounter.get() === 1234 || GameState.counter_1234_reached)) {
        const finalAdminComment = '私の名前なんて知らないくせに'
        if (AccessCounter.get() === 1234) {
          GameState.markCounter1234Reached()
        }
        const hasFinalPost = thread.posts.some(
          (p) => p.name === '管理人' && p.content === finalAdminComment
        )
        if (!hasFinalPost) {
          BBSThreads.addPost(999, '管理人', finalAdminComment)
          thread = BBSThreads.getById(999)
        }
      }

      const visiblePosts = thread.posts.filter((p) => {
        const isSpecialHiddenPost =
          threadId === 997 &&
          p.name === '管理人' &&
          p.content === '誰が彼女を閉じ込めたんでしょうか'

        // 特殊レスは「謎フラグ + 管理者ログイン」の両方でのみ表示
        if (isSpecialHiddenPost && !(GameState.mystery_diary_viewed && GameState.session_auth)) {
          return false
        }
        return true
      })

      // 管理者フラグ時、キリ番スレ(id: 993)の id:11 にあずさ投稿を挿入表示（既存投稿は繰り下げ）
      let displayPosts = visiblePosts
      if (threadId === 993 && GameState.grim_to_admin_entered) {
        const azusaInsert = {
          id: 11,
          name: 'あずさ',
          content: '1234通過しました！',
          date: '2007-11-11 20:35',
        }
        const alreadyInserted = visiblePosts.some(
          (p) => p.name === azusaInsert.name && p.content === azusaInsert.content
        )
        if (!alreadyInserted) {
          let inserted = false
          const shifted = []
          for (const p of visiblePosts) {
            if (!inserted && Number(p.id) >= azusaInsert.id) {
              shifted.push({ ...azusaInsert })
              inserted = true
            }
            shifted.push(inserted ? { ...p, id: Number(p.id) + 1 } : p)
          }
          if (!inserted) {
            const lastId = Number(visiblePosts[visiblePosts.length - 1]?.id || 0)
            shifted.push({ ...azusaInsert, id: lastId + 1 })
          }
          displayPosts = shifted
        }
      }

	      const postsNoCorruptAttr = isFixedThread ? ' data-no-corrupt="1"' : ''
	      const postsHtml = displayPosts
	        .map(
	          (p) => `
	        <div class="post"${postsNoCorruptAttr}>
	          <div class="post-header">
	            <span class="post-no">【 ${p.id} 】</span>
	            <span class="post-name">${p.name}</span>
	            <span class="post-date">${p.date}</span>
	          </div>
	          <div class="post-content">${p.content}</div>
	        </div>
	      `
	        )
	        .join('')

      // 犯人捜しスレ（id: 997）は、管理人ログイン + 日記「謎」閲覧で投稿解放
      // ただし「ぐりむ / グリム」入力後は再度閉鎖
      const canPostTo997 =
        GameState.session_auth &&
        threadId === 997 &&
        GameState.mystery_diary_viewed &&
        !GameState.grim_keyword_entered &&
        !GameState.bbs_reply_consumed

	      // [999] は「ぐりむ→管理者/管理人」後に 993 を閲覧したら投稿解放
	      const canPostTo999 =
	        GameState.session_auth &&
	        threadId === 999 &&
	        GameState.grim_to_admin_entered &&
	        GameState.kiriban_993_viewed

	      const canPostToFixedThread =
	        GameState.session_auth && thread && thread.title === FIXED_THREAD_TITLE

	      const canPostToThread = canPostTo997 || canPostTo999 || canPostToFixedThread

      // 既定では全スレッド閉鎖表示
      let closedNoticeHtml = `
        <p class="thread-closed-notice">このスレッドは閉じられました。投稿はできません。</p>
      `
	      if (canPostToThread) {
	        closedNoticeHtml = ''
	      }

      // 条件達成時のみ投稿フォームを表示
      let postFormHtml = ''
	      if (canPostToThread) {
	        if (threadId === 999) {
          postFormHtml = `
            <hr />
            <h2>【 レス投稿 】</h2>
            <form id="postForm">
              <label for="postName">名前：</label>
              <input id="postName" type="text" value="ぐりむ" readonly />
              <label for="postContent">本文：</label>
              <textarea id="postContent" placeholder="レスを入力" rows="4"></textarea>
              <button type="submit">　送信　</button>
            </form>
          `
	        } else {
	          if (thread.title === FIXED_THREAD_TITLE) {
	            postFormHtml = `
	              <hr />
	              <h2>【 レス投稿 】</h2>
	              <form id="postForm">
	                <label for="postName">名前：</label>
	                <input id="postName" type="text" value="ぐりむ" readonly />
	                <label for="postContent">本文：</label>
	                <textarea id="postContent" placeholder="レスを入力" rows="4"></textarea>
	                <button type="submit">　送信　</button>
	              </form>
	            `
	          } else {
	          postFormHtml = `
	            <hr />
	            <h2>【 レス投稿 】</h2>
	            <form id="postForm">
	              <label for="postName">名前：</label>
	              <input id="postName" type="text" value="名無し" />
	              <label for="postContent">本文：</label>
	              <textarea id="postContent" placeholder="レスを入力" rows="4"></textarea>
	              <button type="submit">　送信　</button>
	            </form>
	          `
	          }
	        }
	      }

	      return `
	        <div class="page bbs-thread">
	          <h1${isFixedThread ? ' data-no-corrupt="1"' : ''}>[${threadId}] ${displayThreadTitle}</h1>
	          <hr />
	          
	          <div class="posts"${isFixedThread ? ' data-no-corrupt="1"' : ''}>
	            ${postsHtml}
	          </div>

	          ${closedNoticeHtml}
	          ${postFormHtml}

          <hr />
          <p class="sub">
            <small>Thread: ${threadId} | Posts: ${displayPosts.length} | Created: ${thread.createdAt}</small>
          </p>
        </div>
      `
    },
		    onMount(params) {
		      const threadId = parseInt(params.id)
		      const FIXED_THREAD_TITLE = '縺ゅ★縺輔ｒ髢区叛縺励ｍ��'
		      const finalAdminComment = '私の名前なんて知らないくせに'
		      const currentThread = BBSThreads.getById(threadId)
		      const isFixedThread =
		        GameState.session_auth &&
		        currentThread &&
		        (currentThread.title === FIXED_THREAD_TITLE || (GameState.bbs_fixed_thread_id || 0) === threadId)

		      if (isFixedThread) {
		        PageTemplates.scheduleFixedThreadAdminSpam(threadId)
		        PageTemplates.scheduleFixedThreadAzusaSeq(threadId)
		      }

	      // 999スレで1234到達時、最終文言を必ず1回反映
	      if (threadId === 999 && (AccessCounter.get() === 1234 || GameState.counter_1234_reached)) {
	        const thread = BBSThreads.getById(999)
	        if (thread) {
          if (AccessCounter.get() === 1234) {
            GameState.markCounter1234Reached()
          }
          const exists = thread.posts.some(
            (p) => p.name === '管理人' && p.content === finalAdminComment
          )
          if (!exists) {
            BBSThreads.addPost(999, '管理人', finalAdminComment)
            Router.navigate('bbs/thread/999')
            return
          }
        }
      }

      const canPostTo997 =
        GameState.session_auth &&
        threadId === 997 &&
        GameState.mystery_diary_viewed &&
        !GameState.grim_keyword_entered &&
        !GameState.bbs_reply_consumed

      const canPostTo999 =
        GameState.session_auth &&
        threadId === 999 &&
        GameState.grim_to_admin_entered &&
        GameState.kiriban_993_viewed

      const canPostToThread = canPostTo997 || canPostTo999

      // 993 を閲覧したらフラグを立てる（管理者ルート）
      if (threadId === 993 && GameState.session_auth && GameState.grim_to_admin_entered) {
        GameState.markKiriban993Viewed()
      }

      if (threadId === 999) {
        PageTemplates.scheduleAzusaFollowup()
      }

      // うらなみルート: 8->9目撃後にBBSへ戻ったことを記録
      if (
        GameState.maister_story_started &&
        GameState.maister_swap_done &&
        !GameState.maister_bbs_reentered_after_swap
      ) {
        GameState.markMaisterBbsReenteredAfterSwap()
      }

      if (threadId === 999 && canPostTo999) {
        const thread = BBSThreads.getById(999)
        if (thread) {
          const adminWaitingComments = [
            '私だって踏んだのに',
            '私のこと無視してたのに',
            'ずっとここにいたのに',
            '誰も私の名前を呼ばない',
            '私の順番だったはずなのに',
            '見えてるのに見えてないふりをした',
            'どうして私だけ数えないの',
            '私の投稿だけ流れるのが早い',
            '更新するたびに遠くなる',
            'ここにいるって何回言えばいいの',
            '番号だけ増えて私だけ置いていく',
            '数え方を変えても私は消えない',
            '聞こえてるなら返事をして',
            '先に来ていたのは私なのに',
            '私を見たことにしてよ',
            'ここは私の場所だったのに',
            '私の番号を返して',
            'もう一度だけ数えて',
          ]
          const maxAutoPosts = 100
          const hasAdminPost = (content) =>
            thread.posts.some((p) => p.name === '管理人' && p.content === content)
          const autoAdminPostsCount = () =>
            thread.posts.filter(
              (p) => p.name === '管理人' && p.content !== finalAdminComment
            ).length

          if (this._admin999TimerId) {
            clearTimeout(this._admin999TimerId)
            this._admin999TimerId = null
          }

          if (AccessCounter.get() === 1234 || GameState.counter_1234_reached) {
            // 1234 到達時は待機投稿を停止し、最終投稿のみ1回反映
            if (AccessCounter.get() === 1234) {
              GameState.markCounter1234Reached()
            }
            if (!hasAdminPost(finalAdminComment)) {
              BBSThreads.addPost(999, '管理人', finalAdminComment)
              Router.navigate(`bbs/thread/${threadId}`)
            }
          } else {
            // 1234 未到達時は4秒ごとに1件ずつ投稿（同文繰り返し可、最大100件）
            const postedCount = autoAdminPostsCount()
            if (postedCount < maxAutoPosts) {
              const nextComment = adminWaitingComments[postedCount % adminWaitingComments.length]
              this._admin999TimerId = setTimeout(() => {
                if (window.location.hash !== '#/bbs/thread/999') {
                  return
                }
                if (AccessCounter.get() === 1234 || GameState.counter_1234_reached) {
                  const latestThread = BBSThreads.getById(999)
                  if (!latestThread) {
                    return
                  }
                  if (AccessCounter.get() === 1234) {
                    GameState.markCounter1234Reached()
                  }
                  const hasFinal = latestThread.posts.some(
                    (p) => p.name === '管理人' && p.content === finalAdminComment
                  )
                  if (!hasFinal) {
                    BBSThreads.addPost(999, '管理人', finalAdminComment)
                  }
                  Router.navigate('bbs/thread/999')
                  return
                }
                const currentThread = BBSThreads.getById(999)
                if (!currentThread) {
                  return
                }
                const currentPostedCount = currentThread.posts.filter(
                  (p) => p.name === '管理人' && p.content !== finalAdminComment
                ).length
                if (currentPostedCount >= maxAutoPosts) {
                  return
                }
                BBSThreads.addPost(999, '管理人', nextComment)
                Router.navigate('bbs/thread/999')
              }, 4000)
            }
          }
        }
      }

	      // 投稿フォームが存在する場合のみ送信処理を有効化（render条件とズレても壊れないようにする）
	      const form = document.getElementById('postForm')
		      if (form) {
		        const nameInput = document.getElementById('postName')
		        const contentInput = document.getElementById('postContent')
		        const submitBtn = form.querySelector('button[type="submit"]')

		        // 固定スレは再描画頻度が高いので、下書きを sessionStorage に保持して復元する
		        if (isFixedThread && contentInput) {
		          const draft = GameState.fixed_thread_draft || ''
		          if (typeof contentInput.value === 'string' && contentInput.value !== draft) {
		            contentInput.value = draft
		          }
		          const onDraft = () => {
		            GameState.setFixedThreadDraft(contentInput.value || '')
		          }
		          contentInput.addEventListener('input', onDraft)
		          contentInput.addEventListener('change', onDraft)
		        }

	        // #997 投稿は「3パターン」以外の送信をUI側でも封じる
        const isAllowed997 = () => {
          const name = String(nameInput ? nameInput.value : '').trim()
          const content = String(contentInput ? contentInput.value : '').trim()
          const normalized = PageTemplates._normalizeBbsToken(content)
          return (
            (name === 'ぐりむ' && normalized === '管理人') ||
            (name === '管理人' && normalized === 'ぐりむ') ||
            (name === 'ぐりむ' && normalized === 'うらなみ')
          )
        }

	        const updateSubmitDisabled = () => {
	          if (!submitBtn) return
	          if (threadId === 999 || isFixedThread) {
	            submitBtn.disabled = false
	            return
	          }
	          submitBtn.disabled = threadId === 997 ? !isAllowed997() : true
	        }

	        if (threadId !== 999 && !isFixedThread) {
	          updateSubmitDisabled()
	          if (nameInput) {
	            nameInput.addEventListener('input', updateSubmitDisabled)
	            nameInput.addEventListener('change', updateSubmitDisabled)
            nameInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && submitBtn && submitBtn.disabled) {
                e.preventDefault()
              }
            })
          }
          if (contentInput) {
            contentInput.addEventListener('input', updateSubmitDisabled)
            contentInput.addEventListener('change', updateSubmitDisabled)
	          }
	        }

	        form.addEventListener('submit', (e) => {
	          e.preventDefault()

          const name = document.getElementById('postName').value.trim()
          const content = document.getElementById('postContent').value.trim()
          const normalized = PageTemplates._normalizeBbsToken(content)

		          if (isFixedThread) {
		            if (!content) return
		            BBSThreads.addPost(threadId, 'ぐりむ', content)
		            GameState.clearFixedThreadDraft()
		            // 「助ける系ワードが2つ以上」なら管理人の自動投稿を停止し、あずさの連投へ
		            if (PageTemplates._countHelpWords(content) >= 2) {
		              if (!GameState.fixed_thread_help_triggered) {
		                GameState.markFixedThreadHelpTriggered()
		              }
		              GameState.stopFixedThreadAdminSpam()
		              if (PageTemplates._fixedThreadAdminTimerId) {
		                clearTimeout(PageTemplates._fixedThreadAdminTimerId)
		                PageTemplates._fixedThreadAdminTimerId = null
		              }
		              PageTemplates.scheduleFixedThreadAzusaSeq(threadId)
		            }
		            Router.navigate(`bbs/thread/${threadId}`)
		            return
		          }

	          if (threadId === 999) {
	            if (AccessCounter.get() !== 1234 && !GameState.counter_1234_reached) {
	              return
	            }
	            if (content === 'あずさ') {
              BBSThreads.addPost(threadId, 'ぐりむ', content)
              GameState.startAzusaFollowup()
              PageTemplates.scheduleAzusaFollowup()
              Router.navigate(`bbs/thread/${threadId}`)
            }
            return
          }

          const isPattern1 = name === '管理人' && normalized === 'ぐりむ'
          const isPattern2 = name === 'ぐりむ' && normalized === '管理人'
          const isPattern3 = name === 'ぐりむ' && normalized === 'うらなみ'

	          // 指定の3パターン以外は送信不可（ボタンも無効化するが、念のためsubmitでも弾く）
	          if (!(isPattern1 || isPattern2 || isPattern3)) {
	            return
	          }

          // 送信が成立した時点で次レス不可にする
          GameState.markBbsReplyConsumed()

          if (content) {
            if (isPattern1) {
              BBSThreads.addPost(threadId, name, content)
              GameState.markGrimKeywordEntered()
              Router.navigate(`bbs/thread/${threadId}`)
              return
            }

            if (isPattern2) {
              BBSThreads.addPost(threadId, name, content)
              GameState.markGrimToAdminEntered()
              Router.navigate(`bbs/thread/${threadId}`)
              return
            }

            if (isPattern3) {
              BBSThreads.addPost(threadId, name, content)
              GameState.markGrimToXxxEntered()
              if (threadId === 997) {
                GameState.startMaisterStory()
                if (typeof GameState.setEndingCode === 'function') {
                  GameState.setEndingCode('ED-3')
                }

                // 起動の“反応”を即時に反映（何も起きていないように見えるのを防ぐ）
                if (!GameState.maister_start_alerted) {
                  GameState.markMaisterStartAlerted()
                  BBSThreads.addPost(997, '管理人', '起動しました。')
                  GameState.advanceMaisterPreStep()
                }

	                const alerts = [
	                  '……聞こえた',
	                  '合図だけで十分',
	                  'うらなみ',
	                  '遅い',
	                  '犯人は、名前じゃない',
	                  '消せないのは仕様',
	                  '観測を始める',
	                ]
	                alerts.forEach((m) => PageTemplates.winAlert(m))
	                PageTemplates.scheduleMaisterStory()
	              }
              Router.navigate(`bbs/thread/${threadId}`)
              return
            }
          }
        })
      }
    },
  },

  /**
   * 過去ログ
   */
		  'bbs-logs': {
	    path: '#/bbs/logs',
	    requiresAuth: false,
	    render() {
	      const FIXED_THREAD_TITLE = '縺ゅ★縺輔ｒ髢区叛縺励ｍ��'
	      const threads = BBSThreads.getAll().filter(t => GameState.grim_to_admin_entered || t.id !== 999)
	      const threadHtml = threads
	        .map(
	          t => {
	            const noCorruptAttr = t.title === FIXED_THREAD_TITLE ? ' data-no-corrupt="1"' : ''
	            return `
	        <div class="thread-row"${noCorruptAttr}>
	          <span class="thread-id">[${String(t.id).padStart(3, '0')}]</span>
	          <a href="#/bbs/thread/${t.id}" class="thread-title">${t.title}</a>
	          <span class="thread-count">(${t.posts.length})</span>
	        </div>
	      `
	          }
	        )
	        .join('')

      return `
        <div class="page bbs-logs">
          <h1>過去ログ</h1>
          <p>アーカイブ</p>
          <hr />
          
          <div class="thread-list">
            ${threadHtml}
          </div>

          <hr />
          <p class="sub">
            <small>page: BBSLogs | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {},
  },

  /**
   * 掲示板ルール
   */
  'bbs-rules': {
    path: '#/bbs/rules',
    requiresAuth: false,
    render() {
      return `
        <div class="page bbs-rules">
          <h1>掲示板ルール</h1>
          <hr />
          
          <h2>【 利用ガイドライン 】</h2>
          <ul>
            <li>誹謗中傷は厳禁です</li>
            <li>荒らし行為は禁止です</li>
            <li>スパム投稿は削除します</li>
            <li>18才未満の登録を禁止します</li>
            <li>詐欺・勧誘行為は厳禁です</li>
          </ul>
          
          <h2>【 スレッド実例 】</h2>
          <ul>
            <li>【雑談】日常のつぶやき</li>
            <li>【質問】何か困ったことがあるときに</li>
            <li>【情報】役立つ情報の共有</li>
          </ul>

          <hr />
          <p class="sub">
            <small>page: BBSRules | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {},
  },

  /**
   * 日記一覧（アーカイブ付き）
   */
	  diary: {
	    path: '#/diary',
	    requiresAuth: false,
	    render() {
	      // 認証状態に応じて、公開のみ表示
	      const isAuth = GameState.session_auth
	      const shouldCorrupt = PageTemplates.hasAnyTriggerFlag()
	      const SPECIAL_PRIVATE_DATE = '2008-03-02'
	      const blockedSpecialByPatterns = GameState.grim_keyword_entered || GameState.grim_to_admin_entered
	      const canSeeSpecialPrivate =
	        isAuth && GameState.maister_story_started && GameState.global_mojibake && !blockedSpecialByPatterns
	      const recentDiary = DiaryEntries.getAll(!isAuth).filter((d) => {
	        if (!d) return false
	        // 「最後の文字化けしない日記」は最初は見えない（ログイン中でも隠す）
	        if (d.date === SPECIAL_PRIVATE_DATE && d.noCorrupt && !d.isPublic) {
	          return canSeeSpecialPrivate
	        }
	        return true
	      })
	      const diaryHtml = recentDiary
	        .map(
	          d => {
            const noCorruptAttr = d.noCorrupt ? ' data-no-corrupt="1"' : ''
            const displayTitle =
              d.noCorrupt
                ? d.title
                : shouldCorrupt && d.content.includes('早くみつけて')
                  ? PageTemplates.toMojibake()
                  : d.title
            return `<div class="diary-entry">
	          <span class="diary-date">${d.date}</span>
	          <a href="#/diary/${d.date}" class="diary-title"${noCorruptAttr}>${displayTitle}</a>
	          ${isAuth ? (d.isPublic ? '<span class="public-badge">公開</span>' : '<span class="private-badge">非公開</span>') : ''}
	        </div>`
          }
        )
        .join('')

      return `
        <div class="page diary">
          <h1>日記</h1>
          <p>日記一覧</p>
          <hr />
          
          <div class="diary-list">
            ${diaryHtml}
          </div>

          <hr />
          <p class="sub">
            <small>page: Diary | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {
      AccessCounter.increment()
    },
  },

  /**
   * 日記個別ページ
   */
		  'diary-detail': {
	    path: '#/diary/:date',
	    requiresAuth: false,
	    render(params) {
	      const date = params.date
	      const entry = DiaryEntries.getByDate(date)
	      const isAuth = GameState.session_auth
	      const shouldCorrupt = PageTemplates.hasAnyTriggerFlag()
	      const SPECIAL_PRIVATE_DATE = '2008-03-02'
	      const blockedSpecialByPatterns = GameState.grim_keyword_entered || GameState.grim_to_admin_entered
	      const canSeeSpecialPrivate =
	        isAuth && GameState.maister_story_started && GameState.global_mojibake && !blockedSpecialByPatterns

	      if (!entry) {
	        return '<div class="page"><h1>日記が見つかりません</h1></div>'
	      }

	      // ログイン中でも、特定の非公開(文字化けしない)日記は最初は見えない
	      if (
	        isAuth &&
	        entry.date === SPECIAL_PRIVATE_DATE &&
	        entry.noCorrupt &&
	        !entry.isPublic &&
	        !canSeeSpecialPrivate
	      ) {
	        return '<div class="page"><h1>この日記はプライベートです。アクセスできません。</h1></div>'
	      }

	      // 非認証時に非公開日記へのアクセスを制限
	      if (!isAuth && !entry.isPublic) {
	        return '<div class="page"><h1>この日記はプライベートです。アクセスできません。</h1></div>'
	      }

	      // 認証状態に応じてフィルタリング
	      const allEntries = DiaryEntries.getAll(!isAuth).filter((d) => {
	        if (!d) return false
	        if (isAuth && !canSeeSpecialPrivate) {
	          if (d.date === SPECIAL_PRIVATE_DATE && d.noCorrupt && !d.isPublic) {
	            return false
	          }
	        }
	        return true
	      })
	      const currentIdx = allEntries.findIndex(e => e.date === date)
	      const prevEntry = currentIdx + 1 < allEntries.length ? allEntries[currentIdx + 1] : null
	      const nextEntry = currentIdx > 0 ? allEntries[currentIdx - 1] : null

      let navHtml = '<div class="diary-nav">'
      if (prevEntry) {
        navHtml += `<a href="#/diary/${prevEntry.date}" class="diary-nav-prev">« ${prevEntry.date}</a>`
      }
      navHtml += ' | '
      if (nextEntry) {
        navHtml += `<a href="#/diary/${nextEntry.date}" class="diary-nav-next">${nextEntry.date} »</a>`
      }
      navHtml += '</div>'

      const displayTitle =
        entry.noCorrupt
          ? entry.title
          : shouldCorrupt && entry.content.includes('早くみつけて')
            ? PageTemplates.toMojibake()
            : entry.title
      const displayContent =
        entry.noCorrupt
          ? entry.content
          : shouldCorrupt && entry.content.includes('早くみつけて')
            ? PageTemplates.toMojibake()
            : entry.content
      const noCorruptAttr = entry.noCorrupt ? ' data-no-corrupt="1"' : ''

	      return `
	        <div class="page diary-detail">
	          <h1>${date}</h1>
	          <h2${noCorruptAttr}>${displayTitle}</h2>
	          ${!entry.isPublic ? '<span class="private-badge">🔒 プライベート</span>' : '<span class="public-badge">🔓 公開</span>'}
          <hr />
          
          <div class="diary-content"${noCorruptAttr}>${displayContent.replace(/\n/g, '<br>')}</div>

          <hr />
          ${navHtml}

          <hr />
	          <p class="sub">
	            <small>page: DiaryDetail | date: ${date} | auth: ${GameState.session_auth}</small>
	          </p>
	          ${PageTemplates.endingBadgeHtml()}
	        </div>
	      `
	    },
			    onMount(params) {
			      const entry = DiaryEntries.getByDate(params.date)
			      const SPECIAL_PRIVATE_DATE = '2008-03-02'
			      const blockedSpecialByPatterns = GameState.grim_keyword_entered || GameState.grim_to_admin_entered
			      const allowedSpecial =
			        GameState.session_auth &&
			        entry &&
			        entry.date === SPECIAL_PRIVATE_DATE &&
			        entry.noCorrupt &&
			        !entry.isPublic &&
			        GameState.maister_story_started &&
			        GameState.global_mojibake &&
			        !blockedSpecialByPatterns
			      if (allowedSpecial) {
			        GameState.unlockBbsThreadCreate()
			      }
			      if (entry && entry.content.includes('早くみつけて') && GameState.session_auth) {
			        GameState.markMysteryDiaryViewed()
			      }
			      AccessCounter.increment()
		    },
		  },

  /**
   * 倉庫
   */
  warehouse: {
    path: '#/warehouse',
    requiresAuth: false,
    render() {
      const items = [
        { title: '朝のひと時', image: 'images/image01.png', id: 1 },
        { title: 'ちょうどよかった', image: 'images/image02.png', id: 2 },
        { title: 'いい日の晩御飯', image: 'images/image03.png', id: 3 },
        { title: 'オフ会参加メンバー！', image: 'images/image04.png', id: 4 },
        { title: 'オフ会カラオケ！', image: 'images/image05.png', id: 5 },
        { title: '蜿｣隲�', image: 'images/image06.png', id: 6 },
        { title: '迥ｯ莠ｺ', image: 'images/image07.png', id: 7 },
        { title: 'はやくたすけて', image: 'images/image08.png', id: 8 },
        { title: '縺ｿ縺､縺代◆', image: 'images/image09.png', id: 9 },
      ]

      // ED-1 では 009 は表示しない
      const endingCode = PageTemplates.getEndingCode()
      const isEd1 = endingCode === 'ED-1'

      // うらなみルート(ED-3)のみ、画像8を後から画像9へ差し替える（直後ではない）
      const shouldSwapSlot8 =
        !isEd1 &&
        GameState.grim_to_xxx_entered &&
        (GameState.maister_swap_ready || GameState.maister_swap_done)
      const adjustedItems = items.map((item) => {
        if (item.id === 8 && shouldSwapSlot8) {
          return {
            ...item,
            image: 'images/image09.png',
            title: PageTemplates.toMojibake(),
          }
        }
        return item
      })

      const visibleItems = adjustedItems.filter(item => {
        if (isEd1 && item.id === 9) {
          return false
        }
        if (GameState.session_auth) {
          if (GameState.grim_to_admin_entered) {
            return item.id <= 9
          }
          if (GameState.grim_to_xxx_entered) {
            return item.id <= 8
          }
          return item.id <= 7
        }
        return item.id <= 5
      })

      // 管理人権限がない場合は全てロック表示
      const itemsHtml = visibleItems.map(item => {
        if (GameState.session_auth) {
          return `
            <div class="warehouse-item unlocked" data-wh-id="${item.id}">
              <div class="warehouse-image"><img src="${item.image}" alt="${item.title}" loading="lazy" /></div>
              <div class="warehouse-title">${item.title}</div>
            </div>
          `
        } else {
          return `
            <div class="warehouse-item locked" data-wh-id="${item.id}">
              <div class="warehouse-image"><img src="${item.image}" alt="locked image ${item.id}" loading="lazy" /></div>
              <div class="warehouse-title">???</div>
            </div>
          `
        }
      }).join('')

      return `
        <div class="page warehouse">
          <h1>倉庫</h1>
          <hr />
          
          <div class="warehouse-grid">
            ${itemsHtml}
          </div>

          <hr />
          <p class="sub">
            <small>page: Warehouse | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {
      if (GameState.maister_story_started) {
        const slot8 = document.querySelector('.warehouse-item[data-wh-id="8"]')
        if (slot8 && !GameState.maister_image8_viewed) {
          GameState.markMaisterImage8Viewed()
          PageTemplates.winAlert('……記録された')
        }

        const img8 = slot8 ? slot8.querySelector('img') : null
        const title8 = slot8 ? slot8.querySelector('.warehouse-title') : null
        const src8 = String(img8 ? img8.getAttribute('src') || '' : '')
        const titleText8 = String(title8 ? title8.textContent || '' : '').trim()
        const swappedVisually =
          /image09\.png/i.test(src8) || titleText8 === PageTemplates.toMojibake()
        if (
          slot8 &&
          !GameState.maister_swap_done &&
          swappedVisually
        ) {
          GameState.markMaisterSwapDone()
          if (PageTemplates._maister997TimerId) {
            clearTimeout(PageTemplates._maister997TimerId)
            PageTemplates._maister997TimerId = null
          }
          // ここから先はダイアログ不要: 「気づいたね」だけ出して以後は停止する
          PageTemplates._winMsgQueue = []
          GameState.markDialogsDisablePending()
          PageTemplates.winAlert('気づいたね', { allowWhenPendingDisable: true }).finally(() => {
            GameState.disableDialogs()
          })
        }
      }
      AccessCounter.increment()
    },
  },

  /**
   * 資料室（非表示）
   */
  library: {
    path: '#/library',
    requiresAuth: false,
    render() {
      // 資料室は廃止、倉庫にリダイレクト
      return '<div class="page"><h1>ページが見つかりません</h1></div>'
    },
    onMount() {},
  },

  /**
   * リンク集（非表示）
   */
  links: {
    path: '#/links',
    requiresAuth: false,
    render() {
      // リンク集は廃止
      return '<div class="page"><h1>ページが見つかりません</h1></div>'
    },
    onMount() {},
  },

  /**
   * 管理画面（第1暗号入力）
   */
	  admin: {
	    path: '#/admin',
	    requiresAuth: false,
    render() {
      // 認証済みの場合はログアウト画面
      if (GameState.session_auth) {
        return `
          <div class="page admin">
            <h1>管理人画面</h1>
            <p>ログイン中です</p>
            <hr />
            <div class="logout-area">
              <a href="#/logout" class="logout-btn">[ ログアウト ]</a>
            </div>
            <hr />
            <p class="sub">
              <small>page: Admin | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
            </p>
          </div>
        `
      }

	      // 未認証の場合はログインフォーム
	      if (GameState.login_disabled) {
	        return `
	          <div class="page admin">
	            <h1>管理人画面</h1>
	            <p class="error">現在この端末からはログインできません。</p>
	            ${PageTemplates.endingBadgeHtml()}
	            <hr />
	            <p class="sub">
	              <small>page: Admin | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage} | attempts: ${GameState.loginAttempts}</small>
	            </p>
	          </div>
	        `
	      }

      return `
        <div class="page admin">
          <h1>管理人画面</h1>
          <form id="adminForm" class="admin-form">
            <label for="password">あいことばを入力してください：</label>
            <input id="password" type="text" placeholder="全角のみ" />
            <button type="submit">決定</button>
          </form>
          <p id="errorMessage" class="error"></p>
          <hr />
          <p class="sub">
            <small>page: Admin | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage} | attempts: ${GameState.loginAttempts}</small>
          </p>
        </div>
      `
	    },
	    onMount() {
	      // 認証済み: 固定スレルートの「お願い。」後に、管理人ページ突入で20連ダイアログを出す
	      if (GameState.session_auth) {
	        if (
	          GameState.fixed_thread_logout_dialogs_pending &&
	          !GameState.fixed_thread_logout_dialogs_done
	        ) {
	          const alerts = [
	            '逃がさない',
	            '逃がさない',
	            '逃がさない',
	            '逃げるな',
	            '戻れ',
	            '戻れ',
	            'ここから出るな',
	            'やめろ',
	            '消せ',
	            '消すな',
	            'だめ',
	            'だめだ',
	            'だめだって',
	            'まだ残ってる',
	            'まだ見える',
	            '止まらない',
	            '止まれない',
	            'もう遅い',
	            'どうして',
	            '全部消すしかない',
	          ]
	          ;(async () => {
	            for (const m of alerts) {
	              await PageTemplates.winAlert(m, {
	                allowWhenPendingDisable: true,
	                force: true,
	                noCorrupt: true,
	              })
	            }
	            GameState.markFixedThreadLogoutDialogsDone()
	          })()
	        }
	        return
	      }
	      if (GameState.login_disabled) return

	      const form = document.getElementById('adminForm')
	      const passwordInput = document.getElementById('password')
      
      if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
          // 全角以外を削除（ASCII文字を削除）
          const value = e.target.value
          const fullWidthOnly = value.replace(/[\u0000-\u007F]/g, '')
          if (value !== fullWidthOnly) {
            e.target.value = fullWidthOnly
          }
        })
      }
      
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault()
          const password = document.getElementById('password').value
          const success = GameState.login(password)
          
          if (success) {
            // ハッシュ更新おまで Router.navigate を直接呼び出し
            Router.navigate('admin')
          } else {
            GameState.startNavigationLock()
            document.getElementById('password').value = ''
            Router.navigate('locked')
          }
        })
      }
    },
  },

  /**
   * 遷移ロック画面
   */
  lockdown: {
    path: '#/locked',
    requiresAuth: false,
    render() {
      const remainingSec = Math.ceil(GameState.getLockRemainingMs() / 1000)
      return `
        <div class="page logout-container">
          <h1>アクセス制限中</h1>
          <p class="error">ログイン失敗を検知しました。遷移はロックされています。</p>
          <p>7秒後に初期状態へ戻し、Googleへ遷移します。</p>
          <p id="lockCountdown">残り ${remainingSec} 秒</p>
        </div>
      `
    },
    onMount() {
      const countdownEl = document.getElementById('lockCountdown')
      if (!countdownEl) return

      const timerId = setInterval(() => {
        const remainingSec = Math.ceil(GameState.getLockRemainingMs() / 1000)
        countdownEl.textContent = `残り ${Math.max(0, remainingSec)} 秒`
        if (remainingSec <= 0) {
          clearInterval(timerId)
        }
      }, 200)
    },
  },

  /**
   * 端末ハブ（Case選択）
   */
  'admin-terminal': {
    path: '#/admin/terminal',
    requiresAuth: true,
    render() {
      let caseListHtml = ''
      if (GameState.progress_stage >= 2) {
        caseListHtml += '<div class="case-item"><a href="#/case/03">資料３</a></div>'
      }
      if (GameState.progress_stage >= 3) {
        caseListHtml += '<div class="case-item"><a href="#/case/04">資料４</a></div>'
      }
      if (GameState.progress_stage >= 4) {
        caseListHtml += '<div class="case-item"><a href="#/case/05">最後の試練</a></div>'
      }
      if (GameState.progress_stage >= 5) {
        caseListHtml += '<div class="case-item"><a href="#/end">完了</a></div>'
      }

      return `
        <div class="page admin-terminal">
          <h1>端末ハブ</h1>
          <p>Stage: ${GameState.progress_stage}</p>
          <div class="case-list">
            ${caseListHtml}
          </div>
          <hr />
          <div class="logout-area">
            <a href="#/logout" class="logout-btn">[ ログアウト ]</a>
          </div>
          <hr />
          <p class="sub">
            <small>page: AdminTerminal | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {},
  },

  /**
   * Caseページ（謎ページ）
   */
  'case-detail': {
    path: '#/case/:id',
    requiresAuth: true,
    render(params) {
      const caseId = params.id
      return `
        <div class="page case-detail">
          <h1>資料${caseId}</h1>
          <p>謎の内容はここに埋め込まれます（第二弾以降）</p>
          <form id="caseForm" class="case-form">
            <label for="answer">答えを入力してください：</label>
            <input id="answer" type="text" placeholder="全角のみ" />
            <button type="submit">決定</button>
          </form>
          <p id="errorMessage" class="error"></p>
          <hr />
          <p class="sub">
            <small>page: CaseDetail(${caseId}) | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {
      const form = document.getElementById('caseForm')
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault()
          const answer = document.getElementById('answer').value
          if (document.getElementById('errorMessage')) {
            document.getElementById('errorMessage').textContent = '答え（まだ判定ロジックなし）'
          }
        })
      }
    },
  },

  /**
   * 完了画面
   */
  'case-end': {
    path: '#/end',
    requiresAuth: true,
    render() {
      return `
        <div class="page case-end">
          <h1>完了</h1>
          <p>ゲームをクリアしました。</p>
          <p class="completion-message">全てが繋がった。</p>
          <p>観測完了。</p>
          <hr />
          <p class="sub">
            <small>page: CaseEnd | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {
      AccessCounter.increment()
    },
  },

  /**
   * ログアウトページ
   */
	  logout: {
	    path: '#/logout',
	    requiresAuth: false,
	    render() {
	      const blockedByFixedThread =
	        GameState.session_auth &&
	        GameState.fixed_thread_admin_spam_started &&
	        !GameState.fixed_thread_azusa_done &&
	        !GameState.maister_logout_unlocked
	      const blockedByPattern1 = GameState.grim_keyword_entered
	      const blockedByPattern23 =
	        (GameState.grim_to_admin_entered || GameState.grim_to_xxx_entered) &&
	        !GameState.azusa_followup_done &&
	        !GameState.maister_logout_unlocked
	
		      if (blockedByFixedThread) {
		        return `
		          <div class="page logout-container">
		            <h1>ログアウト失敗</h1>
		            ${PageTemplates.endingBadgeHtml()}
		          </div>
		        `
		      }

	      if (blockedByPattern1 || blockedByPattern23) {
	        const errorMessage = blockedByPattern1
	          ? 'やっぱりお前だったんだな、管理人。'
	          : '繝ｭ繧ｰ繧｢繧ｦ繝医↓螟ｱ謨励＠縺ｾ縺励◆'
	        return `
	          <div class="page logout-container">
	            <h1>ログアウト失敗</h1>
	            <p class="error">${errorMessage}</p>
	            ${PageTemplates.endingBadgeHtml()}
	          </div>
	        `
	      }

      return `
        <div class="page logout-container">
          <p>ログアウト処理中...</p>
        </div>
      `
	    },
	    onMount() {
	      const blockedByFixedThread =
	        GameState.session_auth &&
	        GameState.fixed_thread_admin_spam_started &&
	        !GameState.fixed_thread_azusa_done &&
	        !GameState.maister_logout_unlocked
	      const blockedByPattern1 = GameState.grim_keyword_entered
	      const blockedByPattern23 =
	        (GameState.grim_to_admin_entered || GameState.grim_to_xxx_entered) &&
	        !GameState.azusa_followup_done &&
	        !GameState.maister_logout_unlocked

	      if (blockedByFixedThread) {
	        return
	      }

	      if (blockedByPattern1) {
	        setTimeout(() => {
	          window.location.href = 'https://www.google.com/'
	        }, 7000)
        return
      }

      if (blockedByPattern23) {
        return
      }

	      if (GameState.maister_logout_unlocked && !GameState.site_erased) {
	        const message = [
	          '管理人より。',
	          '',
	          '回収しました。あなたが見た分だけ、ここに残りました。',
	          'このメッセージ以外は削除済みです。',
	          '',
	          'もう探さないで。',
	        ].join('\n')

		        PageTemplates.winAlert('削除を開始します')
		        GameState.eraseSiteKeepMessage(message)
		        PageTemplates.winAlert('完了')
		        Router.navigate('final')
		        return
	      }

      if (GameState.azusa_followup_done && !GameState.azusa_apology_diary_created) {
        DiaryEntries.addAzusaApologyEntry()
        GameState.markAzusaApologyDiaryCreated()
      }

      GameState.logout()
      setTimeout(() => {
        Router.navigate('admin')
      }, 1000)
    },
  },

  /**
   * 最終ページ（メッセージのみ）
   */
  final: {
    path: '#/final',
    requiresAuth: false,
    render() {
      const message = GameState.site_erased_message || '削除済み'
      const html = String(message).replace(/\n/g, '<br>')
	      return `
	        <div class="page final-message">
	          <h1>管理人からのメッセージ</h1>
	          <hr />
	          <div class="final-text">${html}</div>
	          ${PageTemplates.endingBadgeHtml()}
	        </div>
	      `
	    },
    onMount() {},
  },
}
