/**
 * threads.js - BBS スレッド管理
 */

const BBSThreads = {
  threads: [
    {
      id: 998,
      title: '雑談スレ',
      createdAt: '2026-02-28',
      posts: [
        { id: 1, name: '名無し', content: 'こんにちは', date: '2026-02-28 10:30' },
        { id: 2, name: '名無し', content: 'わかりました', date: '2026-02-28 11:00' },
      ],
    },
    {
      id: 997,
      title: '攻略スレ',
      createdAt: '2026-02-27',
      posts: [
        { id: 1, name: '名無し', content: 'ここはどうすればいいの？', date: '2026-02-27 15:20' },
        { id: 2, name: '管理人', content: '左をみてみて', date: '2026-02-27 16:00' },
      ],
    },
    {
      id: 996,
      title: '何か怖い',
      createdAt: '2026-02-26',
      posts: [
        { id: 1, name: '名無し', content: 'このサイト何か変',
          date: '2026-02-26 20:00' },
      ],
    },
    {
      id: 995,
      title: '日常',
      createdAt: '2026-02-25',
      posts: [
        { id: 1, name: '名無し', content: '今日もいい天気だった', date: '2026-02-25 18:30' },
      ],
    },
  ],

  /**
   * スレッド一覧を取得
   */
  getAll() {
    return this.threads.sort((a, b) => b.id - a.id)
  },

  /**
   * ID でスレッドを取得
   */
  getById(id) {
    return this.threads.find(t => t.id === id)
  },

  /**
   * スレッドにレスを追加
   */
  addPost(threadId, name, content) {
    const thread = this.getById(threadId)
    if (!thread) return false

    const postId = (thread.posts[thread.posts.length - 1]?.id || 0) + 1
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    thread.posts.push({
      id: postId,
      name: '名無し',
      content,
      date,
    })
    return true
  },

  /**
   * 新規スレッドを作成
   */
  createThread(title) {
    const newId = Math.max(...this.threads.map(t => t.id)) + 1
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    this.threads.push({
      id: newId,
      title,
      createdAt: dateStr,
      posts: [],
    })
    return newId
  },
}
