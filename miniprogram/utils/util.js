/**
 * 将 UTC Date 转换为指定时区的本地时间（模拟 Date 接口）
 */
const toLocalTime = (utcDate, offsetHours) => {
  const localMs = utcDate.getTime() + offsetHours * 3600000
  const d = new Date(localMs)
  return {
    getFullYear() { return d.getUTCFullYear() },
    getMonth() { return d.getUTCMonth() },
    getDate() { return d.getUTCDate() },
    getDay() { return d.getUTCDay() },
    getHours() { return d.getUTCHours() },
    getMinutes() { return d.getUTCMinutes() }
  }
}

/**
 * 格式化时间为可读字符串
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return `${year}年${month}月${day}日 ${padZero(hour)}:${padZero(minute)}`
}

const formatDate = date => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]

  return `${month}月${day}日 周${weekDay}`
}

const formatTimeShort = date => {
  const hour = date.getHours()
  const minute = date.getMinutes()
  return `${padZero(hour)}:${padZero(minute)}`
}

const padZero = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 格式化相对时间
 */
const formatRelativeTime = date => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return formatDate(date)
}

/**
 * 判断活动状态
 */
const getActivityStatus = activity => {
  const now = new Date()

  if (activity.status === 'cancelled') return 'cancelled'

  const startTime = new Date(activity.startTime)
  const endTime = new Date(activity.endTime)

  if (now > endTime) return 'ended'
  if (now >= startTime && now <= endTime) return 'ongoing'

  const deadline = activity.signupDeadline
    ? new Date(activity.signupDeadline)
    : startTime

  if (activity.maxMembers && activity.members.length >= activity.maxMembers) {
    return 'full'
  }

  if (now > deadline) return 'deadline_passed'

  return 'open'
}

const STATUS_TEXT = {
  open: '报名中',
  ongoing: '进行中',
  full: '已满员',
  ended: '已结束',
  cancelled: '已取消',
  deadline_passed: '报名截止'
}

const STATUS_TAG_CLASS = {
  open: 'tag-open',
  ongoing: 'tag-ongoing',
  full: 'tag-full',
  ended: 'tag-ended',
  cancelled: 'tag-cancelled',
  deadline_passed: 'tag-deadline'
}

module.exports = {
  toLocalTime,
  formatTime,
  formatDate,
  formatTimeShort,
  formatRelativeTime,
  getActivityStatus,
  STATUS_TEXT,
  STATUS_TAG_CLASS
}
