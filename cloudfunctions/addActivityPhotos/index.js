const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { activityId, fileIDs } = event

  if (!activityId || !fileIDs || !fileIDs.length) {
    return { success: false, error: '缺少必要参数' }
  }

  try {
    const { data: activity } = await db.collection('activities').doc(activityId).get()

    if (!activity) {
      return { success: false, error: '活动不存在' }
    }

    if (!activity.members || !activity.members.includes(openid)) {
      return { success: false, error: '只有参与者可以上传照片' }
    }

    const photos = fileIDs.map(fileID => ({
      fileID,
      uploader: openid,
      createdAt: db.serverDate()
    }))

    await db.collection('activities').doc(activityId).update({
      data: {
        photos: _.push(photos),
        updatedAt: db.serverDate()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('addActivityPhotos error:', err)
    return { success: false, error: err.message }
  }
}
