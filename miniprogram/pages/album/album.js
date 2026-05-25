const { PHOTO_TAGS } = require('../../utils/photoTags')
const app = getApp()

Page({
  data: {
    photos: [],
    keyword: '',
    selectedTag: '',
    tagList: PHOTO_TAGS,
    page: 0,
    hasMore: true,
    loading: false
  },

  onLoad() {
    app.ensureOnboarded().then(ok => {
      if (ok) this.loadPhotos()
    })
  },

  onShow() {
    if (!app.globalData.onboarded) return
    if (this._needsRefresh) {
      this._needsRefresh = false
      this.refresh()
    }
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPhotos()
    }
  },

  async refresh() {
    this.setData({ page: 0, hasMore: true, photos: [] })
    await this.loadPhotos()
  },

  async loadPhotos() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'classPhotos',
        data: {
          page: this.data.page,
          pageSize: 20,
          tag: this.data.selectedTag || undefined,
          keyword: this.data.keyword || undefined
        }
      })

      if (!res.result.success) {
        wx.showToast({ title: '加载失败', icon: 'none' })
        return
      }

      const newPhotos = res.result.data
      const photos = this.data.page === 0 ? newPhotos : [...this.data.photos, ...newPhotos]

      this.setData({
        photos,
        hasMore: res.result.hasMore,
        page: this.data.page + 1
      })
    } catch (err) {
      console.error('loadPhotos error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value.trim() })
    this.refresh()
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTag = this.data.selectedTag === tag ? '' : tag
    this.setData({ selectedTag })
    this.refresh()
  },

  goUpload() {
    this._needsRefresh = true
    wx.navigateTo({
      url: '/pages/upload-photo/upload-photo'
    })
  }
})
