const { formatTimeShort, toLocalTime, getActivityStatus, STATUS_TEXT, STATUS_TAG_CLASS } = require('../../utils/util')
const { CATEGORY_ICONS } = require('../../utils/categories')

Component({
  properties: {
    activity: {
      type: Object,
      value: {}
    }
  },

  observers: {
    'activity': function (activity) {
      if (!activity || !activity.startTime) return

      const status = getActivityStatus(activity)
      const offset = activity.timezoneOffset != null ? activity.timezoneOffset : 8
      const startLocal = toLocalTime(new Date(activity.startTime), offset)
      const endLocal = toLocalTime(new Date(activity.endTime), offset)

      const categoryTags = (activity.categories || []).map(name => ({
        name,
        icon: CATEGORY_ICONS[name] || '📌'
      }))

      const sameDay = startLocal.getFullYear() === endLocal.getFullYear()
        && startLocal.getMonth() === endLocal.getMonth()
        && startLocal.getDate() === endLocal.getDate()

      const y = startLocal.getFullYear()
      const m = startLocal.getMonth() + 1
      const d = startLocal.getDate()
      const w = ['日', '一', '二', '三', '四', '五', '六'][startLocal.getDay()]
      const t1 = formatTimeShort(startLocal)
      const t2 = formatTimeShort(endLocal)

      let formattedDateTime
      if (sameDay) {
        formattedDateTime = `${y}年${m}月${d}日 周${w} ${t1} - ${t2}`
      } else {
        const ey = endLocal.getFullYear()
        const em = endLocal.getMonth() + 1
        const ed = endLocal.getDate()
        if (y === ey) {
          formattedDateTime = `${y}年${m}月${d}日 ${t1} - ${em}月${ed}日 ${t2}`
        } else {
          formattedDateTime = `${y}年${m}月${d}日 ${t1} - ${ey}年${em}月${ed}日 ${t2}`
        }
      }

      this.setData({
        statusText: STATUS_TEXT[status],
        statusTagClass: STATUS_TAG_CLASS[status],
        canQuickSignup: status === 'open',
        formattedDateTime,
        categoryTags
      })
    }
  },

  methods: {
    onTap() {
      const activity = this.properties.activity
      if (activity && activity._id) {
        wx.navigateTo({
          url: `/pages/activity-detail/activity-detail?id=${activity._id}`
        })
      }
    }
  }
})
