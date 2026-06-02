const { PHOTO_TAGS } = require('../../utils/photoTags')

Page({
  data: {
    photo: null,
    photoId: '',
    caption: '',
    tagItems: PHOTO_TAGS.map(name => ({ name, active: false })),
    dateValue: { dateType: 'unknown' },
    saving: false
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ photoId: options.id })

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel && eventChannel.on) {
      eventChannel.on('photoData', (photo) => {
        this.populateForm(photo)
      })
    } else {
      this.loadPhoto()
    }
  },

  populateForm(photo) {
    const tagItems = PHOTO_TAGS.map(name => ({
      name,
      active: (photo.tags || []).includes(name)
    }))

    const dateValue = {
      dateType: photo.dateType || 'unknown',
      year: photo.year || null,
      month: photo.month || null,
      day: photo.day || null,
      season: photo.season || null,
      era: photo.era || null
    }

    this.setData({
      photo,
      caption: photo.caption || '',
      tagItems,
      dateValue
    })
  },

  async loadPhoto() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getPhotoDetail',
        data: { photoId: this.data.photoId }
      })
      if (res.result && res.result.success) {
        this.populateForm(res.result.data)
      }
    } catch (err) {
      console.error('loadPhoto error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onCaptionInput(e) {
    this.setData({ caption: e.detail.value })
  },

  toggleTag(e) {
    const idx = e.currentTarget.dataset.index
    const item = this.data.tagItems[idx]
    const newItems = [...this.data.tagItems]
    newItems[idx] = { name: item.name, active: !item.active }
    this.setData({ tagItems: newItems })
  },

  onDateChange(e) {
    this.setData({ dateValue: e.detail.value })
  },

  async save() {
    const { caption, tagItems, dateValue, photoId } = this.data

    if (!caption.trim()) {
      wx.showToast({ title: '请填写备注', icon: 'none' })
      return
    }

    const selectedTags = tagItems.filter(t => t.active).map(t => t.name)

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中', mask: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'updatePhoto',
        data: {
          photoId,
          caption: caption.trim(),
          tags: selectedTags,
          dateType: dateValue.dateType,
          year: dateValue.year || null,
          month: dateValue.month || null,
          day: dateValue.day || null,
          season: dateValue.season || null,
          era: dateValue.era || null
        }
      })

      wx.hideLoading()

      if (res.result && res.result.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showModal({
          title: '保存失败',
          content: (res.result && res.result.error) || '未知错误',
          showCancel: false
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('save error:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
