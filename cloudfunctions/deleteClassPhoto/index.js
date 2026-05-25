const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { photoId } = event
  const openid = cloud.getWXContext().OPENID

  if (!photoId) return { success: false, error: '缺少参数' }

  try {
    const { data: photo } = await db.collection('classPhotos').doc(photoId).get()
    if (!photo) return { success: false, error: '照片不存在' }
    if (photo._openid !== openid) return { success: false, error: '无权删除' }

    await db.collection('classPhotos').doc(photoId).remove()

    try { await cloud.deleteFile({ fileList: [photo.fileID] }) } catch (e) {
      console.error('deleteFile error:', e)
    }

    return { success: true }
  } catch (err) {
    console.error('deleteClassPhoto error:', err)
    return { success: false, error: err.message }
  }
}
