const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

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

    if (activity.status === 'cancelled') {
      return { success: false, error: '活动已取消' }
    }

    if (activity.members.includes(openid)) {
      return { success: false, error: '你已经报名了' }
    }

    if (activity.maxMembers > 0 && activity.members.length >= activity.maxMembers) {
      return { success: false, error: '活动已满员' }
    }

    const deadline = activity.signupDeadline || activity.startTime
    if (new Date() > new Date(deadline)) {
      return { success: false, error: '报名已截止' }
    }

    await db.collection('activities').doc(activityId).update({
      data: {
        members: _.push(openid),
        updatedAt: db.serverDate()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('signupActivity error:', err)
    return { success: false, error: err.message }
  }
}
