const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { activityId } = event

  if (!activityId) {
    return { success: false, error: '缺少活动ID' }
  }

  try {
    const { data: activity } = await db.collection('activities').doc(activityId).get()

    if (!activity) {
      return { success: false, error: '活动不存在' }
    }

    if (activity.members.length > 0) {
      const { data: users } = await db.collection('users')
        .where({ _openid: db.command.in(activity.members) })
        .get()

      activity.memberDetails = users
    } else {
      activity.memberDetails = []
    }

    if (activity._openid) {
      const { data: creator } = await db.collection('users')
        .where({ _openid: activity._openid })
        .get()
      activity.creator = creator[0] || null
    }

    return { success: true, data: activity }
  } catch (err) {
    console.error('getActivityDetail error:', err)
    return { success: false, error: err.message }
  }
}
