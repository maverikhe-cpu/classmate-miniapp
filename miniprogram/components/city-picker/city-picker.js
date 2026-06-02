const { getCitiesByCountry } = require('../../utils/locations')

Component({
  properties: {
    country: {
      type: String,
      value: ''
    },
    value: {
      type: String,
      value: ''
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    visible: false,
    keyword: '',
    allCities: [],
    filteredList: []
  },

  observers: {
    'country': function (country) {
      const allCities = getCitiesByCountry(country)
      this.setData({ allCities, filteredList: allCities, keyword: '' })
    }
  },

  methods: {
    openPicker() {
      if (this.data.disabled) return
      const filteredList = this.filterCities(this.data.allCities, '')
      this.setData({ visible: true, keyword: '', filteredList })
    },

    closePicker() {
      this.setData({ visible: false, keyword: '' })
    },

    onSearchInput(e) {
      const keyword = e.detail.value.trim()
      const filteredList = this.filterCities(this.data.allCities, keyword)
      this.setData({ keyword, filteredList })
    },

    filterCities(cities, keyword) {
      if (!keyword) return cities
      const lower = keyword.toLowerCase()
      return cities.filter(c => c.toLowerCase().includes(lower))
    },

    onCityTap(e) {
      const city = e.currentTarget.dataset.city
      this.triggerEvent('change', { value: city })
      this.closePicker()
    },

    onUseCustom() {
      const city = this.data.keyword
      this.triggerEvent('change', { value: city })
      this.closePicker()
    }
  }
})
