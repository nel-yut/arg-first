/**
 * diary.js - 日記管理
 */

const DiaryEntries = {
  entries: [
    {
      date: '2026-02-28',
      title: 'ようこそ',
      content: 'ここは何かの痕跡です。何も書くことがない。',
    },
    {
      date: '2026-02-27',
      title: '始まりました',
      content: 'このサイトが完成しました。これから何が起こるのか。',
    },
    {
      date: '2026-02-26',
      title: '準備中',
      content: '準備中です。',
    },
    {
      date: '2026-02-25',
      title: '晴れた',
      content: 'いい天気でした。',
    },
    {
      date: '2026-02-24',
      title: 'お疲れ',
      content: '今日も一日終わった。',
    },
    {
      date: '2026-02-23',
      title: 'つぶやき',
      content: 'このサイトって何が目的なんでしょう。',
    },
    {
      date: '2026-02-22',
      title: 'ウェブサイト',
      content: 'ウェブサイトを作る仕事をしています。むずかしい。',
    },
    {
      date: '2026-02-21',
      title: '雨の日',
      content: '雨が降っていました。寒い。',
    },
    {
      date: '2026-02-20',
      title: '朝',
      content: '今日も朝が来た。',
    },
    {
      date: '2026-02-19',
      title: '何もない',
      content: '特に何もない一日。',
    },
    {
      date: '2026-01-31',
      title: '月末',
      content: 'もう1月が終わりますね。',
    },
    {
      date: '2026-01-30',
      title: 'パソコン',
      content: 'パソコンが重い。メモリ足りないか。',
    },
  ],

  /**
   * 全エントリを取得（新着順）
   */
  getAll() {
    return this.entries.sort((a, b) => new Date(b.date) - new Date(a.date))
  },

  /**
   * 特定の日付のエントリを取得
   */
  getByDate(date) {
    return this.entries.find(e => e.date === date)
  },

  /**
   * アーカイブを月別で取得
   */
  getArchive() {
    const archive = {}
    this.entries.forEach(entry => {
      const [year, month] = entry.date.split('-')
      const key = `${year}-${month}`
      if (!archive[key]) {
        archive[key] = []
      }
      archive[key].push(entry)
    })

    // 新着月順でソート
    const sorted = {}
    Object.keys(archive)
      .sort()
      .reverse()
      .forEach(key => {
        sorted[key] = archive[key].sort((a, b) => new Date(b.date) - new Date(a.date))
      })

    return sorted
  },

  /**
   * 新規エントリを追加
   */
  addEntry(title, content) {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    this.entries.push({ date, title, content })
  },
}
