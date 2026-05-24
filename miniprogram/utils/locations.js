const LOCATIONS = [
  {
    country: '中国',
    code: 'CN',
    utcOffset: 8,
    cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安', '苏州', '天津', '长沙', '青岛', '厦门', '合肥', '郑州', '昆明', '大连', '宁波', '香港', '洛阳', '嘉兴', '其他']
  },
  {
    country: '美国',
    code: 'US',
    utcOffset: -5,
    cityOffsets: { '纽约': -5, '波士顿': -5, '华盛顿': -5, '费城': -5, '芝加哥': -6, '休斯顿': -6, '洛杉矶': -8, '旧金山': -8, '西雅图': -8, '硅谷': -8, '圣地亚哥': -8 },
    cities: ['纽约', '洛杉矶', '旧金山', '西雅图', '波士顿', '芝加哥', '休斯顿', '华盛顿', '硅谷', '费城', '圣地亚哥', '其他']
  },
  {
    country: '英国',
    code: 'GB',
    utcOffset: 0,
    cities: ['伦敦', '曼彻斯特', '伯明翰', '爱丁堡', '利兹', '谢菲尔德', '布里斯托', '其他']
  },
  {
    country: '加拿大',
    code: 'CA',
    utcOffset: -5,
    cityOffsets: { '多伦多': -5, '渥太华': -5, '蒙特利尔': -5, '卡尔加里': -7, '埃德蒙顿': -7, '温哥华': -8 },
    cities: ['多伦多', '温哥华', '蒙特利尔', '卡尔加里', '渥太华', '埃德蒙顿', '其他']
  },
  {
    country: '澳大利亚',
    code: 'AU',
    utcOffset: 10,
    cityOffsets: { '悉尼': 10, '墨尔本': 10, '布里斯班': 10, '堪培拉': 10, '阿德莱德': 9.5, '珀斯': 8 },
    cities: ['悉尼', '墨尔本', '布里斯班', '珀斯', '阿德莱德', '堪培拉', '其他']
  },
  {
    country: '日本',
    code: 'JP',
    utcOffset: 9,
    cities: ['东京', '大阪', '京都', '横滨', '名古屋', '福冈', '其他']
  },
  {
    country: '新加坡',
    code: 'SG',
    utcOffset: 8,
    cities: ['新加坡']
  },
  {
    country: '德国',
    code: 'DE',
    utcOffset: 1,
    cities: ['柏林', '慕尼黑', '法兰克福', '汉堡', '科隆', '斯图加特', '其他']
  },
  {
    country: '法国',
    code: 'FR',
    utcOffset: 1,
    cities: ['巴黎', '里昂', '马赛', '图卢兹', '尼斯', '其他']
  },
  {
    country: '韩国',
    code: 'KR',
    utcOffset: 9,
    cities: ['首尔', '釜山', '仁川', '大邱', '其他']
  },
  {
    country: '新西兰',
    code: 'NZ',
    utcOffset: 12,
    cities: ['奥克兰', '惠灵顿', '基督城', '其他']
  },
  {
    country: '荷兰',
    code: 'NL',
    utcOffset: 1,
    cities: ['阿姆斯特丹', '鹿特丹', '海牙', '乌特勒支', '其他']
  }
]

const getAllCountries = () => LOCATIONS.map(l => l.country)

const getCitiesByCountry = (country) => {
  const found = LOCATIONS.find(l => l.country === country)
  return found ? found.cities : []
}

const getCountryCode = (country) => {
  const found = LOCATIONS.find(l => l.country === country)
  return found ? found.code : ''
}

const getUtcOffset = (country, city) => {
  const found = LOCATIONS.find(l => l.country === country)
  if (!found) return 0
  if (found.cityOffsets && city && found.cityOffsets[city] !== undefined) {
    return found.cityOffsets[city]
  }
  return found.utcOffset
}

const formatOffsetStr = (offsetHours) => {
  const sign = offsetHours >= 0 ? '+' : '-'
  const abs = Math.abs(offsetHours)
  const h = Math.floor(abs)
  const m = (abs - h) * 60
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

module.exports = {
  LOCATIONS,
  getAllCountries,
  getCitiesByCountry,
  getCountryCode,
  getUtcOffset,
  formatOffsetStr
}
