/**
 * threads.js - BBS スレッド管理
 */

const INITIAL_THREADS = [
  {
    id: 999,
    title: '遘√ｂ雕上ｓ縺�縺ｮ縺ｫ',
    createdAt: '2008-02-29',
    posts: [
      { id: 1, name: '管理人', content: '遘√ｂ雕上ｓ縺�縺ｮ縺ｫ', date: '2008-02-29 00:00' },
    ],
  },
  {
    id: 998,
    title: '閉鎖について',
    createdAt: '2008-02-26',
    posts: [
      { id: 1, name: 'ぐりむ', content: '管理人です。先日のオフ会でのトラブルを受けて、このサイトの閉鎖を決めました。突然のご報告になってしまい、本当に申し訳ありません。', date: '2008-02-26 00:12' },
      { id: 2, name: '名無し', content: '急すぎて頭が追いつかないです。日記を読んだけど、帰宅確認が取れていない人がいるって本当なんですか。', date: '2008-02-26 00:20' },
      { id: 3, name: 'ぐりむ', content: '現時点で確認中です。事実確認できたことだけを出すつもりですが、これ以上ここを交流の場として続けるのは難しいと判断しました。', date: '2008-02-26 00:31' },
      { id: 4, name: '管理人', content: '閉鎖は取り消しません。記録は残します。消去操作は不要です。', date: '2008-02-26 00:36' },
      { id: 6, name: '名無し', content: '閉鎖後もログだけ読める形にする予定はありますか。', date: '2008-02-26 00:53' },
      { id: 7, name: '管理人', content: '公開範囲は変更済みです。', date: '2008-02-26 00:55' },
      { id: 8, name: '名無し', content: '変更済みなら、見える範囲の説明だけでもお願いしたいです。', date: '2008-02-26 00:58' },
      { id: 9, name: 'ぐりむ', content: '説明文を追記します。まずは安全確認を優先します。', date: '2008-02-26 01:02' },
      { id: 10, name: '名無し', content: '了解です。進展待ちます。', date: '2008-02-26 01:06' },
      { id: 11, name: '名無し', content: '夜遅いので一旦落ちます。', date: '2008-02-26 01:09' },
    ],
  },
  {
    id: 997,
    title: '犯人捜し',
    createdAt: '2008-02-25',
    posts: [
      { id: 1, name: '名無し', content: 'オフ会でケンカになった原因、誰が最初に煽ったのか知ってる人いませんか。', date: '2008-02-25 22:01' },
      { id: 2, name: '名無し', content: '犯人捜しはやめたほうがいいと思う。今は行方不明の人の情報を優先するべきでは。', date: '2008-02-25 22:10' },
      { id: 3, name: '管理人', content: '責任の所在は特定済みです。該当者への対応を進めています。', date: '2008-02-25 22:14' },
      { id: 4, name: '名無し', content: '対応が早いのは助かるけど、情報は慎重に出してほしいです。', date: '2008-02-25 22:18' },
      { id: 5, name: 'ぐりむ', content: 'この件で個人名を出す投稿は控えてください。今は事実確認中です。感情的なやり取りはこれ以上増やしたくありません。', date: '2008-02-25 22:26' },
      { id: 6, name: '名無し', content: '当日の席順とか、時系列だけでも共有できますか。', date: '2008-02-25 22:31' },
      { id: 7, name: '名無し', content: '記憶違いが混ざるとまずいので、証言を分けて整理したい。', date: '2008-02-25 22:35' },
      { id: 8, name: 'ぐりむ', content: '時系列メモは作成中です。確定した情報だけ先に共有します。', date: '2008-02-25 22:39' },
      { id: 9, name: '管理人', content: '記録はすべて保存済みです。追って公開します。', date: '2008-02-25 22:43' },
      { id: 10, name: '名無し', content: '了解。断定は避けて、進展待ちます。', date: '2008-02-25 22:47' },
      { id: 11, name: '名無し', content: '会場の出入り時刻だけでも共有できれば助かります。', date: '2008-02-25 22:52' },
      { id: 12, name: 'ぐりむ', content: '時刻情報は照合中です。確定したものから順に出します。', date: '2008-02-25 22:56' },
      { id: 13, name: '管理人', content: '欠損ログは補完済みです。', date: '2008-02-25 23:01' },
      { id: 14, name: '名無し', content: 'ありがとうございます。引き続き冷静に進めましょう。', date: '2008-02-25 23:06' },
      { id: 15, name: '管理人', content: '誰が彼女を閉じ込めたんでしょうか', date: '2008-02-25 23:09' },
    ],
  },
  {
    id: 996,
    title: 'オフ会！',
    createdAt: '2008-02-24',
    posts: [
      { id: 1, name: '名無し', content: '今日はお疲れさまでした。前半はかなり楽しかったです。', date: '2008-02-24 21:40' },
      { id: 2, name: '名無し', content: '最初の自己紹介タイム、緊張したけど雰囲気よかった。', date: '2008-02-24 21:42' },
      { id: 3, name: '名無し', content: '途中で席替えしたあたりから空気変わった気がする。', date: '2008-02-24 21:46' },
      { id: 4, name: '名無し', content: '言い方きつい人がいて、そこで空気がピリついた。', date: '2008-02-24 21:49' },
      { id: 5, name: '名無し', content: '帰り道まで気まずかった。連絡先交換できなかった人もいる。', date: '2008-02-24 21:53' },
      { id: 6, name: '名無し', content: '最終的に参加者って何人だったんだろう。', date: '2008-02-24 21:56' },
      { id: 7, name: '名無し', content: '予定者込みで7名だったはず。直前キャンセルなしで全員来てたと思う。', date: '2008-02-24 21:58' },
      { id: 8, name: 'ぐりむ', content: '意見ありがとうございます。進行の甘さは認識しています。次回があるなら体制を見直します。', date: '2008-02-24 22:01' },
      { id: 9, name: '名無し', content: '同意。テーマごとに区切った方が衝突しにくいかも。', date: '2008-02-24 22:04' },
      { id: 10, name: '名無し', content: '次回があるなら、開始前にルール確認を入れた方が良いです。', date: '2008-02-24 22:07' },
      { id: 11, name: 'ぐりむ', content: '今日はここで締めます。参加してくれた皆さん、ありがとうございました。', date: '2008-02-24 22:09' },
    ],
  },
  {
    id: 995,
    title: 'オフ会 参加者募集',
    createdAt: '2007-11-15',
    posts: [
      { id: 1, name: 'ぐりむ', content: 'オフ会参加者を募集します！！参加希望の方はこのスレで表明お願いします。', date: '2007-11-15 12:00' },
      { id: 2, name: '名無し', content: '自分も参加希望。途中参加になるかもしれません。', date: '2007-11-15 12:05' },
      { id: 3, name: '名無し', content: '行けるか未定だけど興味あります。仮参加扱いって可能？', date: '2007-11-15 12:11' },
      { id: 4, name: '名無し', content: '場所だけ先に知りたいです。遠方なので時間見たい。', date: '2007-11-15 12:16' },
      { id: 5, name: '名無し', content: '初心者向けの話題でも大丈夫なら参加したい。', date: '2007-11-15 12:20' },
      { id: 6, name: '名無し', content: '参加者まとめ: 確定5、予定2で合計7名（予定者含む）です。', date: '2007-11-15 12:24' },
      { id: 7, name: '名無し', content: '7名ならちょうど良さそう。席の予約だけ気になる。', date: '2007-11-15 12:29' },
      { id: 8, name: '名無し', content: '予定2名のうち1名は当日朝に最終連絡とのこと。', date: '2007-11-15 12:33' },
      { id: 9, name: '名無し', content: '遅れる人向けに集合場所ピン留めしておいてほしい。', date: '2007-11-15 12:37' },
      { id: 10, name: 'ぐりむ', content: '了解です。現時点では予定者込み7名で準備を進めます。', date: '2007-11-15 12:41' },
      { id: 11, name: '名無し', content: '自分は当日10分ほど遅れそうです。先に始めてください。', date: '2007-11-15 12:46' },
      { id: 12, name: '名無し', content: '了解。遅刻者向けに目印決めておくと良いかも。', date: '2007-11-15 12:50' },
      { id: 13, name: 'ぐりむ', content: '目印は青いファイルにします。集合場所で持って待ちます。', date: '2007-11-15 12:54' },
      { id: 14, name: '名無し', content: '食事アレルギーある人いたら先に申告お願いします。', date: '2007-11-15 12:58' },
      { id: 15, name: '名無し', content: '自分は特になしです。', date: '2007-11-15 13:01' },
      { id: 16, name: '名無し', content: '当日の連絡先はこのスレで大丈夫？', date: '2007-11-15 13:05' },
      { id: 17, name: 'ぐりむ', content: '当日連絡もこのスレで対応します。よろしくお願いします。', date: '2007-11-15 13:08' },
    ],
  },
  {
    id: 994,
    title: '雑談',
    createdAt: '2007-11-12',
    posts: [
      { id: 1, name: '名無し', content: 'こんにちは。最近このサイト見始めました。', date: '2007-11-12 09:10' },
      { id: 2, name: '名無し', content: 'いらっしゃい。日記の雰囲気が独特で好き。', date: '2007-11-12 09:12' },
      { id: 3, name: '名無し', content: 'BBSの黒背景、懐かしい感じで落ち着く。', date: '2007-11-12 09:15' },
      { id: 4, name: '名無し', content: '倉庫ページのロック演出もいいね。', date: '2007-11-12 09:18' },
      { id: 5, name: '名無し', content: 'リンク集だけ開けない時があるんですが、うちだけかな。', date: '2007-11-12 09:21' },
      { id: 6, name: '名無し', content: 'こっちでも再現した。404っぽい画面になる。', date: '2007-11-12 09:24' },
      { id: 7, name: 'ぐりむ', content: '報告ありがとうございます。リンク集の不安定さはこちらでも確認中です。', date: '2007-11-12 09:27' },
      { id: 8, name: '名無し', content: '深夜帯の方が表示遅い気がする。', date: '2007-11-12 09:30' },
      { id: 9, name: '名無し', content: '雑談スレは今のところ一番安定してる。', date: '2007-11-12 09:33' },
      { id: 10, name: '名無し', content: 'とりあえず記録残しておく。再現したら時間つきで書きます。', date: '2007-11-12 09:36' },
      { id: 11, name: 'ぐりむ', content: '情報ありがとうございます。再現時刻の共有、助かります。', date: '2007-11-12 09:40' },
      { id: 12, name: '名無し', content: '今日は今のところ安定してます。', date: '2007-11-12 09:45' },
      { id: 13, name: '名無し', content: 'また不安定になったら報告します。', date: '2007-11-12 09:49' },
    ],
  },
  {
    id: 993,
    title: 'キリ番報告',
    createdAt: '2007-11-11',
    posts: [
      { id: 1, name: '名無し', content: '0500踏みました！記念に書き込み。', date: '2007-11-11 20:05' },
      { id: 2, name: '名無し', content: '0501だった、惜しい。', date: '2007-11-11 20:07' },
      { id: 3, name: '名無し', content: '次は0555を狙います。', date: '2007-11-11 20:10' },
      { id: 4, name: '名無し', content: '0555報告。3桁ゾロ目うれしい。', date: '2007-11-11 20:13' },
      { id: 5, name: '名無し', content: '0779到達。777踏んだ人いたらどうぞ。', date: '2007-11-11 20:16' },
      { id: 6, name: '名無し', content: '0888ゲット。スクショ取った。', date: '2007-11-11 20:19' },
      { id: 7, name: '名無し', content: '0999通過。1000まであと1つ。', date: '2007-11-11 20:22' },
      { id: 8, name: '名無し', content: '1111踏みました。報告します。', date: '2007-11-11 20:27' },
      { id: 9, name: '名無し', content: '1112だった。1111の人おめ。', date: '2007-11-11 20:25' },
      { id: 10, name: 'ぐりむ', content: '報告ありがとうございます！！次は1234目標でお願いします。', date: '2007-11-11 20:30' },
      { id: 11, name: '名無し', content: '2000踏み。地味にうれしい。', date: '2007-11-11 20:36' },
      { id: 12, name: 'ぐりむ', content: '2000報告ありがとうございます！', date: '2007-11-11 20:39' },
      { id: 13, name: '名無し', content: '2221だった。次の人2222おめ。', date: '2007-11-11 20:43' },
      { id: 14, name: '名無し', content: '2222踏みました。報告完了です。', date: '2007-11-11 20:46' },
    ],
  },
  {
    id: 992,
    title: 'バグ報告',
    createdAt: '2007-11-10',
    posts: [
      { id: 1, name: '名無し', content: '投稿を編集して保存すると、たまに内容が巻き戻ることがあります。', date: '2007-11-10 17:41' },
      { id: 2, name: '名無し', content: 'リンク集ページが開けないです。404っぽい画面になります。', date: '2007-11-10 17:45' },
      { id: 3, name: '名無し', content: 'BBS一覧で件数が更新されない時がある。', date: '2007-11-10 17:48' },
      { id: 4, name: '名無し', content: 'ケータイで見ると投稿フォームがはみ出します。', date: '2007-11-10 17:52' },
      { id: 5, name: '名無し', content: '日記の前後リンク、たまに逆順になる？', date: '2007-11-10 17:56' },
      { id: 6, name: '名無し', content: 'ログイン失敗時にメッセージが二重表示になることがある。', date: '2007-11-10 18:00' },
      { id: 7, name: '名無し', content: 'キャッシュ消したら一部は解消したけどリンク集はまだだめ。', date: '2007-11-10 18:05' },
      { id: 8, name: 'ぐりむ', content: '報告ありがとうございます。再現手順つきの情報は非常に助かります。', date: '2007-11-10 18:09' },
      { id: 9, name: '名無し', content: '同じ現象出ました。ブラウザはChromeです。', date: '2007-11-10 18:14' },
      { id: 10, name: '名無し', content: 'とりあえず継続監視します。進展あればここに追記します。', date: '2007-11-10 18:20' },
    ],
  },
]

function cloneInitialThreads() {
  return JSON.parse(JSON.stringify(INITIAL_THREADS))
}

const LEGACY_THREAD_DATE_MAP = {
  '2026-02-29': '2008-02-29',
  '2026-02-28': '2008-02-26',
  '2026-02-27': '2008-02-25',
  '2026-02-26': '2008-02-24',
  '2026-02-25': '2007-11-15',
  '2026-02-24': '2007-11-12',
  '2026-02-23': '2007-11-11',
  '2026-02-22': '2007-11-10',
}

function migrateLegacyThreadDateValue(value) {
  const raw = String(value || '')
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})(.*)$/)
  if (!m) return raw
  const mapped = LEGACY_THREAD_DATE_MAP[m[1]]
  return mapped ? `${mapped}${m[2]}` : raw
}

function migrateLegacyThreads(threads) {
  if (!Array.isArray(threads)) return []
  return threads.map((thread) => {
    if (!thread || typeof thread !== 'object') return thread
    const posts = Array.isArray(thread.posts)
      ? thread.posts.map((post) => {
          if (!post || typeof post !== 'object') return post
          return {
            ...post,
            date: migrateLegacyThreadDateValue(post.date),
          }
        })
      : []
    return {
      ...thread,
      createdAt: migrateLegacyThreadDateValue(thread.createdAt),
      posts,
    }
  })
}

const BBSThreads = {
  threads: cloneInitialThreads(),

  /**
   * 特殊投稿の整合性を補正
   * - 997 の「管理人: 誰が彼女を閉じ込めたんでしょうか」を必ず最後に置く
   * - 旧データに残る 996 の同投稿は除去する
   */
  normalizeSpecialPosts() {
    const sourceThread = this.threads.find(t => t.id === 996)
    if (sourceThread) {
      sourceThread.posts = sourceThread.posts.filter(
        p => !(p.name === '管理人' && p.content === '誰が彼女を閉じ込めたんでしょうか')
      )
      sourceThread.posts = sourceThread.posts.map((p, idx) => ({
        ...p,
        id: idx + 1,
      }))
    }

    const targetThread = this.threads.find(t => t.id === 997)
    if (!targetThread) return

    const targetName = '管理人'
    const targetContent = '誰が彼女を閉じ込めたんでしょうか'
    const targetDate = '2008-02-25 23:09'

    const existingIdx = targetThread.posts.findIndex(
      p => p.name === targetName && p.content === targetContent
    )

    if (existingIdx >= 0) {
      // 既存なら最後へ移動
      const [post] = targetThread.posts.splice(existingIdx, 1)
      targetThread.posts.push(post)
    } else {
      // 無ければ追加
      targetThread.posts.push({
        id: 0,
        name: targetName,
        content: targetContent,
        date: targetDate,
      })
    }

    // id を連番に再採番
    targetThread.posts = targetThread.posts.map((p, idx) => ({
      ...p,
      id: idx + 1,
    }))
  },

  /**
   * sessionStorage からスレッド状態を読み込む
   */
  load() {
    const stored = sessionStorage.getItem('bbsThreads')
    if (!stored) {
      this.threads = cloneInitialThreads()
      this.normalizeSpecialPosts()
      return
    }

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        this.threads = migrateLegacyThreads(parsed)
        this.normalizeSpecialPosts()
        this.save()
      } else {
        this.threads = cloneInitialThreads()
        this.normalizeSpecialPosts()
      }
    } catch (error) {
      console.error('Failed to load bbs threads:', error)
      this.threads = cloneInitialThreads()
      this.normalizeSpecialPosts()
    }
  },

  /**
   * 現在のスレッド状態を sessionStorage に保存
   */
  save() {
    sessionStorage.setItem('bbsThreads', JSON.stringify(this.threads))
  },

  /**
   * 初期状態に戻す
   */
  resetToInitial() {
    this.threads = cloneInitialThreads()
    sessionStorage.removeItem('bbsThreads')
  },

  /**
   * 全削除（最終演出用）
   */
  clearAll() {
    this.threads = []
    sessionStorage.setItem('bbsThreads', JSON.stringify(this.threads))
  },

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
      name,
      content,
      date,
    })
    this.save()
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
    this.save()
    return newId
  },
}
