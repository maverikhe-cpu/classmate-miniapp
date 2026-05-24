const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const {
    title,
    description,
    location,
    country,
    countryCode,
    city,
    timezoneOffset,
    startTime,
    endTime,
    signupDeadline,
    maxMembers,
    coverImage
  } = event

  if (!title || !startTime || !endTime) {
    return { success: false, error: '缺少必填字段' }
  }

  if (!country || !city) {
    return { success: false, error: '请选择活动地区' }
  }

  if (new Date(startTime) >= new Date(endTime)) {
    return { success: false, error: '结束时间必须晚于开始时间' }
  }

  const activity = {
    _openid: openid,
    title,
    description: description || '',
    location: location || '',
    country,
    countryCode,
    city,
    timezoneOffset: timezoneOffset || 0,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    signupDeadline: signupDeadline ? new Date(signupDeadline) : null,
    maxMembers: maxMembers || 0,
    members: [openid],
    coverImage: coverImage || '',
    status: 'open',
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  }

  try {
    const result = await db.collection('activities').add({ data: activity })
    return { success: true, activityId: result._id }
  } catch (err) {
    console.error('createActivity error:', err)
    return { success: false, error: err.message }
  }
}
