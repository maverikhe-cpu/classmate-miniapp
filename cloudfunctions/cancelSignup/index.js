const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
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

    if (!activity.members.includes(openid)) {
      return { success: false, error: '你还没有报名' }
    }

    if (activity._openid === openid) {
      return { success: false, error: '组织者不能取消报名，请取消活动' }
    }

    const updatedMembers = activity.members.filter(id => id !== openid)

    await db.collection('activities').doc(activityId).update({
      data: {
        members: updatedMembers,
        updatedAt: db.serverDate()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('cancelSignup error:', err)
    return { success: false, error: err.message }
  }
}
