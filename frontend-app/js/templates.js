/**
 * templates.js - ページテンプレート定義（拡張版）
 */

const PageTemplates = {
  /**
   * ホームページ
   */
  home: {
    path: '#/',
    requiresAuth: false,
    render() {
      const recentDiary = DiaryEntries.getAll().slice(0, 5)
      const recentThreads = BBSThreads.getAll().slice(0, 3)

      let diaryHtml = recentDiary
        .map(
          d => `
        <div class="diary-item">
          <span class="date">${d.date}</span>
          <a href="#/diary/${d.date}">${d.title}</a>
        </div>
      `
        )
        .join('')

      let threadsHtml = recentThreads
        .map(
          t => `
        <div class="thread-item">
          <span class="thread-id">[${t.id}]</span>
          <a href="#/bbs/thread/${t.id}">${t.title}</a>
          <span class="thread-posts">(${t.posts.length})</span>
        </div>
      `
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
      const threads = BBSThreads.getAll()
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

      let newThreadFormHtml = ''
      if (GameState.session_auth) {
        newThreadFormHtml = `
          <hr />
          <h2>【 新規スレッド 】</h2>
          <form id="newThreadForm">
            <label for="newThreadTitle">スレッドタイトル：</label>
            <input id="newThreadTitle" type="text" placeholder="スレッド名を入力" />
            <button type="submit">　作成　</button>
          </form>
        `
      }

      return `
        <div class="page bbs">
          <h1>掲示板</h1>
          <p>スレッド一覧</p>
          <hr />
          
          <div class="thread-list">
            ${threadHtml}
          </div>
          
          ${newThreadFormHtml}

          <hr />
          <p class="sub">
            <small>page: BBS | auth: ${GameState.session_auth} | stage: ${GameState.progress_stage}</small>
          </p>
        </div>
      `
    },
    onMount() {
      // 管理者権限がある場合のみ、新規スレッド作成フォームを有効化
      if (GameState.session_auth) {
        const form = document.getElementById('newThreadForm')
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault()
            const title = document.getElementById('newThreadTitle').value.trim()
            if (title) {
              const newId = BBSThreads.createThread(title)
              Router.navigate(`bbs/thread/${newId}`)
            }
          })
        }
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
      const thread = BBSThreads.getById(threadId)

      if (!thread) {
        return '<div class="page"><h1>スレッドが見つかりません</h1></div>'
      }

      const postsHtml = thread.posts
        .map(
          (p, idx) => `
        <div class="post">
          <div class="post-header">
            <span class="post-no">【 ${idx + 1} 】</span>
            <span class="post-name">${p.name}</span>
            <span class="post-date">${p.date}</span>
          </div>
          <div class="post-content">${p.content}</div>
        </div>
      `
        )
        .join('')

      // 管理者権限かつ雑談スレ（id: 998）の場合のみ投稿フォームを表示
      let postFormHtml = ''
      if (GameState.session_auth && threadId === 998) {
        postFormHtml = `
          <hr />
          <h2>【 レス投稿 】</h2>
          <form id="postForm">
            <label for="postContent">本文：</label>
            <textarea id="postContent" placeholder="レスを入力" rows="4"></textarea>
            <button type="submit">　送信　</button>
          </form>
        `
      }

      return `
        <div class="page bbs-thread">
          <h1>[${threadId}] ${thread.title}</h1>
          <hr />
          
          <div class="posts">
            ${postsHtml}
          </div>
          
          ${postFormHtml}

          <hr />
          <p class="sub">
            <small>Thread: ${threadId} | Posts: ${thread.posts.length} | Created: ${thread.createdAt}</small>
          </p>
        </div>
      `
    },
    onMount(params) {
      const threadId = parseInt(params.id)
      // 管理者権限かつ雑談スレの場合のみ投稿機能を有効化
      if (GameState.session_auth && threadId === 998) {
        const form = document.getElementById('postForm')
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault()
            const content = document.getElementById('postContent').value.trim()

            if (content) {
              BBSThreads.addPost(threadId, '名無し', content)
              // ハッシュ更新せず Router.navigate を直接呼び出し
              Router.navigate(`bbs/thread/${threadId}`)
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
      const threads = BBSThreads.getAll()
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
      const recentDiary = DiaryEntries.getAll()
      const diaryHtml = recentDiary
        .map(
          d => `
        <div class="diary-entry">
          <span class="diary-date">${d.date}</span>
          <a href="#/diary/${d.date}" class="diary-title">${d.title}</a>
        </div>
      `
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

      if (!entry) {
        return '<div class="page"><h1>日記が見つかりません</h1></div>'
      }

      const allEntries = DiaryEntries.getAll()
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

      return `
        <div class="page diary-detail">
          <h1>${date}</h1>
          <h2>${entry.title}</h2>
          <hr />
          
          <div class="diary-content">
            ${entry.content.replace(/\n/g, '<br>')}
          </div>

          <hr />
          ${navHtml}

          <hr />
          <p class="sub">
            <small>page: DiaryDetail | date: ${date} | auth: ${GameState.session_auth}</small>
          </p>
        </div>
      `
    },
    onMount() {
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
        { title: '第一の鍵', image: '🔑', id: 1 },
        { title: '古い日誌', image: '📖', id: 2 },
        { title: '謎の手紙', image: '💌', id: 3 },
        { title: '暗号表', image: '🗝️', id: 4 },
        { title: '写真', image: '📷', id: 5 },
        { title: '音声記録', image: '🎵', id: 6 },
      ]

      // 管理人権限がない場合は全てロック表示
      const itemsHtml = items.map(item => {
        if (GameState.session_auth) {
          return `
            <div class="warehouse-item unlocked">
              <div class="warehouse-image">${item.image}</div>
              <div class="warehouse-title">${item.title}</div>
            </div>
          `
        } else {
          return `
            <div class="warehouse-item locked">
              <div class="warehouse-image">🔒</div>
              <div class="warehouse-title">???</div>
            </div>
          `
        }
      }).join('')

      return `
        <div class="page warehouse">
          <h1>倉庫</h1>
          ${GameState.session_auth ? '<p>管理人権限で倉庫にアクセスしています</p>' : '<p>一部のアイテムはロックされています</p>'}
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

      const form = document.getElementById('adminForm')
      const passwordInput = document.getElementById('password')
      const errorMessage = document.getElementById('errorMessage')
      
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
            if (errorMessage) {
              errorMessage.textContent = 'あいことばが間違っています'
            }
            document.getElementById('password').value = ''
          }
        })
      }
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
      return `
        <div class="page logout-container">
          <p>ログアウト処理中...</p>
        </div>
      `
    },
    onMount() {
      GameState.logout()
      setTimeout(() => {
        Router.navigate('admin')
      }, 1000)
    },
  },
}
