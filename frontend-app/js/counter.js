/**
 * counter.js - アクセスカウンター管理
 */

const AccessCounter = {
  key: 'accessCount',

  /**
   * カウンター値を取得（33333固定）
   */
  get() {
    return 33333
  },

  /**
   * カウンターをインクリメント（非表示・固定値）
   */
  increment() {
    return 33333
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
    // localStorage がある場合はそのまま、ない場合は初期値 9998 を設定
    if (!localStorage.getItem(this.key)) {
      localStorage.setItem(this.key, '9998')
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
