/**
 * counter.js - アクセスカウンター管理
 */

const AccessCounter = {
  key: 'accessCount',
  customKey: 'accessCountCustom',
  defaultValue: 2472,

  /**
   * カウンター値を取得
   */
  get() {
    const raw = sessionStorage.getItem(this.key)
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed)
    }
    return this.defaultValue
  },

  /**
   * カウンターをインクリメント（このアプリでは値固定）
   */
  increment() {
    return this.get()
  },

  /**
   * カウンター値を明示的に設定
   */
  set(value) {
    const num = Number(value)
    if (!Number.isFinite(num) || num < 0) return false
    sessionStorage.setItem(this.key, String(Math.floor(num)))
    sessionStorage.setItem(this.customKey, '1')
    return true
  },

  /**
   * カウンター値をリセット（非表示）
   */
  reset() {
  },

  /**
   * localStorage から読み込み（初期化用）
   */
  load() {
    // 未カスタム時は毎回 2472 を初期値として適用
    const isCustom = sessionStorage.getItem(this.customKey) === '1'
    if (!isCustom) {
      sessionStorage.setItem(this.key, String(this.defaultValue))
      sessionStorage.setItem(this.customKey, '0')
      return
    }

    // カスタム済みでも値が壊れていたら初期値に戻す
    const raw = sessionStorage.getItem(this.key)
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) {
      sessionStorage.setItem(this.key, String(this.defaultValue))
      sessionStorage.setItem(this.customKey, '0')
    }
  },

  /**
   * カウンター値をフォーマット（4桁）
   */
  format(num) {
    const value = num !== undefined ? num : this.get()
    return String(value).padStart(4, '0')
  },

  /**
   * フォーマット済みのカウンター値を取得
   */
  getFormatted() {
    return this.format(this.get())
  },
}
