const LOCATIONS = [
  {
    country: '中国',
    code: 'CN',
    utcOffset: 8,
    cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安', '苏州', '天津', '长沙', '青岛', '厦门', '合肥', '郑州', '昆明', '大连', '宁波', '香港', '澳门', '台北', '沈阳', '哈尔滨', '长春', '济南', '福州', '南昌', '石家庄', '太原', '贵阳', '南宁', '海口', '三亚', '珠海', '东莞', '佛山', '无锡', '常州', '温州', '绍兴', '嘉兴', '泉州', '洛阳', '潍坊', '烟台', '乌鲁木齐', '拉萨', '呼和浩特', '银川', '西宁', '兰州', '桂林', '徐州', '扬州', '镇江', '泰州', '南通', '盐城', '连云港', '淮安', '宿迁', '湖州', '金华', '台州', '衢州', '丽水', '芜湖', '蚌埠', '漳州', '赣州', '九江', '宜昌', '襄阳', '岳阳', '株洲', '绵阳', '宜宾', '遵义', '曲靖', '大理', '丽江', '中山', '惠州', '汕头', '江门', '肇庆']
  },
  {
    country: '美国',
    code: 'US',
    utcOffset: -5,
    cityOffsets: { '纽约': -5, '波士顿': -5, '华盛顿': -5, '费城': -5, '芝加哥': -6, '休斯顿': -6, '洛杉矶': -8, '旧金山': -8, '西雅图': -8, '硅谷': -8, '圣地亚哥': -8, '达拉斯': -6, '亚特兰大': -5, '迈阿密': -5, '丹佛': -7, '凤凰城': -7, '拉斯维加斯': -8, '波特兰': -8, '底特律': -5, '明尼阿波利斯': -6, '匹兹堡': -5 },
    cities: ['纽约', '洛杉矶', '旧金山', '西雅图', '波士顿', '芝加哥', '休斯顿', '华盛顿', '硅谷', '费城', '圣地亚哥', '达拉斯', '亚特兰大', '迈阿密', '丹佛', '凤凰城', '拉斯维加斯', '波特兰', '底特律', '明尼阿波利斯', '匹兹堡']
  },
  {
    country: '英国',
    code: 'GB',
    utcOffset: 0,
    cities: ['伦敦', '曼彻斯特', '伯明翰', '爱丁堡', '利兹', '谢菲尔德', '布里斯托', '利物浦', '格拉斯哥', '剑桥', '牛津', '南安普顿', '纽卡斯尔', '诺丁汉', '卡迪夫']
  },
  {
    country: '加拿大',
    code: 'CA',
    utcOffset: -5,
    cityOffsets: { '多伦多': -5, '渥太华': -5, '蒙特利尔': -5, '卡尔加里': -7, '埃德蒙顿': -7, '温哥华': -8, '维多利亚': -8, '魁北克城': -5, '温尼伯': -6, '滑铁卢': -5 },
    cities: ['多伦多', '温哥华', '蒙特利尔', '卡尔加里', '渥太华', '埃德蒙顿', '维多利亚', '魁北克城', '温尼伯', '滑铁卢']
  },
  {
    country: '澳大利亚',
    code: 'AU',
    utcOffset: 10,
    cityOffsets: { '悉尼': 10, '墨尔本': 10, '布里斯班': 10, '堪培拉': 10, '阿德莱德': 9.5, '珀斯': 8, '霍巴特': 10, '黄金海岸': 10 },
    cities: ['悉尼', '墨尔本', '布里斯班', '珀斯', '阿德莱德', '堪培拉', '霍巴特', '黄金海岸']
  },
  {
    country: '日本',
    code: 'JP',
    utcOffset: 9,
    cities: ['东京', '大阪', '京都', '横滨', '名古屋', '福冈', '札幌', '神户', '仙台', '广岛', '筑波']
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
    cities: ['柏林', '慕尼黑', '法兰克福', '汉堡', '科隆', '斯图加特', '杜塞尔多夫', '德累斯顿', '莱比锡', '汉诺威', '纽伦堡', '海德堡', '亚琛']
  },
  {
    country: '法国',
    code: 'FR',
    utcOffset: 1,
    cities: ['巴黎', '里昂', '马赛', '图卢兹', '尼斯', '波尔多', '斯特拉斯堡', '南特', '里尔', '蒙彼利埃']
  },
  {
    country: '韩国',
    code: 'KR',
    utcOffset: 9,
    cities: ['首尔', '釜山', '仁川', '大邱', '大田', '光州', '蔚山', '水原']
  },
  {
    country: '新西兰',
    code: 'NZ',
    utcOffset: 12,
    cityOffsets: { '奥克兰': 12, '惠灵顿': 12, '基督城': 12, '哈密尔顿': 12, '但尼丁': 12 },
    cities: ['奥克兰', '惠灵顿', '基督城', '哈密尔顿', '但尼丁']
  },
  {
    country: '荷兰',
    code: 'NL',
    utcOffset: 1,
    cities: ['阿姆斯特丹', '鹿特丹', '海牙', '乌特勒支', '埃因霍温', '莱顿', '代尔夫特']
  },
  {
    country: '马来西亚',
    code: 'MY',
    utcOffset: 8,
    cities: ['吉隆坡', '槟城', '新山', '马六甲', '怡保', '古晋', '哥打京那巴鲁']
  },
  {
    country: '泰国',
    code: 'TH',
    utcOffset: 7,
    cities: ['曼谷', '清迈', '普吉', '芭提雅', '合艾', '清莱']
  },
  {
    country: '意大利',
    code: 'IT',
    utcOffset: 1,
    cities: ['罗马', '米兰', '佛罗伦萨', '威尼斯', '都灵', '那不勒斯', '博洛尼亚', '比萨', '热那亚']
  },
  {
    country: '西班牙',
    code: 'ES',
    utcOffset: 1,
    cities: ['马德里', '巴塞罗那', '瓦伦西亚', '塞维利亚', '马拉加', '毕尔巴鄂', '萨拉戈萨']
  },
  {
    country: '瑞士',
    code: 'CH',
    utcOffset: 1,
    cityOffsets: { '苏黎世': 1, '日内瓦': 1, '巴塞尔': 1, '洛桑': 1, '伯尔尼': 1 },
    cities: ['苏黎世', '日内瓦', '巴塞尔', '洛桑', '伯尔尼', '卢塞恩']
  },
  {
    country: '瑞典',
    code: 'SE',
    utcOffset: 1,
    cities: ['斯德哥尔摩', '哥德堡', '马尔默', '乌普萨拉', '隆德']
  },
  {
    country: '爱尔兰',
    code: 'IE',
    utcOffset: 0,
    cities: ['都柏林', '科克', '戈尔韦', '利默里克']
  },
  {
    country: '丹麦',
    code: 'DK',
    utcOffset: 1,
    cities: ['哥本哈根', '奥胡斯', '奥登塞', '奥尔堡']
  },
  {
    country: '挪威',
    code: 'NO',
    utcOffset: 1,
    cities: ['奥斯陆', '卑尔根', '斯塔万格', '特隆赫姆']
  },
  {
    country: '芬兰',
    code: 'FI',
    utcOffset: 2,
    cities: ['赫尔辛基', '坦佩雷', '图尔库', '奥卢', '埃斯波']
  },
  {
    country: '奥地利',
    code: 'AT',
    utcOffset: 1,
    cities: ['维也纳', '萨尔茨堡', '因斯布鲁克', '格拉茨', '林茨']
  },
  {
    country: '比利时',
    code: 'BE',
    utcOffset: 1,
    cities: ['布鲁塞尔', '安特卫普', '根特', '鲁汶', '列日']
  },
  {
    country: '葡萄牙',
    code: 'PT',
    utcOffset: 0,
    cities: ['里斯本', '波尔图', '科英布拉', '法鲁']
  },
  {
    country: '俄罗斯',
    code: 'RU',
    utcOffset: 3,
    cityOffsets: { '莫斯科': 3, '圣彼得堡': 3, '喀山': 3, '新西伯利亚': 7, '海参崴': 10, '叶卡捷琳堡': 5 },
    cities: ['莫斯科', '圣彼得堡', '喀山', '新西伯利亚', '海参崴', '叶卡捷琳堡']
  },
  {
    country: '印度',
    code: 'IN',
    utcOffset: 5.5,
    cities: ['孟买', '新德里', '班加罗尔', '海得拉巴', '金奈', '加尔各答', '浦那']
  },
  {
    country: '菲律宾',
    code: 'PH',
    utcOffset: 8,
    cities: ['马尼拉', '宿务', '达沃', '碧瑶']
  },
  {
    country: '越南',
    code: 'VN',
    utcOffset: 7,
    cities: ['胡志明市', '河内', '岘港', '大叻', '芽庄']
  },
  {
    country: '印度尼西亚',
    code: 'ID',
    utcOffset: 7,
    cities: ['雅加达', '泗水', '巴厘岛', '万隆', '棉兰']
  },
  {
    country: '巴西',
    code: 'BR',
    utcOffset: -3,
    cityOffsets: { '圣保罗': -3, '里约热内卢': -3, '巴西利亚': -3, '萨尔瓦多': -3 },
    cities: ['圣保罗', '里约热内卢', '巴西利亚', '萨尔瓦多']
  },
  {
    country: '阿联酋',
    code: 'AE',
    utcOffset: 4,
    cities: ['迪拜', '阿布扎比', '沙迦']
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
  return `${sign}${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
}

module.exports = {
  LOCATIONS,
  getAllCountries,
  getCitiesByCountry,
  getCountryCode,
  getUtcOffset,
  formatOffsetStr
}
