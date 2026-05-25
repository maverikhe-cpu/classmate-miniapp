const { getAllCountries, getCitiesByCountry, getCountryCode, getUtcOffset, formatOffsetStr } = require('../../utils/locations')

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAYS[d.getDay()]}`
}

function updateDisplay(startDate, startTime, endDate, endTime, deadlineDate, deadlineTime) {
  return {
    startDisplay: startDate ? (startTime ? `${formatDateDisplay(startDate)} ${startTime}` : formatDateDisplay(startDate)) : '',
    endDisplay: endDate ? (endTime ? `${formatDateDisplay(endDate)} ${endTime}` : formatDateDisplay(endDate)) : '',
    deadlineDisplay: deadlineDate ? (deadlineTime ? `${formatDateDisplay(deadlineDate)} ${deadlineTime}` : formatDateDisplay(deadlineDate)) : ''
  }
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
    showStartCalendar: false,
    showEndCalendar: false,
    showDeadlineCalendar: false,
    submitting: false
  },

  onLoad(options) {
    this.setData({ countries: getAllCountries() })

    if (options.id) {
      this.activityId = options.id
      this.loadActivity()
    }
  },

  async loadActivity() {
    wx.showLoading({ title: '加载中' })

    try {
      const { data: activity } = await wx.cloud.database().collection('activities').doc(this.activityId).get()

      if (!activity) {
        wx.showToast({ title: '活动不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      const offset = activity.timezoneOffset != null ? activity.timezoneOffset : getUtcOffset(activity.country, activity.city)
      const startLocal = this.toLocal(new Date(activity.startTime), offset)
      const endLocal = this.toLocal(new Date(activity.endTime), offset)
      const countries = getAllCountries()
      const countryIndex = countries.indexOf(activity.country)
      const cities = countryIndex >= 0 ? getCitiesByCountry(activity.country) : []
      const cityIndex = cities.indexOf(activity.city)

      const startDate = this.formatDateStr(startLocal)
      const startTimeStr = this.formatTimeStr(startLocal)
      const endDate = this.formatDateStr(endLocal)
      const endTimeStr = this.formatTimeStr(endLocal)

      let deadlineDate = ''
      let deadlineTime = ''
      if (activity.signupDeadline) {
        const dl = this.toLocal(new Date(activity.signupDeadline), offset)
        deadlineDate = this.formatDateStr(dl)
        deadlineTime = this.formatTimeStr(dl)
      }

      const displays = updateDisplay(startDate, startTimeStr, endDate, endTimeStr, deadlineDate, deadlineTime)

      this.setData({
        title: activity.title || '',
        description: activity.description || '',
        location: activity.location || '',
        country: activity.country || '',
        city: activity.city || '',
        countryIndex,
        cities,
        cityIndex,
        startDate,
        startTime: startTimeStr,
        endDate,
        endTime: endTimeStr,
        hasLimit: activity.maxMembers > 0,
        maxMembers: activity.maxMembers > 0 ? String(activity.maxMembers) : '',
        deadlineDate,
        deadlineTime,
        ...displays
      })
    } catch (err) {
      console.error('loadActivity error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    } finally {
      wx.hideLoading()
    }
  },

  toLocal(utcDate, offsetHours) {
    const ms = utcDate.getTime() + offsetHours * 3600000
    const d = new Date(ms)
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() }
  },

  formatDateStr(t) {
    return `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`
  },

  formatTimeStr(t) {
    return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onLocationInput(e) { this.setData({ location: e.detail.value }) },
  onDescriptionInput(e) { this.setData({ description: e.detail.value }) },

  onCountryChange(e) {
    const index = parseInt(e.detail.value)
    const country = this.data.countries[index]
    this.setData({ country, countryIndex: index, cities: getCitiesByCountry(country), city: '', cityIndex: -1 })
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
    }
    this.setData({ ...updates, ...updateDisplay(startDate, this.data.startTime, updates.endDate || this.data.endDate, this.data.endTime, this.data.deadlineDate, this.data.deadlineTime) })
  },

  onStartTimeChange(e) {
    const startTime = e.detail.value
    this.setData({ startTime, ...updateDisplay(this.data.startDate, startTime, this.data.endDate, this.data.endTime, this.data.deadlineDate, this.data.deadlineTime) })
  },

  onEndDateChange(e) {
    const endDate = e.detail.value
    this.setData({ endDate, showEndCalendar: false, ...updateDisplay(this.data.startDate, this.data.startTime, endDate, this.data.endTime, this.data.deadlineDate, this.data.deadlineTime) })
  },

  onEndTimeChange(e) {
    const endTime = e.detail.value
    this.setData({ endTime, ...updateDisplay(this.data.startDate, this.data.startTime, this.data.endDate, endTime, this.data.deadlineDate, this.data.deadlineTime) })
  },

  onDeadlineDateChange(e) {
    const deadlineDate = e.detail.value
    this.setData({ deadlineDate, showDeadlineCalendar: false, ...updateDisplay(this.data.startDate, this.data.startTime, this.data.endDate, this.data.endTime, deadlineDate, this.data.deadlineTime) })
  },

  onDeadlineTimeChange(e) {
    const deadlineTime = e.detail.value
    this.setData({ deadlineTime, ...updateDisplay(this.data.startDate, this.data.startTime, this.data.endDate, this.data.endTime, this.data.deadlineDate, deadlineTime) })
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
    if (new Date(`${startDate} ${startTime}`) >= new Date(`${endDate} ${endTime}`)) {
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
      hasLimit, maxMembers, deadlineDate, deadlineTime
    } = this.data

    const offset = getUtcOffset(country, city)
    const offsetStr = formatOffsetStr(offset)

    try {
      const res = await wx.cloud.callFunction({
        name: 'updateActivity',
        data: {
          activityId: this.activityId,
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          country,
          countryCode: getCountryCode(country),
          city,
          timezoneOffset: offset,
          startTime: `${startDate}T${startTime}:00${offsetStr}`,
          endTime: `${endDate}T${endTime}:00${offsetStr}`,
          signupDeadline: (deadlineDate && deadlineTime)
            ? `${deadlineDate}T${deadlineTime}:00${offsetStr}`
            : null,
          maxMembers: hasLimit ? parseInt(maxMembers) : 0
        }
      })

      console.log('updateActivity result:', JSON.stringify(res.result))

      if (res.result.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showToast({ title: res.result.error || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error('submit error:', err)
      wx.showToast({ title: '保存失败，请检查云函数是否已部署', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
