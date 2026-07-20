const { formatTime, formatDate, formatTimeShort, toLocalTime, getActivityStatus, STATUS_TEXT, STATUS_TAG_CLASS } = require('../../utils/util')
const app = getApp()

// 从微信错误对象中提取可读信息，如 "uploadFile:fail Error: socket hang up" → "socket hang up"
function errText(e) {
  const msg = (e && (e.errMsg || e.message)) || ''
  const m = /Error:\s*(.+)$/.exec(msg)
  return (m ? m[1] : msg).slice(0, 40) || '未知错误'
}

// 云函数调用带一次重试：函数超时时间仅 3 秒，冷启动容易超时被杀，
// 重试时容器已焐热通常能秒回
async function callFunctionWithRetry(name, data) {
  try {
    return await wx.cloud.callFunction({ name, data })
  } catch (err) {
    console.error(`callFunction ${name} error, retrying:`, err)
    await new Promise(resolve => setTimeout(resolve, 1500))
    return wx.cloud.callFunction({ name, data })
  }
}

Page({
  data: {
    activity: null,
    memberDetails: [],
    memberPreview: [],
    memberPreviewSize: 10,
    membersExpanded: false,
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

  async loadDetail(quiet) {
    if (!quiet) wx.showLoading({ title: '加载中' })

    try {
      const res = await callFunctionWithRetry('getActivityDetail', { activityId: this.activityId })

      const result = res.result

      if (!result.success) {
        if (!quiet) {
          wx.showToast({ title: result.error || '加载失败', icon: 'none' })
        }
        return
      }

      const activity = result.data
      const status = getActivityStatus(activity)
      const openid = app.globalData.openid
      const memberDetails = activity.memberDetails || []

      const offset = activity.timezoneOffset != null ? activity.timezoneOffset : 8
      const startTime = new Date(activity.startTime)
      const endTime = new Date(activity.endTime)
      const startLocal = toLocalTime(startTime, offset)
      const endLocal = toLocalTime(endTime, offset)

      this.setData({
        activity,
        memberDetails,
        memberPreview: memberDetails.slice(0, this.data.memberPreviewSize),
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
      // 静默模式（如上传后刷新）不打扰用户
      if (!quiet) {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    } finally {
      if (!quiet) wx.hideLoading()
    }
  },

  toggleMembers() {
    this.setData({ membersExpanded: !this.data.membersExpanded })
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

    let chooseRes
    try {
      chooseRes = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 9,
          mediaType: ['image'],
          sizeType: ['compressed'],
          success: resolve,
          fail: reject
        })
      })
    } catch (err) {
      // 用户取消选择，静默返回
      return
    }

    const tempFiles = chooseRes.tempFiles || []
    if (tempFiles.length === 0) return

    this.setData({ uploading: true })
    wx.showLoading({ title: `上传中 0/${tempFiles.length}` })

    const openid = app.globalData.openid
    const timestamp = Date.now()

    const uploadOne = async (file, index) => {
      const tempPath = file.tempFilePath
      const match = /\.([a-zA-Z0-9]+)$/.exec(tempPath)
      const ext = match ? match[1] : 'jpg'
      const cloudPath = `activity-photos/${this.activityId}/${openid}_${timestamp}_${index}.${ext}`
      const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath })
      return uploadRes.fileID
    }

    // 串行上传：部分网络环境（代理/VPN）下并发连接会被断开（socket hang up），
    // 串行最稳定；单张失败自动重试一次，不影响其他照片
    const results = new Array(tempFiles.length)
    for (let i = 0; i < tempFiles.length; i++) {
      wx.showLoading({ title: `上传中 ${i + 1}/${tempFiles.length}` })
      try {
        results[i] = { fileID: await uploadOne(tempFiles[i], i) }
      } catch (err) {
        console.error('upload photo error, retrying:', i, err)
        try {
          results[i] = { fileID: await uploadOne(tempFiles[i], i) }
        } catch (retryErr) {
          console.error('upload photo retry failed:', i, retryErr)
          results[i] = { error: retryErr }
        }
      }
    }

    const fileIDs = results.filter(r => r.fileID).map(r => r.fileID)
    const failCount = results.length - fileIDs.length
    const firstErr = results.find(r => r.error)
    const errHint = firstErr ? `：${errText(firstErr.error)}` : ''

    if (fileIDs.length > 0) {
      // 写库。注意：callFunction 客户端报错（超时/弱网）时，服务端往往已写入完成，
      // 因此无论成败都要刷新列表，以云端实际数据为准
      try {
        const addRes = await callFunctionWithRetry('addActivityPhotos', {
          activityId: this.activityId,
          fileIDs
        })

        if (!addRes.result.success) {
          wx.hideLoading()
          wx.showToast({ title: addRes.result.error || '上传失败', icon: 'none' })
          this.setData({ uploading: false })
          this.loadDetail(true)
          return
        }
      } catch (err) {
        console.error('addActivityPhotos error:', err)
        wx.hideLoading()
        wx.showToast({ title: '网络较慢，正在确认上传结果…', icon: 'none' })
        this.setData({ uploading: false })
        this.loadDetail(true)
        return
      }
    }

    if (fileIDs.length > 0) {
      // 乐观更新：先把刚上传的照片插到网格里，不必等整页重新加载
      const newPhotos = fileIDs.map(fileID => ({ fileID, uploader: openid }))
      this.setData({ photos: [...this.data.photos, ...newPhotos] })
    }

    wx.hideLoading()
    if (failCount === 0 && fileIDs.length > 0) {
      wx.showToast({ title: '上传成功', icon: 'success' })
    } else if (fileIDs.length > 0) {
      wx.showModal({
        title: '部分照片上传失败',
        content: `成功 ${fileIDs.length} 张，失败 ${failCount} 张${errHint}，可重新选择失败的照片再次上传`,
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      wx.showToast({ title: `上传失败，请重试${errHint}`, icon: 'none' })
    }

    if (fileIDs.length > 0) {
      this.loadDetail(true)
    }
    this.setData({ uploading: false })
  },

  previewPhoto(e) {
    const urls = this.data.photos.map(p => p.fileID)
    const current = e.currentTarget.dataset.url
    wx.previewImage({ urls, current })
  },

  onPhotoLongPress(e) {
    const { fileid, uploader } = e.currentTarget.dataset
    const openid = app.globalData.openid
    const canSetCover = this.data.isCreator
    const canDelete = this.data.isCreator || uploader === openid

    const itemList = []
    if (canSetCover) itemList.push('设为封面')
    if (canDelete) itemList.push('删除照片')

    if (itemList.length === 0) {
      wx.showToast({ title: '无权操作此照片', icon: 'none' })
      return
    }

    wx.showActionSheet({
      itemList,
      success: (res) => {
        const action = itemList[res.tapIndex]
        if (action === '设为封面') {
          this.setCover(fileid)
        } else if (action === '删除照片') {
          this.confirmDeletePhoto(fileid)
        }
      }
    })
  },

  async setCover(fileID) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'setActivityCover',
        data: { activityId: this.activityId, fileID }
      })

      if (res.result.success) {
        wx.showToast({ title: '已设为封面', icon: 'success' })
        this.loadDetail(true)
      } else {
        wx.showToast({ title: res.result.error || '设置失败', icon: 'none' })
      }
    } catch (err) {
      console.error('setCover error:', err)
      wx.showToast({ title: '设置失败', icon: 'none' })
    }
  },

  async confirmDeletePhoto(fileid) {
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

    const startTs = Math.floor(new Date(activity.startTime).getTime() / 1000)
    const endTs = Math.floor(new Date(activity.endTime).getTime() / 1000)

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
    if (!activity) {
      return {
        title: '同学圈',
        path: '/pages/index/index',
        imageUrl: '/images/share-default.png'
      }
    }
    const photos = activity.photos || []
    // 分享卡片图优先级：封面图 → 相册首张照片 → 默认图
    const imageUrl = activity.coverImage
      || (photos.length > 0 ? photos[0].fileID : '')
      || '/images/share-default.png'
    return {
      title: `${activity.title} — 同学圈`,
      path: `/pages/activity-detail/activity-detail?id=${this.activityId}`,
      imageUrl
    }
  }
})
