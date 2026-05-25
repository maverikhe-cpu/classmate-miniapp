const { getCityCoord } = require('../../utils/cityCoords')
const app = getApp()

Page({
  data: {
    keyword: '',
    total: 0,
    allUsers: [],
    filteredUsers: [],
    groupedUsers: [],
    cityDistribution: [],
    countryDistribution: [],
    selectedCity: '',
    selectedCountry: '',
    selectedGroup: 0,
    groupMode: false,
    selectedUser: null,
    showUserModal: false,
    showMap: true,
    drawerExpanded: false,
    mapCenter: { lat: 30, lng: 110 },
    mapScale: 4,
    markers: [],
    touchStartY: 0
  },

  onLoad() {
    app.ensureOnboarded().then(ok => {
      if (ok) this.loadContacts()
    })
  },

  onShow() {
    if (!app.globalData.onboarded) return
    if (this.data.allUsers.length > 0) return
    this.loadContacts()
  },

  onPullDownRefresh() {
    this.loadContacts().then(() => wx.stopPullDownRefresh())
  },

  async loadContacts() {
    wx.showLoading({ title: '加载中' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getContacts'
      })

      const result = res.result

      if (!result.success) {
        wx.showToast({ title: '加载失败', icon: 'none' })
        return
      }

      const { users, cityDistribution, countryDistribution, total } = result.data

      const markers = this.buildMarkers(cityDistribution)

      const groupCounts = {}
      users.forEach(u => {
        if (u.group) {
          groupCounts[u.group] = (groupCounts[u.group] || 0) + 1
        }
      })

      this.setData({
        allUsers: users,
        groupCounts,
        filteredUsers: users,
        cityDistribution,
        countryDistribution,
        total,
        markers,
        groupedUsers: this.groupByCountry(users)
      })

      this.applyFilters()
    } catch (err) {
      console.error('loadContacts error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  buildMarkers(cityDistribution) {
    return cityDistribution
      .filter(c => getCityCoord(c.city))
      .map((c, index) => {
        const coord = getCityCoord(c.city)
        return {
          id: index,
          latitude: coord.lat,
          longitude: coord.lng,
          title: c.city,
          iconPath: '/images/marker.png',
          width: 24,
          height: 24,
          label: {
            content: `${c.count}`,
            color: '#ffffff',
            fontSize: 10,
            anchorX: -String(c.count).length * 3,
            anchorY: -22,
            bgColor: '#4F46E5',
            borderRadius: 10,
            padding: 4,
            textAlign: 'center'
          }
        }
      })
  },

  selectCity(e) {
    const { city, country } = e.currentTarget.dataset

    if (this.data.selectedCity === city) {
      this.setData({ selectedCity: '', selectedCountry: '' })
      this.resetMapView()
    } else {
      const coord = getCityCoord(city)
      this.setData({
        selectedCity: city,
        selectedCountry: country,
        mapCenter: coord || this.data.mapCenter,
        mapScale: coord ? 8 : 4
      })
    }

    this.applyFilters()
  },

  resetMapView() {
    this.setData({
      mapCenter: { lat: 30, lng: 110 },
      mapScale: 4
    })
  },

  toggleGroupMode() {
    this.setData({ groupMode: !this.data.groupMode })
    this.applyFilters()
  },

  selectGroup(e) {
    const group = e.currentTarget.dataset.group

    if (this.data.selectedGroup === group) {
      this.setData({ selectedGroup: 0 })
    } else {
      this.setData({ selectedGroup: group })
    }

    this.applyFilters()
  },

  applyFilters() {
    let base = this.data.allUsers

    if (this.data.selectedCity) {
      base = base.filter(u => u.city === this.data.selectedCity)
    }

    if (this.data.selectedGroup) {
      base = base.filter(u => u.group === this.data.selectedGroup)
    }

    if (this.data.keyword) {
      base = this.filterByKeyword(base, this.data.keyword)
    }

    this.setData({
      filteredUsers: base,
      groupedUsers: this.data.groupMode
        ? this.groupByGroup(base)
        : this.groupByCountry(base)
    })
  },

  groupByGroup(users) {
    const groups = {}
    users.forEach(u => {
      const key = u.group || 0
      if (!groups[key]) {
        groups[key] = { country: `${key}班`, users: [] }
      }
      groups[key].users.push(u)
    })

    return Object.values(groups).sort((a, b) => {
      const numA = parseInt(a.country)
      const numB = parseInt(b.country)
      return numA - numB
    })
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId
    const marker = this.data.markers[markerId]
    if (!marker) return

    this.setData({
      selectedCity: marker.title,
      drawerExpanded: true
    })
    this.applyFilters()
  },

  onSearch(e) {
    const keyword = e.detail.value.trim()
    this.setData({ keyword })
    this.applyFilters()
  },

  filterByKeyword(users, keyword) {
    if (!keyword) return users
    const lower = keyword.toLowerCase()
    return users.filter(u =>
      (u.nickName || '').toLowerCase().includes(lower) ||
      (u.studentId || '').includes(lower) ||
      (u.city || '').toLowerCase().includes(lower) ||
      (u.country || '').toLowerCase().includes(lower) ||
      (u.bio || '').toLowerCase().includes(lower)
    )
  },

  groupByCountry(users) {
    const groups = {}
    users.forEach(u => {
      const country = u.country || '未设置'
      if (!groups[country]) {
        groups[country] = { country, users: [] }
      }
      groups[country].users.push(u)
    })

    return Object.values(groups).sort((a, b) => b.users.length - a.users.length)
  },

  onUserTap(e) {
    const user = e.currentTarget.dataset.user
    this.setData({ selectedUser: user, showUserModal: true })
  },

  closeUserModal() {
    this.setData({ showUserModal: false, selectedUser: null })
  },

  copyWechat() {
    const wechat = this.data.selectedUser.wechat
    if (!wechat) return
    wx.setClipboardData({
      data: wechat,
      success: () => wx.showToast({ title: '微信号已复制', icon: 'success' })
    })
  },

  copyEmail() {
    const email = this.data.selectedUser.email
    if (!email) return
    wx.setClipboardData({
      data: email,
      success: () => wx.showToast({ title: '邮箱已复制', icon: 'success' })
    })
  },

  copyPhone() {
    const phone = this.data.selectedUser.phone
    if (!phone) return
    wx.setClipboardData({
      data: phone,
      success: () => wx.showToast({ title: '电话已复制', icon: 'success' })
    })
  },

  addToPhoneContact() {
    const user = this.data.selectedUser
    if (!user) return

    const data = {
      firstName: user.nickName || '',
      email: user.email || '',
      weChatNumber: user.wechat || '',
      mobilePhoneNumber: user.phone || '',
      addressStreet: user.address || user.street || ''
    }

    wx.addPhoneContact({
      ...data,
      success: () => wx.showToast({ title: '已添加', icon: 'success' }),
      fail: (err) => {
        if (err.errMsg.includes('cancel')) return
        wx.showToast({ title: '添加失败', icon: 'none' })
      }
    })
  },

  onTouchStart(e) {
    this.setData({ touchStartY: e.touches[0].clientY })
  },

  onTouchMove(e) {
    const deltaY = e.touches[0].clientY - this.data.touchStartY
    if (deltaY < -50) {
      this.setData({ drawerExpanded: true })
    } else if (deltaY > 80) {
      this.setData({ drawerExpanded: false })
    }
  },

  onTouchEnd() {}
})
