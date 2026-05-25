const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { photoId, suggestion } = event
  const openid = cloud.getWXContext().OPENID

  if (!photoId || !suggestion || !suggestion.trim()) return { success: false, error: '缺少参数' }

  try {
    const { data: users } = await db.collection('users').where({ _openid: openid }).get()
    const user = users[0]
    if (!user) return { success: false, error: '用户未注册' }

    await db.collection('classPhotos').doc(photoId).update({
      data: {
        dateSuggestions: _.push({
          openid,
          name: user.nickName || '同学',
          suggestion: suggestion.trim(),
          createdAt: db.serverDate()
        }),
        updatedAt: db.serverDate()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('suggestPhotoDate error:', err)
    return { success: false, error: err.message }
  }
}
