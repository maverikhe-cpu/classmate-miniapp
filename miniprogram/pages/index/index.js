const { getAllCountries, getCitiesByCountry } = require('../../utils/locations')
const app = getApp()

Page({
  data: {
    activities: [],
    currentTab: 'all',
    page: 0,
    hasMore: true,
    loading: false,
    countries: [],
    filterCountry: '',
    filterCountryIndex: -1,
    filterCities: [],
    filterCity: '',
    filterCityIndex: -1
  },

  onLoad() {
    this.setData({ countries: getAllCountries() })
    app.ensureOnboarded().then(ok => {
      if (ok) this.loadActivities()
    })
  },

  onPullDownRefresh() {
    this.setData({ page: 0, activities: [], hasMore: true })
    this.loadActivities().then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadActivities()
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return

    this.setData({
      currentTab: tab,
      activities: [],
      page: 0,
      hasMore: true
    })
    this.loadActivities()
  },

  onFilterCountryChange(e) {
    const index = parseInt(e.detail.value)
    const country = this.data.countries[index]
    const cities = getCitiesByCountry(country)

    this.setData({
      filterCountry: country,
      filterCountryIndex: index,
      filterCities: cities,
      filterCity: '',
      filterCityIndex: -1,
      activities: [],
      page: 0,
      hasMore: true
    })
    this.loadActivities()
  },

  onFilterCityChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      filterCity: this.data.filterCities[index],
      filterCityIndex: index,
      activities: [],
      page: 0,
      hasMore: true
    })
    this.loadActivities()
  },

  clearFilter() {
    this.setData({
      filterCountry: '',
      filterCountryIndex: -1,
      filterCities: [],
      filterCity: '',
      filterCityIndex: -1,
      activities: [],
      page: 0,
      hasMore: true
    })
    this.loadActivities()
  },

  async loadActivities() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivities',
        data: {
          status: this.data.currentTab,
          country: this.data.filterCountry,
          city: this.data.filterCity,
          page: this.data.page,
          pageSize: 20
        }
      })

      const result = res.result

      if (!result.success) {
        wx.showToast({ title: '加载失败', icon: 'none' })
        return
      }

      const activities = result.data

      this.setData({
        activities: [...this.data.activities, ...activities],
        hasMore: result.hasMore,
        page: this.data.page + 1
      })

      this._loaded = true
    } catch (err) {
      console.error('loadActivities error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onShow() {
    if (!app.globalData.onboarded) return
    if (this._loaded) {
      this.setData({ page: 0, activities: [], hasMore: true })
      this.loadActivities()
    }
  },

  goCreate() {
    wx.navigateTo({
      url: '/pages/create-activity/create-activity'
    })
  }
})
