const { formatDate, getActivityStatus, STATUS_TEXT, STATUS_TAG_CLASS } = require('../../utils/util')
const { getAllCountries, getCitiesByCountry, getCountryCode } = require('../../utils/locations')
const app = getApp()

Page({
  data: {
    userInfo: {},
    myActivities: [],
    createdCount: 0,
    showEditModal: false,
    editName: '',
    editBio: '',
    editWechat: '',
    editEmail: '',
    editPhone: '',
    editAddress: '',
    countries: [],
    editCountry: '',
    editCountryIndex: -1,
    editCities: [],
    editCity: '',
    editCityIndex: -1
  },

  onLoad() {
    this.setData({ countries: getAllCountries() })
    this.loadProfile()
  },

  onShow() {
    this.loadProfile()
  },

  async loadProfile() {
    try {
      const userRes = await wx.cloud.callFunction({ name: 'login' })
      if (userRes.result.userInfo) {
        this.setData({ userInfo: userRes.result.userInfo })
        app.globalData.userInfo = userRes.result.userInfo
      }

      const openid = app.globalData.openid || userRes.result.openid
      const db = wx.cloud.database()

      const { data: activities } = await db.collection('activities')
        .where({ members: openid })
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()

      const myActivities = activities.map(a => {
        const status = getActivityStatus(a)
        return {
          _id: a._id,
          title: a.title,
          statusText: STATUS_TEXT[status],
          statusTagClass: STATUS_TAG_CLASS[status],
          formattedDate: formatDate(new Date(a.startTime))
        }
      })

      const { total: createdCount } = await db.collection('activities')
        .where({ _openid: openid })
        .count()

      this.setData({ myActivities, createdCount })
    } catch (err) {
      console.error('loadProfile error:', err)
    }
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        const cloudPath = `avatars/${app.globalData.openid}_${Date.now()}.jpg`

        wx.showLoading({ title: '上传中' })
        try {
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempPath
          })

          const db = wx.cloud.database()
          const { data: user } = await db.collection('users')
            .where({ _openid: app.globalData.openid })
            .get()

          if (user.length > 0) {
            await db.collection('users').doc(user[0]._id).update({
              data: { avatarUrl: uploadRes.fileID }
            })
          }

          this.setData({ 'userInfo.avatarUrl': uploadRes.fileID })
          wx.hideLoading()
        } catch (err) {
          console.error('upload avatar error:', err)
          wx.hideLoading()
          wx.showToast({ title: '上传失败', icon: 'none' })
        }
      }
    })
  },

  editProfile() {
    const { country, city } = this.data.userInfo
    let editCountry = country || ''
    let editCountryIndex = -1
    let editCities = []
    let editCity = city || ''
    let editCityIndex = -1

    if (country) {
      const countries = this.data.countries
      editCountryIndex = countries.indexOf(country)
      if (editCountryIndex >= 0) {
        editCities = getCitiesByCountry(country)
      }
    }

    if (city && editCities.length > 0) {
      editCityIndex = editCities.indexOf(city)
    }

    this.setData({
      showEditModal: true,
      editName: this.data.userInfo.nickName || '',
      editBio: this.data.userInfo.bio || '',
      editWechat: this.data.userInfo.wechat || '',
      editEmail: this.data.userInfo.email || '',
      editPhone: this.data.userInfo.phone || '',
      editAddress: this.data.userInfo.address || '',
      editCountry,
      editCountryIndex,
      editCities,
      editCity,
      editCityIndex
    })
  },

  closeEditModal() {
    this.setData({ showEditModal: false })
  },

  preventMove() {
    return
  },

  onEditNameInput(e) {
    this.setData({ editName: e.detail.value })
  },

  onEditBioInput(e) {
    this.setData({ editBio: e.detail.value })
  },

  onEditWechatInput(e) {
    this.setData({ editWechat: e.detail.value })
  },

  onEditEmailInput(e) {
    this.setData({ editEmail: e.detail.value })
  },

  onEditPhoneInput(e) {
    this.setData({ editPhone: e.detail.value })
  },

  onEditAddressInput(e) {
    this.setData({ editAddress: e.detail.value })
  },

  onEditCountryChange(e) {
    const index = parseInt(e.detail.value)
    const country = this.data.countries[index]
    const cities = getCitiesByCountry(country)

    this.setData({
      editCountry: country,
      editCountryIndex: index,
      editCities: cities,
      editCity: '',
      editCityIndex: -1
    })
  },

  onEditCityChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      editCity: this.data.editCities[index],
      editCityIndex: index
    })
  },

  async saveProfile() {
    const { editName, editBio, editCountry, editCity, editWechat, editEmail, editPhone, editAddress } = this.data

    if (!editName.trim()) {
      wx.showToast({ title: '姓名不能为空', icon: 'none' })
      return
    }

    try {
      const db = wx.cloud.database()
      const { data: user } = await db.collection('users')
        .where({ _openid: app.globalData.openid })
        .get()

      if (user.length > 0) {
        const updateData = {
          nickName: editName.trim(),
          bio: editBio.trim(),
          wechat: editWechat.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim(),
          updatedAt: db.serverDate()
        }

        if (editCountry) {
          updateData.country = editCountry
          updateData.countryCode = getCountryCode(editCountry)
        }
        if (editCity) {
          updateData.city = editCity
        }

        await db.collection('users').doc(user[0]._id).update({
          data: updateData
        })

        this.setData({
          'userInfo.nickName': updateData.nickName,
          'userInfo.bio': updateData.bio,
          'userInfo.wechat': updateData.wechat,
          'userInfo.email': updateData.email,
          'userInfo.phone': updateData.phone,
          'userInfo.address': updateData.address,
          'userInfo.country': updateData.country || this.data.userInfo.country,
          'userInfo.countryCode': updateData.countryCode || this.data.userInfo.countryCode,
          'userInfo.city': updateData.city || this.data.userInfo.city,
          showEditModal: false
        })

        wx.showToast({ title: '保存成功', icon: 'success' })
      }
    } catch (err) {
      console.error('saveProfile error:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`
    })
  },

  goMyActivities() {
    wx.navigateTo({
      url: '/pages/index/index'
    })
  }
})
