const { formatPhotoDate, PHOTO_TAG_ICONS } = require('../../utils/photoTags')

Page({
  data: {
    photo: null,
    isUploader: false,
    displayDate: '',
    tagList: []
  },

  onLoad(options) {
    if (options.id) {
      this.photoId = options.id
      const eventChannel = this.getOpenerEventChannel()
      if (eventChannel && eventChannel.on) {
        eventChannel.on('photoData', (photo) => {
          this.applyPhoto(photo)
        })
      } else {
        this.loadPhoto()
      }
    }
  },

  onPullDownRefresh() {
    this.loadPhoto().then(() => wx.stopPullDownRefresh())
  },

  applyPhoto(photo) {
    const displayDate = formatPhotoDate(photo)
    const tagList = (photo.tags || []).map(name => ({
      name, icon: PHOTO_TAG_ICONS[name] || '📷'
    }))

    const openid = getApp().globalData.openid
    this.setData({
      photo,
      isUploader: photo._openid === openid,
      displayDate,
      tagList
    })
  },

  async loadPhoto() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getPhotoDetail',
        data: { photoId: this.photoId }
      })

      if (!res.result || !res.result.success) {
        wx.showModal({
          title: '加载失败',
          content: (res.result && res.result.error) || '未知错误',
          showCancel: false
        })
        return
      }

      this.applyPhoto(res.result.data)
    } catch (err) {
      console.error('loadPhoto error:', err)
      wx.showModal({
        title: '调用失败',
        content: err.errMsg || err.message || String(err),
        showCancel: false
      })
    }
  },

  previewImage() {
    wx.previewImage({
      urls: [this.data.photo.fileID],
      current: this.data.photo.fileID
    })
  },

  async deletePhoto() {
    const confirmed = await new Promise(resolve => {
      wx.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定要删除吗？',
        success: res => resolve(res.confirm)
      })
    })
    if (!confirmed) return

    try {
      const res = await wx.cloud.callFunction({
        name: 'deleteClassPhoto',
        data: { photoId: this.photoId }
      })
      if (res.result.success) {
        const pages = getCurrentPages()
        const albumPage = pages.find(p => p.route === 'pages/album/album')
        if (albumPage) albumPage._needsRefresh = true

        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    } catch (err) {
      console.error('deletePhoto error:', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.photo?.caption || '同学回忆',
      path: `/pages/photo-detail/photo-detail?id=${this.photoId}`
    }
  }
})
