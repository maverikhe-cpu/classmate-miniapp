App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      traceUser: true
    })

    this.globalData = {
      userInfo: null,
      openid: null,
      onboarded: null,
      _loginPromise: null
    }

    this._login()
  },

  _login() {
    if (this.globalData._loginPromise) {
      return this.globalData._loginPromise
    }

    this.globalData._loginPromise = wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const openid = res.result.openid
      this.globalData.openid = openid
      this.globalData.onboarded = res.result.onboarded

      if (res.result.userInfo) {
        this.globalData.userInfo = res.result.userInfo
      }

      return res.result
    })

    return this.globalData._loginPromise
  },

  getOpenId() {
    if (this.globalData.openid) {
      return Promise.resolve(this.globalData.openid)
    }
    return this._login().then(r => r.openid)
  },

  ensureOnboarded() {
    if (this.globalData.onboarded === true) {
      return Promise.resolve(true)
    }

    return this._login().then(result => {
      if (result.onboarded) {
        return true
      }

      return new Promise((resolve) => {
        wx.redirectTo({
          url: '/pages/onboarding/onboarding',
          complete: () => resolve(false)
        })
      })
    })
  },

  markOnboarded(userInfo) {
    this.globalData.onboarded = true
    this.globalData.userInfo = userInfo
  }
})
