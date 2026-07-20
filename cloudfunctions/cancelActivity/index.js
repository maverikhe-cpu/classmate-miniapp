const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 取消活动：仅发起人。客户端无数据库写权限，必须走云函数
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { activityId } = event

  if (!activityId) {
    return { success: false, error: '缺少活动ID' }
  }

  try {
    const { data: activity } = await db.collection('activities').doc(activityId).get()

    if (!activity) {
      return { success: false, error: '活动不存在' }
    }

    if (activity._openid !== openid) {
      return { success: false, error: '只有发起人可以取消活动' }
    }

    if (activity.status === 'cancelled') {
      return { success: true }
    }

    await db.collection('activities').doc(activityId).update({
      data: {
        status: 'cancelled',
        updatedAt: db.serverDate()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('cancelActivity error:', err)
    return { success: false, error: err.message }
  }
}
