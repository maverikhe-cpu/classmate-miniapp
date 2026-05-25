const { formatPhotoDate, PHOTO_TAG_ICONS } = require('../../utils/photoTags')
const { formatRelativeTime } = require('../../utils/util')
const app = getApp()

Page({
  data: {
    photo: null,
    isUploader: false,
    isLiked: false,
    displayDate: '',
    tagList: [],
    commentText: '',
    showDateSheet: false,
    dateSuggestion: '',
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.photoId = options.id
      this.loadPhoto()
    }
  },

  onPullDownRefresh() {
    this.loadPhoto().then(() => wx.stopPullDownRefresh())
  },

  async loadPhoto() {
    try {
      const db = wx.cloud.database()
      const { data: photo } = await db.collection('classPhotos').doc(this.photoId).get()

      if (!photo) {
        wx.showToast({ title: '照片不存在', icon: 'none' })
        return
      }

      const openid = app.globalData.openid
      const displayDate = formatPhotoDate(photo)
      const tagList = (photo.tags || []).map(name => ({
        name, icon: PHOTO_TAG_ICONS[name] || '📷'
      }))

      const comments = (photo.comments || []).map(c => ({
        ...c,
        formattedTime: c.createdAt ? formatRelativeTime(new Date(c.createdAt)) : ''
      }))

      this.setData({
        photo,
        isUploader: photo._openid === openid,
        isLiked: (photo.likedBy || []).includes(openid),
        displayDate,
        tagList,
        comments
      })
    } catch (err) {
      console.error('loadPhoto error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  previewImage() {
    wx.previewImage({
      urls: [this.data.photo.fileID],
      current: this.data.photo.fileID
    })
  },

  async toggleLike() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'likeClassPhoto',
        data: { photoId: this.photoId }
      })
      if (res.result.success) {
        const newLiked = res.result.liked
        this.setData({
          isLiked: newLiked,
          'photo.likeCount': (this.data.photo.likeCount || 0) + (newLiked ? 1 : -1)
        })
      }
    } catch (err) {
      console.error('toggleLike error:', err)
    }
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  async submitComment() {
    const { commentText } = this.data
    if (!commentText.trim()) return

    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'addClassPhotoComment',
        data: { photoId: this.photoId, content: commentText }
      })
      if (res.result.success) {
        this.setData({ commentText: '' })
        this.loadPhoto()
      }
    } catch (err) {
      console.error('submitComment error:', err)
      wx.showToast({ title: '评论失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  showDateSuggestSheet() {
    this.setData({ showDateSheet: true, dateSuggestion: '' })
  },

  hideDateSheet() {
    this.setData({ showDateSheet: false })
  },

  onDateSuggestionInput(e) {
    this.setData({ dateSuggestion: e.detail.value })
  },

  async submitDateSuggestion() {
    const { dateSuggestion } = this.data
    if (!dateSuggestion.trim()) return

    try {
      const res = await wx.cloud.callFunction({
        name: 'suggestPhotoDate',
        data: { photoId: this.photoId, suggestion: dateSuggestion }
      })
      if (res.result.success) {
        this.setData({ showDateSheet: false })
        this.loadPhoto()
      }
    } catch (err) {
      console.error('submitDateSuggestion error:', err)
      wx.showToast({ title: '提交失败', icon: 'none' })
    }
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
