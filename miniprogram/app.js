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
      openid: null
    }

    this.getOpenId()
  },

  getOpenId() {
    if (this.globalData.openid) {
      return Promise.resolve(this.globalData.openid)
    }

    return wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const openid = res.result.openid
      this.globalData.openid = openid

      if (res.result.onboarded === false) {
        wx.navigateTo({
          url: '/pages/onboarding/onboarding',
          success: () => {
            const pages = getCurrentPages()
            if (pages.length > 1) {
              wx.navigateBack({ delta: pages.length - 1 })
            }
          }
        })
      }

      return openid
    })
  },

  getUserInfo() {
    if (this.globalData.userInfo) {
      return Promise.resolve(this.globalData.userInfo)
    }

    return wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const userInfo = res.result.userInfo
      this.globalData.userInfo = userInfo

      if (res.result.onboarded === false) {
        wx.navigateTo({
          url: '/pages/onboarding/onboarding'
        })
      }

      return userInfo
    })
  }
})
