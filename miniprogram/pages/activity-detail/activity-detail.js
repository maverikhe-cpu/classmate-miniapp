const { formatTime, formatDate, formatTimeShort, toLocalTime, getActivityStatus, STATUS_TEXT, STATUS_TAG_CLASS } = require('../../utils/util')
const app = getApp()

Page({
  data: {
    activity: null,
    memberDetails: [],
    isCreator: false,
    hasJoined: false,
    canSignup: false,
    statusText: '',
    statusTagClass: '',
    formattedDate: '',
    formattedTimeRange: '',
    formattedDeadline: '',
    creatorName: '',
    actionLoading: false
  },

  onLoad(options) {
    this._firstLoad = true
    if (options.id) {
      this.activityId = options.id
      this.loadDetail()
    }
  },

  onPullDownRefresh() {
    this.loadDetail().then(() => wx.stopPullDownRefresh())
  },

  async loadDetail() {
    wx.showLoading({ title: '加载中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityDetail',
        data: { activityId: this.activityId }
      })

      const result = res.result

      if (!result.success) {
        wx.showToast({ title: result.error || '加载失败', icon: 'none' })
        return
      }

      const activity = result.data
      const status = getActivityStatus(activity)
      const openid = app.globalData.openid

      const offset = activity.timezoneOffset != null ? activity.timezoneOffset : 8
      const startTime = new Date(activity.startTime)
      const endTime = new Date(activity.endTime)
      const startLocal = toLocalTime(startTime, offset)
      const endLocal = toLocalTime(endTime, offset)

      this.setData({
        activity,
        memberDetails: activity.memberDetails || [],
        isCreator: activity._openid === openid,
        hasJoined: activity.members.includes(openid),
        canSignup: status === 'open' || status === 'ongoing',
        statusText: STATUS_TEXT[status],
        statusTagClass: STATUS_TAG_CLASS[status],
        formattedDate: formatDate(startLocal),
        formattedTimeRange: `${formatTimeShort(startLocal)} - ${formatTimeShort(endLocal)}`,
        formattedDeadline: activity.signupDeadline ? formatTime(toLocalTime(new Date(activity.signupDeadline), offset)) : '',
        creatorName: activity.creator?.nickName || '同学'
      })
    } catch (err) {
      console.error('loadDetail error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async signup() {
    this.setData({ actionLoading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'signupActivity',
        data: { activityId: this.activityId }
      })

      if (res.result.success) {
        wx.showToast({ title: '报名成功', icon: 'success' })
        this.loadDetail()
      } else {
        wx.showToast({ title: res.result.error || '报名失败', icon: 'none' })
      }
    } catch (err) {
      console.error('signup error:', err)
      wx.showToast({ title: '报名失败', icon: 'none' })
    } finally {
      this.setData({ actionLoading: false })
    }
  },

  async cancelSignup() {
    const confirmed = await new Promise(resolve => {
      wx.showModal({
        title: '确认取消',
        content: '确定要取消报名吗？',
        success: res => resolve(res.confirm)
      })
    })

    if (!confirmed) return

    this.setData({ actionLoading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'cancelSignup',
        data: { activityId: this.activityId }
      })

      if (res.result.success) {
        wx.showToast({ title: '已取消报名', icon: 'success' })
        this.loadDetail()
      } else {
        wx.showToast({ title: res.result.error || '取消失败', icon: 'none' })
      }
    } catch (err) {
      console.error('cancelSignup error:', err)
      wx.showToast({ title: '取消失败', icon: 'none' })
    } finally {
      this.setData({ actionLoading: false })
    }
  },

  async cancelActivity() {
    const confirmed = await new Promise(resolve => {
      wx.showModal({
        title: '确认取消',
        content: '确定要取消这个活动吗？取消后所有报名将失效。',
        success: res => resolve(res.confirm)
      })
    })

    if (!confirmed) return

    this.setData({ actionLoading: true })
    try {
      await wx.cloud.database().collection('activities').doc(this.activityId).update({
        data: { status: 'cancelled' }
      })

      wx.showToast({ title: '活动已取消', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      console.error('cancelActivity error:', err)
      wx.showToast({ title: '取消失败', icon: 'none' })
    } finally {
      this.setData({ actionLoading: false })
    }
  },

  goEdit() {
    wx.navigateTo({
      url: `/pages/edit-activity/edit-activity?id=${this.activityId}`
    })
  },

  onShow() {
    if (this._firstLoad) {
      this._firstLoad = false
      return
    }
    if (this.activityId) {
      this.loadDetail()
    }
  },

  onShareAppMessage() {
    const activity = this.data.activity
    return {
      title: `${activity.title} — 同学圈`,
      path: `/pages/activity-detail/activity-detail?id=${this.activityId}`,
      imageUrl: activity.coverImage || ''
    }
  }
})
