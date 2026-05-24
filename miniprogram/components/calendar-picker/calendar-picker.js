const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

Component({
  properties: {
    value: {
      type: String,
      value: ''
    },
    minDate: {
      type: String,
      value: ''
    }
  },

  data: {
    year: 0,
    month: 0,
    weekDays: WEEKDAYS,
    days: [],
    displayMonth: ''
  },

  observers: {
    'value': function (val) {
      if (val) {
        const d = new Date(val)
        if (!isNaN(d.getTime()) && (d.getFullYear() !== this.data.year || d.getMonth() + 1 !== this.data.month)) {
          this.setData({ year: d.getFullYear(), month: d.getMonth() + 1 })
        }
      }
      this.buildDays()
    }
  },

  lifetimes: {
    attached() {
      const now = new Date()
      const y = this.data.value ? new Date(this.data.value).getFullYear() : now.getFullYear()
      const m = this.data.value ? new Date(this.data.value).getMonth() + 1 : now.getMonth() + 1
      this.setData({ year: y, month: m })
      this.buildDays()
    }
  },

  methods: {
    buildDays() {
      const { year, month } = this.data
      const firstDay = new Date(year, month - 1, 1).getDay()
      const daysInMonth = new Date(year, month, 0).getDate()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const selectedDate = this.data.value || ''
      const minDate = this.data.minDate ? new Date(this.data.minDate) : null
      if (minDate) minDate.setHours(0, 0, 0, 0)

      const days = []

      for (let i = 0; i < firstDay; i++) {
        days.push({ day: 0 })
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d)
        date.setHours(0, 0, 0, 0)
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

        const isPast = date < today
        const isBeforeMin = minDate && date < minDate
        const isToday = date.getTime() === today.getTime()
        const isSelected = dateStr === selectedDate

        days.push({
          day: d,
          dateStr,
          disabled: isPast || isBeforeMin,
          isToday,
          isSelected
        })
      }

      this.setData({
        days,
        displayMonth: `${year}年${month}月`
      })
    },

    prevMonth() {
      let { year, month } = this.data
      month--
      if (month < 1) { month = 12; year-- }
      this.setData({ year, month })
      this.buildDays()
    },

    nextMonth() {
      let { year, month } = this.data
      month++
      if (month > 12) { month = 1; year++ }
      this.setData({ year, month })
      this.buildDays()
    },

    onSelectDate(e) {
      const { date, disabled } = e.currentTarget.dataset
      if (disabled || !date) return
      this.triggerEvent('change', { value: date })
    }
  }
})
