const { formatPhotoDate, PHOTO_TAG_ICONS } = require('../../utils/photoTags')

Component({
  properties: {
    photo: {
      type: Object,
      value: {}
    }
  },

  observers: {
    'photo': function (photo) {
      if (!photo || !photo.fileID) return

      const displayDate = formatPhotoDate(photo)
      const tagList = (photo.tags || []).map(name => ({
        name,
        icon: PHOTO_TAG_ICONS[name] || '📷'
      }))

      this.setData({ displayDate, tagList })
    }
  },

  methods: {
    onTap() {
      const photo = this.properties.photo
      if (photo && photo._id) {
        wx.navigateTo({
          url: `/pages/photo-detail/photo-detail?id=${photo._id}`,
          events: {},
          success: (res) => {
            res.eventChannel.emit('photoData', photo)
          }
        })
      }
    }
  }
})
