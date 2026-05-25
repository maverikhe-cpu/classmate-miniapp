const { getAllCountries, getCitiesByCountry, getCountryCode, getUtcOffset, formatOffsetStr } = require('../../utils/locations')
const { CATEGORIES } = require('../../utils/categories')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAYS[d.getDay()]}`
}

Page({
  data: {
    title: '',
    description: '',
    location: '',
    country: '',
    city: '',
    countryIndex: -1,
    cityIndex: -1,
    countries: [],
    cities: [],
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    startDisplay: '',
    endDisplay: '',
    hasLimit: false,
    maxMembers: '',
    deadlineDate: '',
    deadlineTime: '',
    deadlineDisplay: '',
    categoryItems: CATEGORIES.map(name => ({ name, active: false })),
    selectedCategories: [],
    showStartCalendar: false,
    showEndCalendar: false,
    showDeadlineCalendar: false,
    submitting: false
  },

  onLoad() {
    this.setData({ countries: getAllCountries() })
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onLocationInput(e) { this.setData({ location: e.detail.value }) },
  onDescriptionInput(e) { this.setData({ description: e.detail.value }) },

  toggleCategory(e) {
    const idx = e.currentTarget.dataset.index
    const item = this.data.categoryItems[idx]
    const newItem = { name: item.name, active: !item.active }
    const newItems = [...this.data.categoryItems]
    newItems[idx] = newItem
    const selectedCategories = newItems.filter(c => c.active).map(c => c.name)
    this.setData({ categoryItems: newItems, selectedCategories })
  },

  onCountryChange(e) {
    const index = parseInt(e.detail.value)
    const country = this.data.countries[index]
    this.setData({
      country,
      countryIndex: index,
      cities: getCitiesByCountry(country),
      city: '',
      cityIndex: -1
    })
  },

  onCityChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({ city: this.data.cities[index], cityIndex: index })
  },

  toggleStartCalendar() {
    this.setData({ showStartCalendar: !this.data.showStartCalendar, showEndCalendar: false, showDeadlineCalendar: false })
  },

  toggleEndCalendar() {
    this.setData({ showEndCalendar: !this.data.showEndCalendar, showStartCalendar: false, showDeadlineCalendar: false })
  },

  toggleDeadlineCalendar() {
    this.setData({ showDeadlineCalendar: !this.data.showDeadlineCalendar, showStartCalendar: false, showEndCalendar: false })
  },

  closeAllCalendars() {
    this.setData({ showStartCalendar: false, showEndCalendar: false, showDeadlineCalendar: false })
  },

  onStartDateChange(e) {
    const startDate = e.detail.value
    const updates = { startDate, showStartCalendar: false }

    if (!this.data.endDate || this.data.endDate < startDate) {
      updates.endDate = startDate
      updates.endDisplay = this.data.endTime
        ? `${formatDateDisplay(startDate)} ${this.data.endTime}`
        : ''
    }

    updates.startDisplay = this.data.startTime
      ? `${formatDateDisplay(startDate)} ${this.data.startTime}`
      : formatDateDisplay(startDate)

    this.setData(updates)
  },

  onStartTimeChange(e) {
    const startTime = e.detail.value
    this.setData({
      startTime,
      startDisplay: this.data.startDate
        ? `${formatDateDisplay(this.data.startDate)} ${startTime}`
        : startTime
    })

    if (this.data.endDate && !this.data.endTime) {
      const [h] = startTime.split(':').map(Number)
      const endH = Math.min(h + 2, 23)
      const endTime = `${String(endH).padStart(2, '0')}:00`
      this.setData({
        endTime,
        endDisplay: `${formatDateDisplay(this.data.endDate)} ${endTime}`
      })
    }
  },

  onEndDateChange(e) {
    const endDate = e.detail.value
    this.setData({
      endDate,
      showEndCalendar: false,
      endDisplay: this.data.endTime
        ? `${formatDateDisplay(endDate)} ${this.data.endTime}`
        : formatDateDisplay(endDate)
    })
  },

  onEndTimeChange(e) {
    const endTime = e.detail.value
    this.setData({
      endTime,
      endDisplay: this.data.endDate
        ? `${formatDateDisplay(this.data.endDate)} ${endTime}`
        : endTime
    })
  },

  onDeadlineDateChange(e) {
    const deadlineDate = e.detail.value
    this.setData({
      deadlineDate,
      showDeadlineCalendar: false,
      deadlineDisplay: this.data.deadlineTime
        ? `${formatDateDisplay(deadlineDate)} ${this.data.deadlineTime}`
        : formatDateDisplay(deadlineDate)
    })
  },

  onDeadlineTimeChange(e) {
    const deadlineTime = e.detail.value
    this.setData({
      deadlineTime,
      deadlineDisplay: this.data.deadlineDate
        ? `${formatDateDisplay(this.data.deadlineDate)} ${deadlineTime}`
        : deadlineTime
    })
  },

  onLimitToggle(e) { this.setData({ hasLimit: e.detail.value, maxMembers: '' }) },
  onMaxMembersInput(e) { this.setData({ maxMembers: e.detail.value }) },

  clearDeadline() {
    this.setData({ deadlineDate: '', deadlineTime: '', deadlineDisplay: '' })
  },

  validate() {
    const { title, country, city, startDate, startTime, endDate, endTime, hasLimit, maxMembers } = this.data

    if (!title.trim()) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' })
      return false
    }
    if (!country || !city) {
      wx.showToast({ title: '请选择活动地区', icon: 'none' })
      return false
    }
    if (!startDate || !startTime) {
      wx.showToast({ title: '请选择开始时间', icon: 'none' })
      return false
    }
    if (!endDate || !endTime) {
      wx.showToast({ title: '请选择结束时间', icon: 'none' })
      return false
    }

    const start = new Date(`${startDate} ${startTime}`)
    const end = new Date(`${endDate} ${endTime}`)

    if (start >= end) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' })
      return false
    }
    if (hasLimit && (!maxMembers || parseInt(maxMembers) < 2)) {
      wx.showToast({ title: '人数限制至少为2人', icon: 'none' })
      return false
    }
    return true
  },

  async submit() {
    if (!this.validate()) return
    if (this.data.submitting) return

    this.setData({ submitting: true })

    const {
      title, description, location, country, city,
      startDate, startTime, endDate, endTime,
      hasLimit, maxMembers, deadlineDate, deadlineTime,
      selectedCategories
    } = this.data

    const offset = getUtcOffset(country, city)
    const offsetStr = formatOffsetStr(offset)

    try {
      const res = await wx.cloud.callFunction({
        name: 'createActivity',
        data: {
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          country,
          countryCode: getCountryCode(country),
          city,
          timezoneOffset: offset,
          categories: selectedCategories,
          startTime: `${startDate}T${startTime}:00${offsetStr}`,
          endTime: `${endDate}T${endTime}:00${offsetStr}`,
          signupDeadline: (deadlineDate && deadlineTime)
            ? `${deadlineDate}T${deadlineTime}:00${offsetStr}`
            : null,
          maxMembers: hasLimit ? parseInt(maxMembers) : 0
        }
      })

      if (res.result.success) {
        wx.showToast({ title: '创建成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showToast({ title: res.result.error || '创建失败', icon: 'none' })
      }
    } catch (err) {
      console.error('submit error:', err)
      wx.showToast({ title: '创建失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
