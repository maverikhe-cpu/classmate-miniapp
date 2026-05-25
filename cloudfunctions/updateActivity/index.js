const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { activityId, title, description, location, country, countryCode, city, timezoneOffset, categories, startTime, endTime, signupDeadline, maxMembers } = event

  if (!activityId) {
    return { success: false, error: '缺少活动ID' }
  }

  if (!title || !startTime || !endTime) {
    return { success: false, error: '缺少必填字段' }
  }

  if (!country || !city) {
    return { success: false, error: '请选择活动地区' }
  }

  if (new Date(startTime) >= new Date(endTime)) {
    return { success: false, error: '结束时间必须晚于开始时间' }
  }

  try {
    const { data: activity } = await db.collection('activities').doc(activityId).get()

    if (!activity) {
      return { success: false, error: '活动不存在' }
    }

    if (activity._openid !== openid) {
      return { success: false, error: '只有发起人可以编辑' }
    }

    await db.collection('activities').doc(activityId).update({
      data: {
        title,
        description: description || '',
        location: location || '',
        country,
        countryCode,
        city,
        timezoneOffset: timezoneOffset || 0,
        categories: categories || [],
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        signupDeadline: signupDeadline ? new Date(signupDeadline) : null,
        maxMembers: maxMembers || 0,
        updatedAt: db.serverDate()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('updateActivity error:', err)
    return { success: false, error: err.message }
  }
}
