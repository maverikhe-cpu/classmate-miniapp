const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { activityId, fileID } = event

  if (!activityId || !fileID) {
    return { success: false, error: '缺少必要参数' }
  }

  try {
    const { data: activity } = await db.collection('activities').doc(activityId).get()

    if (!activity) {
      return { success: false, error: '活动不存在' }
    }

    const photo = (activity.photos || []).find(p => p.fileID === fileID)

    if (!photo) {
      return { success: false, error: '照片不存在' }
    }

    if (activity._openid !== openid && photo.uploader !== openid) {
      return { success: false, error: '无权删除此照片' }
    }

    const remainingPhotos = (activity.photos || []).filter(p => p.fileID !== fileID)

    await db.collection('activities').doc(activityId).update({
      data: {
        photos: remainingPhotos,
        updatedAt: db.serverDate()
      }
    })

    try {
      await cloud.deleteFile({ fileList: [fileID] })
    } catch (deleteErr) {
      console.error('deleteFile error:', deleteErr)
    }

    return { success: true }
  } catch (err) {
    console.error('deleteActivityPhoto error:', err)
    return { success: false, error: err.message }
  }
}
