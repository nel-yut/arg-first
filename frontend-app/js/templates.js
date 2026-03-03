/**
 * templates.js - ページテンプレート定義（拡張版）
 */

const PageTemplates = {
  _admin999TimerId: null,
  _azusaFollowupTimerId: null,

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

  /**
   * ホームページ
   */
  home: {
    path: '#/',
    requiresAuth: false,
    render() {
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
          t => `<div class="thread-item">
          <span class="thread-id">[${t.id}]</span>
          <a href="#/bbs/thread/${t.id}">${t.title}</a>
          <span class="thread-posts">(${t.posts.length})</span>
        </div>`
        )
        .join('')

      return `
        <div class="page home">
          <h1>ようこそ</h1>
          <p>ここは何かの痕跡です。</p>
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
      const threads = BBSThreads.getAll().filter(t => GameState.grim_to_admin_entered || t.id !== 999)
      const threadHtml = threads
        .map(
          t => `
        <div class="thread-row">
          <span class="thread-id">[${String(t.id).padStart(3, '0')}]</span>
          <a href="#/bbs/thread/${t.id}" class="thread-title">${t.title}</a>
          <span class="thread-count">(${t.posts.length})</span>
          <span class="thread-date">${t.createdAt}</span>
        </div>
      `
        )
        .join('')

        return `
        <div class="page bbs">
          <h1>BBS</h1>
          <p>スレッド一覧</p>
          <hr />
          
          <div class="thread-list">
            ${threadHtml}
          </div>

          <hr />
          <p class="sub">
            <small>page: BBS | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {
      // no-op
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

      // 管理者フラグ時、キリ番スレ(id: 993)の id:11 を差し込み表示
      let displayPosts = visiblePosts
      if (threadId === 993 && GameState.grim_to_admin_entered) {
        displayPosts = visiblePosts.map((p) => {
          if (p.id === 11) {
            return {
              ...p,
              name: 'あずさ',
              content: '1234通過しました！',
            }
          }
          return p
        })
      }

      const postsHtml = displayPosts
        .map(
          (p) => `
        <div class="post">
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

      const canPostToThread = canPostTo997 || canPostTo999

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

      return `
        <div class="page bbs-thread">
          <h1>[${threadId}] ${thread.title}</h1>
          <hr />
          
          <div class="posts">
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
      const finalAdminComment = '私の名前なんて知らないくせに'

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

      // 条件達成時のみ投稿機能を有効化
      if (canPostToThread) {
        const form = document.getElementById('postForm')
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault()

            const name = document.getElementById('postName').value.trim()
            const content = document.getElementById('postContent').value.trim()
            const normalized = content.replace(/[、。\s]/g, '')

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
            const isPattern2 = name === 'ぐりむ' && (normalized === '管理者' || normalized === '管理人')
            const isPattern3 = name === 'ぐりむ' && normalized === 'まいすたー'

            // 入力内容に関係なく、送信操作時点で次レス不可にする
            GameState.markBbsReplyConsumed()

            if (!(isPattern1 || isPattern2 || isPattern3)) {
              Router.navigate(`bbs/thread/${threadId}`)
              return
            }

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
                Router.navigate(`bbs/thread/${threadId}`)
                return
              }
            }
          })
        }
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
      const threads = BBSThreads.getAll().filter(t => GameState.grim_to_admin_entered || t.id !== 999)
      const threadHtml = threads
        .map(
          t => `
        <div class="thread-row">
          <span class="thread-id">[${String(t.id).padStart(3, '0')}]</span>
          <a href="#/bbs/thread/${t.id}" class="thread-title">${t.title}</a>
          <span class="thread-count">(${t.posts.length})</span>
        </div>
      `
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
      const recentDiary = DiaryEntries.getAll(!isAuth)
      const diaryHtml = recentDiary
        .map(
          d => {
            const displayTitle =
              shouldCorrupt && d.content.includes('早くみつけて') ? PageTemplates.toMojibake() : d.title
            return `<div class="diary-entry">
          <span class="diary-date">${d.date}</span>
          <a href="#/diary/${d.date}" class="diary-title">${displayTitle}</a>
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

      if (!entry) {
        return '<div class="page"><h1>日記が見つかりません</h1></div>'
      }

      // 非認証時に非公開日記へのアクセスを制限
      if (!isAuth && !entry.isPublic) {
        return '<div class="page"><h1>この日記はプライベートです。アクセスできません。</h1></div>'
      }

      // 認証状態に応じてフィルタリング
      const allEntries = DiaryEntries.getAll(!isAuth)
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
        shouldCorrupt && entry.content.includes('早くみつけて') ? PageTemplates.toMojibake() : entry.title
      const displayContent =
        shouldCorrupt && entry.content.includes('早くみつけて') ? PageTemplates.toMojibake() : entry.content

      return `
        <div class="page diary-detail">
          <h1>${date}</h1>
          <h2>${displayTitle}</h2>
          ${!entry.isPublic ? '<span class="private-badge">🔒 プライベート</span>' : '<span class="public-badge">🔓 公開</span>'}
          <hr />
          
          <div class="diary-content">${displayContent.replace(/\n/g, '<br>')}</div>

          <hr />
          ${navHtml}

          <hr />
          <p class="sub">
            <small>page: DiaryDetail | date: ${date} | auth: ${GameState.session_auth}</small>
          </p>
        </div>
      `
    },
    onMount(params) {
      const entry = DiaryEntries.getByDate(params.date)
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

      const visibleItems = items.filter(item => {
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
            <div class="warehouse-item unlocked">
              <div class="warehouse-image"><img src="${item.image}" alt="${item.title}" loading="lazy" /></div>
              <div class="warehouse-title">${item.title}</div>
            </div>
          `
        } else {
          return `
            <div class="warehouse-item locked">
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
      // 認証済みなら onMount 処理は不要
      if (GameState.session_auth) return
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
      const blockedByPattern1 = GameState.grim_keyword_entered
      const blockedByPattern23 =
        (GameState.grim_to_admin_entered || GameState.grim_to_xxx_entered) &&
        !GameState.azusa_followup_done

      if (blockedByPattern1 || blockedByPattern23) {
        const errorMessage = blockedByPattern1
          ? 'やっぱりお前だったんだな、管理人。'
          : '繝ｭ繧ｰ繧｢繧ｦ繝医↓螟ｱ謨励＠縺ｾ縺励◆'
        return `
          <div class="page logout-container">
            <h1>ログアウト失敗</h1>
            <p class="error">${errorMessage}</p>
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
      const blockedByPattern1 = GameState.grim_keyword_entered
      const blockedByPattern23 =
        (GameState.grim_to_admin_entered || GameState.grim_to_xxx_entered) &&
        !GameState.azusa_followup_done

      if (blockedByPattern1) {
        setTimeout(() => {
          window.location.href = 'https://www.google.com/'
        }, 7000)
        return
      }

      if (blockedByPattern23) {
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
}
