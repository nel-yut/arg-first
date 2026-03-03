/**
 * storage.js - 状態管理と sessionStorage 永続化
 */

const GameState = {
  session_auth: false,
  progress_stage: 0,
  loginAttempts: 0,
  mystery_diary_viewed: false,
  grim_keyword_entered: false,
  grim_to_admin_entered: false,
  grim_to_xxx_entered: false,
  kiriban_993_viewed: false,
  counter_1234_reached: false,
  azusa_followup_started: false,
  azusa_followup_step: 0,
  azusa_followup_done: false,
  azusa_apology_diary_created: false,
  login_disabled: false,
  bbs_reply_consumed: false,
  navigation_locked: false,
  lock_started_at: 0,
  lock_duration_ms: 7000,
  _lockTimerId: null,

  /**
   * sessionStorage から状態を読み込む
   */
  load() {
    const stored = sessionStorage.getItem('gameState')
    if (stored) {
      try {
        const state = JSON.parse(stored)
        this.session_auth = state.session_auth ?? false
        this.progress_stage = state.progress_stage ?? 0
        this.loginAttempts = state.loginAttempts ?? 0
        this.mystery_diary_viewed = state.mystery_diary_viewed ?? false
        this.grim_keyword_entered = state.grim_keyword_entered ?? false
        this.grim_to_admin_entered = state.grim_to_admin_entered ?? false
        this.grim_to_xxx_entered = state.grim_to_xxx_entered ?? false
        this.kiriban_993_viewed = state.kiriban_993_viewed ?? false
        this.counter_1234_reached = state.counter_1234_reached ?? false
        this.azusa_followup_started = state.azusa_followup_started ?? false
        this.azusa_followup_step = state.azusa_followup_step ?? 0
        this.azusa_followup_done = state.azusa_followup_done ?? false
        this.azusa_apology_diary_created = state.azusa_apology_diary_created ?? false
        this.login_disabled = state.login_disabled ?? false
        this.bbs_reply_consumed = state.bbs_reply_consumed ?? false
        this.navigation_locked = state.navigation_locked ?? false
        this.lock_started_at = state.lock_started_at ?? 0
        this.lock_duration_ms = state.lock_duration_ms ?? 7000
      } catch (error) {
        console.error('Failed to load game state:', error)
      }
    }
  },

  /**
   * 現在の状態を sessionStorage に保存
   */
  save() {
    const state = {
      session_auth: this.session_auth,
      progress_stage: this.progress_stage,
      loginAttempts: this.loginAttempts,
      mystery_diary_viewed: this.mystery_diary_viewed,
      grim_keyword_entered: this.grim_keyword_entered,
      grim_to_admin_entered: this.grim_to_admin_entered,
      grim_to_xxx_entered: this.grim_to_xxx_entered,
      kiriban_993_viewed: this.kiriban_993_viewed,
      counter_1234_reached: this.counter_1234_reached,
      azusa_followup_started: this.azusa_followup_started,
      azusa_followup_step: this.azusa_followup_step,
      azusa_followup_done: this.azusa_followup_done,
      azusa_apology_diary_created: this.azusa_apology_diary_created,
      login_disabled: this.login_disabled,
      bbs_reply_consumed: this.bbs_reply_consumed,
      navigation_locked: this.navigation_locked,
      lock_started_at: this.lock_started_at,
      lock_duration_ms: this.lock_duration_ms,
    }
    sessionStorage.setItem('gameState', JSON.stringify(state))
  },

  /**
   * ログイン処理 - パスワード検証
   * @param {string} password - ユーザー入力パスワード
   * @returns {boolean} ログイン成功フラグ
   */
  login(password) {
    if (this.login_disabled) {
      return false
    }

    const CORRECT_PASSWORDS = ['ほろう', 'ホロウ']
    
    if (CORRECT_PASSWORDS.includes(password)) {
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
   * 日記「謎」閲覧フラグを設定
   */
  markMysteryDiaryViewed() {
    if (!this.mystery_diary_viewed) {
      this.mystery_diary_viewed = true
      this.save()
    }
  },

  /**
   * 「ぐりむ / グリム」入力済みフラグを設定
   */
  markGrimKeywordEntered() {
    if (!this.grim_keyword_entered) {
      this.grim_keyword_entered = true
      this.save()
    }
  },

  /**
   * 「ぐりむ -> 管理人」入力済みフラグを設定
   */
  markGrimToAdminEntered() {
    if (!this.grim_to_admin_entered) {
      this.grim_to_admin_entered = true
      this.save()
    }
  },

  /**
   * 「ぐりむ -> XXX」入力済みフラグを設定
   */
  markGrimToXxxEntered() {
    if (!this.grim_to_xxx_entered) {
      this.grim_to_xxx_entered = true
      this.save()
    }
  },

  /**
   * キリ番スレ(993)閲覧フラグを設定
   */
  markKiriban993Viewed() {
    if (!this.kiriban_993_viewed) {
      this.kiriban_993_viewed = true
      this.save()
    }
  },

  /**
   * アクセス数1234到達フラグを設定
   */
  markCounter1234Reached() {
    if (!this.counter_1234_reached) {
      this.counter_1234_reached = true
      this.save()
    }
  },

  startAzusaFollowup() {
    if (this.azusa_followup_done) return
    if (!this.azusa_followup_started) {
      this.azusa_followup_started = true
      this.azusa_followup_step = 0
      this.save()
    }
  },

  advanceAzusaFollowupStep() {
    if (!this.azusa_followup_started || this.azusa_followup_done) return
    this.azusa_followup_step += 1
    this.save()
  },

  completeAzusaFollowup() {
    if (this.azusa_followup_done) return
    this.azusa_followup_done = true
    this.login_disabled = true
    this.save()
  },

  markAzusaApologyDiaryCreated() {
    if (!this.azusa_apology_diary_created) {
      this.azusa_apology_diary_created = true
      this.save()
    }
  },

  /**
   * BBSレス投稿のワンショット消費フラグ
   */
  markBbsReplyConsumed() {
    if (!this.bbs_reply_consumed) {
      this.bbs_reply_consumed = true
      this.save()
    }
  },

  /**
   * ログイン失敗時の遷移ロック開始
   */
  startNavigationLock() {
    this.navigation_locked = true
    this.lock_started_at = Date.now()
    this.save()
    this.scheduleLockExpiration()
  },

  /**
   * 遷移ロック有効判定
   */
  isNavigationLocked() {
    return this.navigation_locked
  },

  /**
   * ロック残り時間（ms）
   */
  getLockRemainingMs() {
    if (!this.navigation_locked) return 0
    const elapsed = Date.now() - this.lock_started_at
    return Math.max(0, this.lock_duration_ms - elapsed)
  },

  /**
   * ロック期限到達判定
   */
  isLockExpired() {
    return this.navigation_locked && this.getLockRemainingMs() <= 0
  },

  /**
   * ロック中なら期限切れ処理を予約
   */
  scheduleLockExpiration() {
    if (!this.navigation_locked) return
    if (this._lockTimerId) {
      clearTimeout(this._lockTimerId)
      this._lockTimerId = null
    }

    const remaining = this.getLockRemainingMs()
    this._lockTimerId = setTimeout(() => {
      this.resetAllAndRedirectToGoogle()
    }, remaining)
  },

  /**
   * 状態を初期化して Google へ遷移
   */
  resetAllAndRedirectToGoogle() {
    if (typeof BBSThreads !== 'undefined' && BBSThreads && typeof BBSThreads.resetToInitial === 'function') {
      BBSThreads.resetToInitial()
    }
    if (typeof DiaryEntries !== 'undefined' && DiaryEntries && typeof DiaryEntries.resetToInitial === 'function') {
      DiaryEntries.resetToInitial()
    }
    this.reset()
    window.location.href = 'https://www.google.com/'
  },

  /**
   * 状態をリセット（デバッグ用）
   */
  reset() {
    this.session_auth = false
    this.progress_stage = 0
    this.loginAttempts = 0
    this.mystery_diary_viewed = false
    this.grim_keyword_entered = false
    this.grim_to_admin_entered = false
    this.grim_to_xxx_entered = false
    this.kiriban_993_viewed = false
    this.counter_1234_reached = false
    this.azusa_followup_started = false
    this.azusa_followup_step = 0
    this.azusa_followup_done = false
    this.azusa_apology_diary_created = false
    this.login_disabled = false
    this.bbs_reply_consumed = false
    this.navigation_locked = false
    this.lock_started_at = 0
    this.lock_duration_ms = 7000
    if (this._lockTimerId) {
      clearTimeout(this._lockTimerId)
      this._lockTimerId = null
    }
    sessionStorage.removeItem('gameState')
  },
}
