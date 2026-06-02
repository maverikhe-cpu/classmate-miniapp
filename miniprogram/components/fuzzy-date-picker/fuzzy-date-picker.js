const { DATE_TYPES, SEASONS, ERAS } = require('../../utils/photoTags')

Component({
  properties: {
    value: {
      type: Object,
      value: { dateType: 'unknown' }
    }
  },

  data: {
    dateTypes: DATE_TYPES,
    seasons: SEASONS.map(s => s.label),
    seasonValues: SEASONS.map(s => s.value),
    eras: ERAS,
    years: [],
    months: Array.from({ length: 12 }, (_, i) => i + 1),
    days: Array.from({ length: 31 }, (_, i) => i + 1),
    selectedDateType: 'unknown',
    selectedYear: 0,
    selectedMonth: 0,
    selectedDay: 0,
    selectedSeason: 0,
    selectedEra: 0,
    displayText: '记不清了'
  },

  observers: {
    'selectedYear, selectedMonth': function (yearIdx, monthIdx) {
      const year = this.data.years[yearIdx]
      const month = this.data.months[monthIdx]
      if (!year || !month) return
      const daysInMonth = new Date(year, month, 0).getDate()
      const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1)
      if (this.data.selectedDay >= dayOptions.length) {
        this.setData({ dayOptions, selectedDay: dayOptions.length - 1 })
      } else {
        this.setData({ dayOptions })
      }
    },
    'value': function (val) {
      if (!val) return
      const currentYear = new Date().getFullYear()
      const years = []
      for (let y = currentYear; y >= 1990; y--) years.push(y)

      this.setData({ years, selectedDateType: val.dateType || 'unknown' })

      if (val.year) {
        const idx = years.indexOf(val.year)
        if (idx >= 0) this.setData({ selectedYear: idx })
      }
      if (val.season) {
        const idx = this.data.seasonValues.indexOf(val.season)
        if (idx >= 0) this.setData({ selectedSeason: idx })
      }
      if (val.era) {
        const idx = ERAS.indexOf(val.era)
        if (idx >= 0) this.setData({ selectedEra: idx })
      }

      this.updateDisplay()
    }
  },

  methods: {
    onDateTypeTap(e) {
      const type = e.currentTarget.dataset.type
      this.setData({ selectedDateType: type })
      this.emitChange()
      this.updateDisplay()
    },

    onYearChange(e) {
      this.setData({ selectedYear: parseInt(e.detail.value) })
      this.emitChange()
      this.updateDisplay()
    },

    onMonthChange(e) {
      this.setData({ selectedMonth: parseInt(e.detail.value) })
      this.emitChange()
      this.updateDisplay()
    },

    onDayChange(e) {
      this.setData({ selectedDay: parseInt(e.detail.value) })
      this.emitChange()
      this.updateDisplay()
    },

    onSeasonChange(e) {
      this.setData({ selectedSeason: parseInt(e.detail.value) })
      this.emitChange()
      this.updateDisplay()
    },

    onEraChange(e) {
      this.setData({ selectedEra: parseInt(e.detail.value) })
      this.emitChange()
      this.updateDisplay()
    },

    emitChange() {
      const type = this.data.selectedDateType
      const result = { dateType: type }

      if (type === 'exact' || type === 'year' || type === 'season') {
        result.year = this.data.years[this.data.selectedYear] || null
      }
      if (type === 'exact') {
        result.month = this.data.months[this.data.selectedMonth] || null
        result.day = this.data.dayOptions[this.data.selectedDay] || null
      }
      if (type === 'season') {
        result.season = this.data.seasonValues[this.data.selectedSeason] || null
      }
      if (type === 'era') {
        result.era = ERAS[this.data.selectedEra] || null
      }

      this.triggerEvent('change', { value: result })
    },

    updateDisplay() {
      const type = this.data.selectedDateType
      let text = ''
      switch (type) {
        case 'exact': {
          const y = this.data.years[this.data.selectedYear] || ''
          const m = this.data.months[this.data.selectedMonth] || ''
          const d = this.data.dayOptions ? this.data.dayOptions[this.data.selectedDay] : ''
          if (m && d) {
            text = `${y}年${m}月${d}日`
          } else if (m) {
            text = `${y}年${m}月`
          } else {
            text = `${y}年`
          }
          break
        }
        case 'year':
          text = `${this.data.years[this.data.selectedYear] || ''}年`
          break
        case 'season': {
          const y = this.data.years[this.data.selectedYear] || ''
          const s = this.data.seasons[this.data.selectedSeason] || ''
          text = `${y}年${s}`
          break
        }
        case 'era':
          text = `${ERAS[this.data.selectedEra] || ''}时期`
          break
        case 'unknown':
          text = '记不清了'
          break
      }
      this.setData({ displayText: text })
    }
  }
})
