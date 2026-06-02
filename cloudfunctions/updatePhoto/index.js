const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { photoId, caption, tags, dateType, month, day, year, season, era } = event

  if (!photoId) {
    return { success: false, error: '缺少照片ID' }
  }

  if (!caption || !caption.trim()) {
    return { success: false, error: '请填写备注' }
  }

  try {
    const { data: photo } = await db.collection('classPhotos').doc(photoId).get()

    if (!photo) {
      return { success: false, error: '照片不存在' }
    }

    if (photo._openid !== openid) {
      return { success: false, error: '只能编辑自己上传的照片' }
    }

    const updateData = {
      caption: caption.trim(),
      tags: tags || [],
      dateType: dateType || 'unknown',
      year: year || null,
      month: month || null,
      day: day || null,
      season: season || null,
      era: era || null,
      updatedAt: db.serverDate()
    }

    await db.collection('classPhotos').doc(photoId).update({ data: updateData })

    return { success: true }
  } catch (err) {
    console.error('updatePhoto error:', err)
    return { success: false, error: err.message }
  }
}
