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
  // 特殊日記閲覧でBBSスレッド作成欄を解放
  bbs_thread_create_unlocked: false,
  bbs_fixed_thread_created: false,
  bbs_fixed_thread_id: 0,
  ending_code: '',
  // 固定スレ（作成後の新規スレ）演出
  fixed_thread_admin_spam_started: false,
  fixed_thread_admin_spam_stopped: false,
  fixed_thread_admin_spam_count: 0,
  fixed_thread_help_triggered: false,
  fixed_thread_azusa_seq_started: false,
  fixed_thread_azusa_step: 0,
  fixed_thread_azusa_done: false,
  fixed_thread_logout_dialogs_pending: false,
  fixed_thread_logout_dialogs_done: false,
  fixed_thread_draft: '',
  // ページリロード検知（タブ内で増える）
  session_boot_seq: 0,
  // うらなみルート（#997）
  maister_story_started: false,
  maister_start_alerted: false,
  maister_pre_step: 0,
  maister_closing_step: 0,
  maister_image8_viewed: false,
  maister_swap_available_at: 0,
  maister_swap_ready: false,
  // swap_ready になった時点の boot_seq（次のリロード以降で8->9を反映）
  maister_swap_ready_boot_seq: 0,
  maister_swap_announced: false,
  maister_swap_done: false,
  maister_bbs_reentered_after_swap: false,
  maister_logout_unlocked: false,
  // うらなみルート完走（全テキスト文字化け）
  maister_story_complete: false,
  global_mojibake: false,
  // 最終削除モード（メッセージのみ残す）
  site_erased: false,
  site_erased_message: '',
  // ダイアログ制御（Windows風メッセージボックス）
  dialogs_disabled: false,
  dialogs_disable_pending: false,
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
        this.bbs_thread_create_unlocked = state.bbs_thread_create_unlocked ?? false
        this.bbs_fixed_thread_created = state.bbs_fixed_thread_created ?? false
        this.bbs_fixed_thread_id = state.bbs_fixed_thread_id ?? 0
        this.ending_code = state.ending_code ?? ''
        this.fixed_thread_admin_spam_started = state.fixed_thread_admin_spam_started ?? false
        this.fixed_thread_admin_spam_stopped = state.fixed_thread_admin_spam_stopped ?? false
        this.fixed_thread_admin_spam_count = state.fixed_thread_admin_spam_count ?? 0
        this.fixed_thread_help_triggered = state.fixed_thread_help_triggered ?? false
        this.fixed_thread_azusa_seq_started = state.fixed_thread_azusa_seq_started ?? false
        this.fixed_thread_azusa_step = state.fixed_thread_azusa_step ?? 0
        this.fixed_thread_azusa_done = state.fixed_thread_azusa_done ?? false
        this.fixed_thread_logout_dialogs_pending = state.fixed_thread_logout_dialogs_pending ?? false
        this.fixed_thread_logout_dialogs_done = state.fixed_thread_logout_dialogs_done ?? false
        this.fixed_thread_draft = state.fixed_thread_draft ?? ''
        this.session_boot_seq = state.session_boot_seq ?? 0
        this.maister_story_started = state.maister_story_started ?? false
        this.maister_start_alerted = state.maister_start_alerted ?? false
        this.maister_pre_step = state.maister_pre_step ?? 0
        this.maister_closing_step = state.maister_closing_step ?? 0
        this.maister_image8_viewed = state.maister_image8_viewed ?? false
        this.maister_swap_available_at = state.maister_swap_available_at ?? 0
        this.maister_swap_ready = state.maister_swap_ready ?? false
        this.maister_swap_ready_boot_seq = state.maister_swap_ready_boot_seq ?? 0
        this.maister_swap_announced = state.maister_swap_announced ?? false
        this.maister_swap_done = state.maister_swap_done ?? false
        this.maister_bbs_reentered_after_swap = state.maister_bbs_reentered_after_swap ?? false
        this.maister_logout_unlocked = state.maister_logout_unlocked ?? false
        this.maister_story_complete = state.maister_story_complete ?? false
        this.global_mojibake = state.global_mojibake ?? false
        this.site_erased = state.site_erased ?? false
        this.site_erased_message = state.site_erased_message ?? ''
        this.dialogs_disabled = state.dialogs_disabled ?? false
        this.dialogs_disable_pending = state.dialogs_disable_pending ?? false
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
      bbs_thread_create_unlocked: this.bbs_thread_create_unlocked,
      bbs_fixed_thread_created: this.bbs_fixed_thread_created,
      bbs_fixed_thread_id: this.bbs_fixed_thread_id,
      ending_code: this.ending_code,
      fixed_thread_admin_spam_started: this.fixed_thread_admin_spam_started,
      fixed_thread_admin_spam_stopped: this.fixed_thread_admin_spam_stopped,
      fixed_thread_admin_spam_count: this.fixed_thread_admin_spam_count,
      fixed_thread_help_triggered: this.fixed_thread_help_triggered,
      fixed_thread_azusa_seq_started: this.fixed_thread_azusa_seq_started,
      fixed_thread_azusa_step: this.fixed_thread_azusa_step,
      fixed_thread_azusa_done: this.fixed_thread_azusa_done,
      fixed_thread_logout_dialogs_pending: this.fixed_thread_logout_dialogs_pending,
      fixed_thread_logout_dialogs_done: this.fixed_thread_logout_dialogs_done,
      fixed_thread_draft: this.fixed_thread_draft,
      session_boot_seq: this.session_boot_seq,
      maister_story_started: this.maister_story_started,
      maister_start_alerted: this.maister_start_alerted,
      maister_pre_step: this.maister_pre_step,
      maister_closing_step: this.maister_closing_step,
      maister_image8_viewed: this.maister_image8_viewed,
      maister_swap_available_at: this.maister_swap_available_at,
      maister_swap_ready: this.maister_swap_ready,
      maister_swap_ready_boot_seq: this.maister_swap_ready_boot_seq,
      maister_swap_announced: this.maister_swap_announced,
      maister_swap_done: this.maister_swap_done,
      maister_bbs_reentered_after_swap: this.maister_bbs_reentered_after_swap,
      maister_logout_unlocked: this.maister_logout_unlocked,
      maister_story_complete: this.maister_story_complete,
      global_mojibake: this.global_mojibake,
      site_erased: this.site_erased,
      site_erased_message: this.site_erased_message,
      dialogs_disabled: this.dialogs_disabled,
      dialogs_disable_pending: this.dialogs_disable_pending,
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
   * ページ読み込み（リロード）を記録
   * sessionStorage 前提なので、タブを閉じると 0 に戻る
   */
  markSessionBoot() {
    this.session_boot_seq = (this.session_boot_seq || 0) + 1

    // 旧データ互換: swap_ready なのに準備時点が不明な場合は「次のリロードで反映」に寄せる
    if (
      this.maister_swap_ready &&
      !this.maister_swap_done &&
      !this.maister_swap_ready_boot_seq
    ) {
      this.maister_swap_ready_boot_seq = this.session_boot_seq
    }

    this.save()
  },

  /**
   * ログイン処理 - パスワード検証
   * @param {string} password - ユーザー入力パスワード
   * @returns {boolean} ログイン成功フラグ
   */
  login(password) {
    if (this.site_erased) {
      return false
    }
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

  _endingRank(code) {
    if (code === 'ED-3') return 3
    if (code === 'ED-2') return 2
    if (code === 'ED-1') return 1
    return 0
  },

  setEndingCode(code) {
    const next = String(code || '')
    const curr = String(this.ending_code || '')
    if (this._endingRank(next) <= this._endingRank(curr)) {
      return
    }
    this.ending_code = next
    this.save()
  },

  /**
   * 「ぐりむ / グリム」入力済みフラグを設定
   */
  markGrimKeywordEntered() {
    if (!this.grim_keyword_entered) {
      this.grim_keyword_entered = true
      this.setEndingCode('ED-1')
      this.save()
    }
  },

  /**
   * 「ぐりむ -> 管理人」入力済みフラグを設定
   */
  markGrimToAdminEntered() {
    if (!this.grim_to_admin_entered) {
      this.grim_to_admin_entered = true
      this.setEndingCode('ED-2')
      this.save()
    }
  },

  /**
   * 「ぐりむ -> XXX」入力済みフラグを設定
   */
  markGrimToXxxEntered() {
    if (!this.grim_to_xxx_entered) {
      this.grim_to_xxx_entered = true
      this.setEndingCode('ED-3')
      this.save()
    }
  },

  // --- 固定スレ（作成後の新規スレ）演出 ---
  startFixedThreadAdminSpam() {
    if (!this.fixed_thread_admin_spam_started) {
      this.fixed_thread_admin_spam_started = true
      this.save()
    }
  },

  stopFixedThreadAdminSpam() {
    if (!this.fixed_thread_admin_spam_stopped) {
      this.fixed_thread_admin_spam_stopped = true
      this.save()
    }
  },

  incrementFixedThreadAdminSpamCount() {
    this.fixed_thread_admin_spam_count = (this.fixed_thread_admin_spam_count || 0) + 1
    this.save()
  },

  markFixedThreadHelpTriggered() {
    if (!this.fixed_thread_help_triggered) {
      this.fixed_thread_help_triggered = true
      this.save()
    }
  },

  startFixedThreadAzusaSeq() {
    if (this.fixed_thread_azusa_done) return
    if (!this.fixed_thread_azusa_seq_started) {
      this.fixed_thread_azusa_seq_started = true
      this.fixed_thread_azusa_step = 0
      this.save()
    }
  },

  advanceFixedThreadAzusaStep() {
    if (!this.fixed_thread_azusa_seq_started || this.fixed_thread_azusa_done) return
    this.fixed_thread_azusa_step += 1
    this.save()
  },

  completeFixedThreadAzusaSeqAndUnlockLogout() {
    if (this.fixed_thread_azusa_done) return
    this.fixed_thread_azusa_done = true
    this.fixed_thread_logout_dialogs_pending = true
    this.save()
  },

  markFixedThreadLogoutDialogsDone() {
    if (!this.fixed_thread_logout_dialogs_done) {
      this.fixed_thread_logout_dialogs_done = true
      this.fixed_thread_logout_dialogs_pending = false
      this.save()
    }
  },

  setFixedThreadDraft(text) {
    this.fixed_thread_draft = String(text ?? '')
    this.save()
  },

  clearFixedThreadDraft() {
    if (this.fixed_thread_draft) {
      this.fixed_thread_draft = ''
      this.save()
    }
  },

  startMaisterStory() {
    if (this.maister_story_started) return
    this.maister_story_started = true
    this.maister_start_alerted = false
    this.maister_pre_step = 0
    this.maister_closing_step = 0
    this.maister_image8_viewed = false
    this.maister_swap_available_at = 0
    this.maister_swap_ready = false
    this.maister_swap_ready_boot_seq = 0
    this.maister_swap_announced = false
    this.maister_swap_done = false
    this.maister_bbs_reentered_after_swap = false
    this.maister_logout_unlocked = false
    this.maister_story_complete = false
    this.global_mojibake = false
    this.dialogs_disabled = false
    this.dialogs_disable_pending = false
    this.save()
  },

  markMaisterStartAlerted() {
    if (!this.maister_start_alerted) {
      this.maister_start_alerted = true
      this.save()
    }
  },

  advanceMaisterPreStep() {
    this.maister_pre_step += 1
    this.save()
  },

  advanceMaisterClosingStep() {
    this.maister_closing_step += 1
    this.save()
  },

  markMaisterImage8Viewed() {
    if (this.maister_image8_viewed) return
    this.maister_image8_viewed = true
    // 直後ではなく、少し遅れてから置き換え可能にする
    this.maister_swap_available_at = Date.now() + 12000
    this.save()
  },

  makeMaisterSwapReady() {
    if (!this.maister_swap_ready) {
      this.maister_swap_ready = true
      this.maister_swap_ready_boot_seq = this.session_boot_seq || 0
      this.save()
    }
  },

  markMaisterSwapAnnounced() {
    if (!this.maister_swap_announced) {
      this.maister_swap_announced = true
      this.save()
    }
  },

  markMaisterSwapDone() {
    if (!this.maister_swap_done) {
      this.maister_swap_done = true
      this.save()
    }
  },

  markMaisterBbsReenteredAfterSwap() {
    if (!this.maister_bbs_reentered_after_swap) {
      this.maister_bbs_reentered_after_swap = true
      this.save()
    }
  },

  unlockMaisterLogout() {
    if (!this.maister_logout_unlocked) {
      this.maister_logout_unlocked = true
      this.save()
    }
  },

  completeMaisterStoryAndCorruptAllText() {
    if (!this.maister_story_complete) {
      this.maister_story_complete = true
    }
    if (!this.global_mojibake) {
      this.global_mojibake = true
    }
    // 文字化け発生後はダイアログを停止
    this.dialogs_disable_pending = false
    this.dialogs_disabled = true
    this.save()
  },

  markDialogsDisablePending() {
    if (!this.dialogs_disable_pending) {
      this.dialogs_disable_pending = true
      this.save()
    }
  },

  disableDialogs() {
    if (!this.dialogs_disabled || this.dialogs_disable_pending) {
      this.dialogs_disabled = true
      this.dialogs_disable_pending = false
      this.save()
    }
  },

  enableGlobalMojibake() {
    if (!this.global_mojibake) {
      this.global_mojibake = true
      this.save()
    }
  },

  /**
   * 最終削除モードへ移行（メッセージだけ残す）
   */
  eraseSiteKeepMessage(message) {
    // 以後フラグを初期化していくため、ここでエンディングコードだけ確定させて保持する
    const endingSnapshot =
      String(this.ending_code || '') ||
      (this.grim_to_xxx_entered ? 'ED-3' : this.grim_to_admin_entered ? 'ED-2' : this.grim_keyword_entered ? 'ED-1' : '')

    // 他ストレージを削除（空配列で固定して初期データ復帰を防ぐ）
    if (typeof BBSThreads !== 'undefined' && BBSThreads && typeof BBSThreads.clearAll === 'function') {
      BBSThreads.clearAll()
    }
    if (typeof DiaryEntries !== 'undefined' && DiaryEntries && typeof DiaryEntries.clearAll === 'function') {
      DiaryEntries.clearAll()
    }
    sessionStorage.removeItem('accessCount')
    sessionStorage.removeItem('accessCountCustom')

    // GameState は保持しつつ、最終メッセージのみ残す
    this.session_auth = false
    this.progress_stage = 0
    this.loginAttempts = 0
    this.mystery_diary_viewed = false
    this.grim_keyword_entered = false
    this.grim_to_admin_entered = false
    this.grim_to_xxx_entered = false
    this.kiriban_993_viewed = false
    this.counter_1234_reached = false
    this.bbs_thread_create_unlocked = false
    this.bbs_fixed_thread_created = false
    this.bbs_fixed_thread_id = 0
    // エンディングコードは最終メッセージ(#/final)右下に表示するため保持する
    this.fixed_thread_admin_spam_started = false
    this.fixed_thread_admin_spam_stopped = false
    this.fixed_thread_admin_spam_count = 0
    this.fixed_thread_help_triggered = false
    this.fixed_thread_azusa_seq_started = false
    this.fixed_thread_azusa_step = 0
    this.fixed_thread_azusa_done = false
    this.fixed_thread_logout_dialogs_pending = false
    this.fixed_thread_logout_dialogs_done = false
    this.fixed_thread_draft = ''
    this.maister_story_started = false
    this.maister_start_alerted = false
    this.maister_pre_step = 0
    this.maister_closing_step = 0
    this.maister_image8_viewed = false
    this.maister_swap_available_at = 0
    this.maister_swap_ready = false
    this.maister_swap_ready_boot_seq = 0
    this.maister_swap_announced = false
    this.maister_swap_done = false
    this.maister_bbs_reentered_after_swap = false
    this.maister_logout_unlocked = false
    this.maister_story_complete = false
    this.global_mojibake = false
    this.azusa_followup_started = false
    this.azusa_followup_step = 0
    this.azusa_followup_done = false
    this.azusa_apology_diary_created = false
    this.bbs_reply_consumed = false
    this.navigation_locked = false
    this.lock_started_at = 0
    this.lock_duration_ms = 7000
    if (this._lockTimerId) {
      clearTimeout(this._lockTimerId)
      this._lockTimerId = null
    }
    this.login_disabled = true

    this.site_erased = true
    this.site_erased_message = String(message || '')
    this.ending_code = endingSnapshot
    this.dialogs_disabled = true
    this.dialogs_disable_pending = false

    this.save()
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

  unlockBbsThreadCreate() {
    if (!this.bbs_thread_create_unlocked) {
      this.bbs_thread_create_unlocked = true
      this.save()
    }
  },

  markBbsFixedThreadCreated() {
    if (!this.bbs_fixed_thread_created) {
      this.bbs_fixed_thread_created = true
      this.save()
    }
  },

  setBbsFixedThreadId(id) {
    const n = Number(id)
    if (!Number.isFinite(n) || n <= 0) return
    if (this.bbs_fixed_thread_id !== n) {
      this.bbs_fixed_thread_id = n
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
    this.bbs_thread_create_unlocked = false
    this.bbs_fixed_thread_created = false
    this.bbs_fixed_thread_id = 0
    this.ending_code = ''
    this.fixed_thread_admin_spam_started = false
    this.fixed_thread_admin_spam_stopped = false
    this.fixed_thread_admin_spam_count = 0
    this.fixed_thread_help_triggered = false
    this.fixed_thread_azusa_seq_started = false
    this.fixed_thread_azusa_step = 0
    this.fixed_thread_azusa_done = false
    this.fixed_thread_logout_dialogs_pending = false
    this.fixed_thread_logout_dialogs_done = false
    this.fixed_thread_draft = ''
    this.session_boot_seq = 0
    this.maister_story_started = false
    this.maister_start_alerted = false
    this.maister_pre_step = 0
    this.maister_closing_step = 0
    this.maister_image8_viewed = false
    this.maister_swap_available_at = 0
    this.maister_swap_ready = false
    this.maister_swap_ready_boot_seq = 0
    this.maister_swap_announced = false
    this.maister_swap_done = false
    this.maister_bbs_reentered_after_swap = false
    this.maister_logout_unlocked = false
    this.maister_story_complete = false
    this.global_mojibake = false
    this.site_erased = false
    this.site_erased_message = ''
    this.dialogs_disabled = false
    this.dialogs_disable_pending = false
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
