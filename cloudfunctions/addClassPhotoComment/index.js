const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { photoId, content } = event
  const openid = cloud.getWXContext().OPENID

  if (!photoId || !content || !content.trim()) return { success: false, error: '缺少参数' }

  try {
    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    const user = users[0]
    if (!user) return { success: false, error: '用户未注册' }

    const comment = {
      _id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      openid,
      name: user.nickName || '同学',
      avatarUrl: user.avatarUrl || '',
      content: content.trim(),
      createdAt: db.serverDate()
    }

    await db.collection('classPhotos').doc(photoId).update({
      data: {
        comments: _.push(comment),
        commentCount: _.inc(1),
        updatedAt: db.serverDate()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('addClassPhotoComment error:', err)
    return { success: false, error: err.message }
  }
}
