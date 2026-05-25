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
    actionLoading: false,
    photos: [],
    uploading: false
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
        creatorName: activity.creator?.nickName || '同学',
        photos: activity.photos || []
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

  async choosePhotos() {
    if (this.data.uploading) return

    try {
      const chooseRes = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 9,
          mediaType: ['image'],
          sizeType: ['compressed'],
          success: resolve,
          fail: reject
        })
      })

      if (!chooseRes.tempFiles || chooseRes.tempFiles.length === 0) return

      this.setData({ uploading: true })
      wx.showLoading({ title: '上传中' })

      const openid = app.globalData.openid
      const timestamp = Date.now()
      const fileIDs = []

      for (let i = 0; i < chooseRes.tempFiles.length; i++) {
        const tempPath = chooseRes.tempFiles[i].tempFilePath
        const ext = tempPath.split('.').pop() || 'jpg'
        const cloudPath = `activity-photos/${this.activityId}/${openid}_${timestamp}_${i}.${ext}`

        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath })
        fileIDs.push(uploadRes.fileID)
      }

      const addRes = await wx.cloud.callFunction({
        name: 'addActivityPhotos',
        data: { activityId: this.activityId, fileIDs }
      })

      if (addRes.result.success) {
        wx.showToast({ title: '上传成功', icon: 'success' })
        this.loadDetail()
      } else {
        wx.showToast({ title: addRes.result.error || '上传失败', icon: 'none' })
      }
    } catch (err) {
      if (err.errMsg && err.errMsg.includes('cancel')) return
      console.error('choosePhotos error:', err)
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      this.setData({ uploading: false })
      wx.hideLoading()
    }
  },

  previewPhoto(e) {
    const urls = this.data.photos.map(p => p.fileID)
    const current = e.currentTarget.dataset.url
    wx.previewImage({ urls, current })
  },

  async deletePhoto(e) {
    const { fileid, uploader } = e.currentTarget.dataset
    const openid = app.globalData.openid

    if (openid !== this.data.activity._openid && uploader !== openid) {
      wx.showToast({ title: '无权删除此照片', icon: 'none' })
      return
    }

    const confirmed = await new Promise(resolve => {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这张照片吗？',
        success: res => resolve(res.confirm)
      })
    })

    if (!confirmed) return

    try {
      const res = await wx.cloud.callFunction({
        name: 'deleteActivityPhoto',
        data: { activityId: this.activityId, fileID: fileid }
      })

      if (res.result.success) {
        wx.showToast({ title: '已删除', icon: 'success' })
        this.loadDetail()
      } else {
        wx.showToast({ title: res.result.error || '删除失败', icon: 'none' })
      }
    } catch (err) {
      console.error('deletePhoto error:', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  addToCalendar() {
    const activity = this.data.activity
    if (!activity) return

    const offset = activity.timezoneOffset != null ? activity.timezoneOffset : 8
    const startUtc = new Date(activity.startTime).getTime()
    const endUtc = new Date(activity.endTime).getTime()
    const offsetMs = offset * 3600000
    const startTs = startUtc + offsetMs
    const endTs = endUtc + offsetMs

    const locationParts = []
    if (activity.location) locationParts.push(activity.location)
    if (activity.city) locationParts.push(`${activity.country} · ${activity.city}`)

    wx.addPhoneCalendar({
      startTime: startTs,
      endTime: endTs,
      title: activity.title,
      location: locationParts.join(' '),
      description: activity.description || '',
      alarm: true,
      success() {
        wx.showToast({ title: '已加入日历', icon: 'success' })
      },
      fail(err) {
        if (err.errMsg && err.errMsg.includes('auth')) {
          wx.showModal({
            title: '需要授权',
            content: '请在设置中允许访问日历',
            confirmText: '去设置',
            success(res) {
              if (res.confirm) wx.openSetting()
            }
          })
        } else {
          wx.showToast({ title: '添加失败', icon: 'none' })
        }
      }
    })
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
