const { getAllCountries, getCitiesByCountry } = require('../../utils/locations')
const app = getApp()

Page({
  data: {
    step: 1,
    matchResult: null,
    inputName: '',
    errorMessage: '',
    countries: [],
    // editable fields
    editName: '',
    editBio: '',
    editCountry: '',
    editCountryIndex: -1,
    editCities: [],
    editCity: '',
    editCityIndex: -1,
    editWechat: '',
    editEmail: '',
    editPhone: '',
    editAddress: '',
    avatarUrl: '',
    submitting: false
  },

  onLoad() {
    this.setData({ countries: getAllCountries() })
  },

  onNameInput(e) {
    this.setData({ inputName: e.detail.value.trim(), errorMessage: '' })
  },

  async searchAndBind() {
    const name = this.data.inputName
    if (!name) {
      this.setData({ errorMessage: '请输入姓名' })
      return
    }

    wx.showLoading({ title: '验证中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getUnboundClassmates'
      })

      if (!res.result.success) {
        this.setData({ errorMessage: '查询失败，请重试' })
        return
      }

      const allClassmates = res.result.data
      const matches = allClassmates.filter(c => c.nickName === name)

      if (matches.length === 0) {
        this.setData({ errorMessage: '未找到该姓名，请确认你的姓名与通讯录一致' })
        return
      }

      const unbound = matches.filter(c => !c.bound)

      if (unbound.length === 0) {
        this.setData({ errorMessage: '该姓名已被认证，如非本人操作请联系管理员' })
        return
      }

      const selected = unbound[0]

      const countries = this.data.countries
      const countryIndex = selected.country ? countries.indexOf(selected.country) : -1
      const cities = countryIndex >= 0 ? getCitiesByCountry(selected.country) : []
      const cityIndex = selected.city ? cities.indexOf(selected.city) : -1

      this.setData({
        matchResult: selected,
        editName: selected.nickName,
        editBio: selected.bio || '',
        editCountry: selected.country || '',
        editCountryIndex: countryIndex,
        editCities: cities,
        editCity: selected.city || '',
        editCityIndex: cityIndex,
        editWechat: selected.wechat || '',
        editEmail: selected.email || '',
        editPhone: selected.phone || '',
        editAddress: selected.address || '',
        avatarUrl: selected.avatarUrl || '',
        errorMessage: '',
        step: 2
      })
    } catch (err) {
      console.error('searchAndBind error:', err)
      this.setData({ errorMessage: '网络错误，请重试' })
    } finally {
      wx.hideLoading()
    }
  },

  onChooseAvatar(e) {
    if (e.detail.avatarUrl) {
      this.setData({ avatarUrl: e.detail.avatarUrl })
    }
  },

  onEditBioInput(e) { this.setData({ editBio: e.detail.value }) },
  onEditWechatInput(e) { this.setData({ editWechat: e.detail.value }) },
  onEditEmailInput(e) { this.setData({ editEmail: e.detail.value }) },
  onEditPhoneInput(e) { this.setData({ editPhone: e.detail.value }) },
  onEditAddressInput(e) { this.setData({ editAddress: e.detail.value }) },

  onEditCountryChange(e) {
    const index = parseInt(e.detail.value)
    const country = this.data.countries[index]
    const cities = getCitiesByCountry(country)
    this.setData({ editCountry: country, editCountryIndex: index, editCities: cities, editCity: '', editCityIndex: -1 })
  },

  onEditCityChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({ editCity: this.data.editCities[index], editCityIndex: index })
  },

  goBack() {
    if (this.data.step === 2) {
      this.setData({ step: 1, matchResult: null })
    } else if (this.data.step === 3) {
      this.setData({ step: 2 })
    }
  },

  goToStep3() {
    const { editCountry } = this.data
    if (!editCountry) {
      wx.showToast({ title: '请选择所在地区', icon: 'none' })
      return
    }
    this.setData({ step: 3 })
  },

  async completeOnboarding() {
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const {
      matchResult, editName, editBio, editCountry, editCity,
      editWechat, editEmail, editPhone, editAddress, avatarUrl
    } = this.data

    try {
      let finalAvatarUrl = avatarUrl

      if (avatarUrl && !avatarUrl.startsWith('cloud://')) {
        const cloudPath = `avatars/${app.globalData.openid}_${Date.now()}.jpg`
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: avatarUrl })
        finalAvatarUrl = uploadRes.fileID
      }

      const res = await wx.cloud.callFunction({
        name: 'bindClassmate',
        data: {
          classmateId: matchResult._id,
          nickName: editName,
          bio: editBio.trim(),
          country: editCountry,
          city: editCity,
          avatarUrl: finalAvatarUrl,
          wechat: editWechat.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim()
        }
      })

      if (res.result.success) {
        app.markOnboarded(res.result.userInfo)
        wx.showToast({ title: '欢迎加入！', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1000)
      } else {
        wx.showToast({ title: res.result.error || '绑定失败', icon: 'none' })
      }
    } catch (err) {
      console.error('completeOnboarding error:', err)
      wx.showToast({ title: '绑定失败，请重试', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
