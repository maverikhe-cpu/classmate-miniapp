const PHOTO_TAGS = ['校园', '军训', '课堂', '宿舍', '聚餐', '郊游', '运动', '毕业', '旅行', '日常']

const PHOTO_TAG_ICONS = {
  '校园': '🏫', '军训': '🎖️', '课堂': '📚', '宿舍': '🏠',
  '聚餐': '🍽️', '郊游': '🏕️', '运动': '⚽', '毕业': '🎓',
  '旅行': '✈️', '日常': '📷'
}

const DATE_TYPES = [
  { value: 'exact', label: '具体日期' },
  { value: 'year', label: '只知道年份' },
  { value: 'season', label: '年份+季节' },
  { value: 'era', label: '大学时期' },
  { value: 'unknown', label: '记不清了' }
]

const SEASONS = [
  { value: 'spring', label: '春天' },
  { value: 'summer', label: '夏天' },
  { value: 'autumn', label: '秋天' },
  { value: 'winter', label: '冬天' }
]

const ERAS = ['大一', '大二', '大三', '大四', '毕业季', '毕业后']

const formatPhotoDate = (photo) => {
  switch (photo.dateType) {
    case 'exact': {
      if (photo.year && photo.month && photo.day) {
        return `${photo.year}年${photo.month}月${photo.day}日`
      }
      if (photo.year && photo.month) {
        return `${photo.year}年${photo.month}月`
      }
      if (photo.exactDate) {
        const d = new Date(photo.exactDate)
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
      }
      return `${photo.year || ''}年`
    }
    case 'year':
      return `${photo.year}年`
    case 'season': {
      const s = SEASONS.find(s => s.value === photo.season)
      return `${photo.year}年${s ? s.label : ''}`
    }
    case 'era':
      return `${photo.era}时期`
    case 'unknown':
      return '时间不详'
    default:
      return ''
  }
}

module.exports = { PHOTO_TAGS, PHOTO_TAG_ICONS, DATE_TYPES, SEASONS, ERAS, formatPhotoDate }
