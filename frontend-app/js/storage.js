/**
 * storage.js - 状態管理と localStorage 永続化
 */

const GameState = {
  session_auth: false,
  progress_stage: 0,
  loginAttempts: 0,

  /**
   * localStorage から状態を読み込む
   */
  load() {
    const stored = localStorage.getItem('gameState')
    if (stored) {
      try {
        const state = JSON.parse(stored)
        this.session_auth = state.session_auth ?? false
        this.progress_stage = state.progress_stage ?? 0
        this.loginAttempts = state.loginAttempts ?? 0
      } catch (error) {
        console.error('Failed to load game state:', error)
      }
    }
  },

  /**
   * 現在の状態を localStorage に保存
   */
  save() {
    const state = {
      session_auth: this.session_auth,
      progress_stage: this.progress_stage,
      loginAttempts: this.loginAttempts,
    }
    localStorage.setItem('gameState', JSON.stringify(state))
  },

  /**
   * ログイン処理 - パスワード検証
   * @param {string} password - ユーザー入力パスワード
   * @returns {boolean} ログイン成功フラグ
   */
  login(password) {
    const CORRECT_PASSWORD = 'あいことば'
    
    if (password === CORRECT_PASSWORD) {
      this.session_auth = true
      // progress_stage が 0 の場合のみ 1 に昇格
      if (this.progress_stage === 0) {
        this.progress_stage = 1
      }
      this.loginAttempts = 0
      this.save()
      return true
    } else {
      // 不正解をカウント
      this.incrementLoginAttempts()
      return false
    }
  },

  /**
   * ログアウト処理
   */
  logout() {
    this.session_auth = false
    // progress_stage は保持
    this.loginAttempts = 0
    this.save()
  },

  /**
   * Stage を進行（上昇のみ）
   * @param {number} newStage
   */
  advanceStage(newStage) {
    if (newStage > this.progress_stage) {
      this.progress_stage = newStage
      this.save()
    }
  },

  /**
   * 不正解カウントをインクリメント
   */
  incrementLoginAttempts() {
    this.loginAttempts += 1
    this.save()
  },

  /**
   * 状態をリセット（デバッグ用）
   */
  reset() {
    this.session_auth = false
    this.progress_stage = 0
    this.loginAttempts = 0
    localStorage.removeItem('gameState')
  },
}
