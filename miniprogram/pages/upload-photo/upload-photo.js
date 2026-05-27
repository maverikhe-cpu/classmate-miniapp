const { PHOTO_TAGS } = require('../../utils/photoTags')
const app = getApp()

Page({
  data: {
    tempPath: '',
    caption: '',
    tagItems: PHOTO_TAGS.map(name => ({ name, active: false })),
    selectedTags: [],
    dateValue: { dateType: 'unknown' },
    uploading: false
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['original', 'compressed'],
      success: (res) => {
        this.setData({ tempPath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  onCaptionInput(e) {
    this.setData({ caption: e.detail.value })
  },

  toggleTag(e) {
    const idx = e.currentTarget.dataset.index
    const item = this.data.tagItems[idx]
    const newItems = [...this.data.tagItems]
    newItems[idx] = { name: item.name, active: !item.active }
    const selectedTags = newItems.filter(t => t.active).map(t => t.name)
    this.setData({ tagItems: newItems, selectedTags })
  },

  onDateChange(e) {
    this.setData({ dateValue: e.detail.value })
  },

  async submit() {
    const { tempPath, caption, selectedTags, dateValue } = this.data

    if (!tempPath) {
      wx.showToast({ title: '请选择照片', icon: 'none' })
      return
    }
    if (!caption.trim()) {
      wx.showToast({ title: '请填写备注', icon: 'none' })
      return
    }

    this.setData({ uploading: true })
    wx.showLoading({ title: '上传中', mask: true })

    try {
      const openid = await app.getOpenId()
      if (!openid) {
        wx.hideLoading()
        wx.showModal({ title: '调试', content: 'openid 为空，请退出重试', showCancel: false })
        return
      }

      const ext = tempPath.split('.').pop() || 'jpg'
      const cloudPath = `class-photos/${openid}_${Date.now()}.${ext}`

      let uploadRes
      try {
        uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempPath })
      } catch (uploadErr) {
        wx.hideLoading()
        wx.showModal({ title: '文件上传失败', content: String(uploadErr.errMsg || uploadErr.message || uploadErr), showCancel: false })
        return
      }

      const submitData = {
        fileID: uploadRes.fileID,
        caption: caption.trim(),
        tags: selectedTags,
        dateType: dateValue.dateType,
        year: dateValue.year || null,
        season: dateValue.season || null,
        era: dateValue.era || null
      }

      let res
      try {
        res = await wx.cloud.callFunction({
          name: 'uploadClassPhoto',
          data: submitData
        })
      } catch (fnErr) {
        wx.hideLoading()
        wx.showModal({ title: '云函数调用失败', content: String(fnErr.errMsg || fnErr.message || fnErr), showCancel: false })
        return
      }

      wx.hideLoading()

      if (res.result && res.result.success) {
        wx.showToast({ title: '上传成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        const errMsg = (res.result && res.result.error) || '上传失败'
        wx.showModal({ title: '上传失败', content: errMsg, showCancel: false })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showModal({ title: '异常', content: String(err.errMsg || err.message || err), showCancel: false })
    } finally {
      this.setData({ uploading: false })
    }
  }
})
