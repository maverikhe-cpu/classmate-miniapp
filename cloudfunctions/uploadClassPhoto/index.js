const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { fileID, caption, tags, dateType, exactDate, year, season, era } = event

  if (!fileID) {
    return { success: false, error: '请选择照片' }
  }

  if (!caption || !caption.trim()) {
    return { success: false, error: '请填写备注' }
  }

  try {
    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get()

    const user = users[0]
    if (!user) {
      return { success: false, error: '用户未注册' }
    }

    const photo = {
      _openid: openid,
      fileID,
      caption: caption.trim(),
      tags: tags || [],
      dateType: dateType || 'unknown',
      exactDate: exactDate ? new Date(exactDate) : null,
      year: year || null,
      season: season || null,
      era: era || null,
      uploaderName: user.nickName || '同学',
      uploaderAvatar: user.avatarUrl || '',
      comments: [],
      commentCount: 0,
      likeCount: 0,
      likedBy: [],
      dateSuggestions: [],
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    const result = await db.collection('classPhotos').add({ data: photo })

    return { success: true, photoId: result._id }
  } catch (err) {
    console.error('uploadClassPhoto error:', err)
    return { success: false, error: err.message }
  }
}
