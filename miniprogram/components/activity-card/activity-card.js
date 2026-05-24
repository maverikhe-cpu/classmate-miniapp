const { formatDate, formatTimeShort, toLocalTime, getActivityStatus, STATUS_TEXT, STATUS_TAG_CLASS } = require('../../utils/util')

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

      this.setData({
        statusText: STATUS_TEXT[status],
        statusTagClass: STATUS_TAG_CLASS[status],
        canQuickSignup: status === 'open',
        formattedDate: formatDate(startLocal),
        formattedTime: `${formatTimeShort(startLocal)} - ${formatTimeShort(endLocal)}`
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
