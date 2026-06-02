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
    editCityIndex: -1,
    showCityPicker: false,
    cityKeyword: '',
    cityFilteredList: []
  },

  onLoad() {
    this.setData({ countries: getAllCountries() })
    app.ensureOnboarded().then(ok => {
      if (ok) this.loadProfile()
    })
  },

  onShow() {
    if (!app.globalData.onboarded) return
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

        wx.showLoading({ title: '上传中' })
        try {
          const fs = wx.getFileSystemManager()
          const fileData = fs.readFileSync(tempPath, 'base64')

          const uploadRes = await wx.cloud.callFunction({
            name: 'updateAvatar',
            data: { fileData }
          })

          if (uploadRes.result && uploadRes.result.success) {
            this.setData({ 'userInfo.avatarUrl': uploadRes.result.avatarUrl })
            wx.hideLoading()
            wx.showToast({ title: '头像已更新', icon: 'success' })
          } else {
            wx.hideLoading()
            wx.showToast({ title: (uploadRes.result && uploadRes.result.error) || '上传失败', icon: 'none' })
          }
        } catch (err) {
          console.error('upload avatar error:', err)
          wx.hideLoading()
          wx.showModal({
            title: '上传失败',
            content: err.errMsg || err.message || String(err),
            showCancel: false
          })
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

  doNothing() {},

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

  openCityPicker() {
    if (!this.data.editCountry) return
    const allCities = getCitiesByCountry(this.data.editCountry)
    this.setData({ showCityPicker: true, cityKeyword: '', cityFilteredList: allCities })
  },

  closeCityPicker() {
    this.setData({ showCityPicker: false, cityKeyword: '' })
  },

  onCitySearchInput(e) {
    const keyword = e.detail.value.trim()
    const allCities = getCitiesByCountry(this.data.editCountry)
    const filtered = keyword
      ? allCities.filter(c => c.includes(keyword))
      : allCities
    this.setData({ cityKeyword: keyword, cityFilteredList: filtered })
  },

  onCitySelect(e) {
    this.setData({ editCity: e.currentTarget.dataset.city })
    this.closeCityPicker()
  },

  onCityCustom() {
    this.setData({ editCity: this.data.cityKeyword })
    this.closeCityPicker()
  },

  onEditCityChange(e) {
    this.setData({ editCity: e.detail.value })
  },

  async saveProfile() {
    const { editName, editBio, editCountry, editCity, editWechat, editEmail, editPhone, editAddress } = this.data

    if (!editName.trim()) {
      wx.showToast({ title: '姓名不能为空', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中', mask: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateProfile',
        data: {
          nickName: editName.trim(),
          bio: editBio.trim(),
          country: editCountry || '',
          city: editCity || '',
          wechat: editWechat.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim()
        }
      })

      wx.hideLoading()

      if (res.result && res.result.success) {
        const updateData = res.result.data
        this.setData({
          'userInfo.nickName': updateData.nickName,
          'userInfo.bio': updateData.bio,
          'userInfo.wechat': updateData.wechat,
          'userInfo.email': updateData.email,
          'userInfo.phone': updateData.phone,
          'userInfo.address': updateData.address,
          'userInfo.country': updateData.country,
          'userInfo.countryCode': updateData.countryCode,
          'userInfo.city': updateData.city,
          showEditModal: false
        })
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        wx.showModal({
          title: '保存失败',
          content: (res.result && res.result.error) || '未知错误',
          showCancel: false
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('saveProfile error:', err)
      wx.showModal({
        title: '保存失败',
        content: err.errMsg || err.message || String(err),
        showCancel: false
      })
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
