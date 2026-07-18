const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 设置活动封面：仅发起人，且只能从活动相册已有照片中选择
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

    if (activity._openid !== openid) {
      return { success: false, error: '只有发起人可以设置封面' }
    }

    const exists = (activity.photos || []).some(p => p.fileID === fileID)
    if (!exists) {
      return { success: false, error: '照片不在活动相册中' }
    }

    await db.collection('activities').doc(activityId).update({
      data: {
        coverImage: fileID,
        updatedAt: db.serverDate()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('setActivityCover error:', err)
    return { success: false, error: err.message }
  }
}
