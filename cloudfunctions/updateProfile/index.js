const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const COUNTRY_CODES = {
  '中国': 'CN', '美国': 'US', '英国': 'GB', '加拿大': 'CA', '澳大利亚': 'AU',
  '日本': 'JP', '新加坡': 'SG', '德国': 'DE', '法国': 'FR', '韩国': 'KR',
  '新西兰': 'NZ', '荷兰': 'NL', '马来西亚': 'MY', '泰国': 'TH', '意大利': 'IT',
  '西班牙': 'ES', '瑞士': 'CH', '瑞典': 'SE', '爱尔兰': 'IE', '丹麦': 'DK',
  '挪威': 'NO', '芬兰': 'FI', '奥地利': 'AT', '比利时': 'BE', '葡萄牙': 'PT',
  '俄罗斯': 'RU', '印度': 'IN', '菲律宾': 'PH', '越南': 'VN', '印度尼西亚': 'ID',
  '巴西': 'BR', '阿联酋': 'AE'
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { nickName, bio, country, city, wechat, email, phone, address } = event

  if (!nickName) {
    return { success: false, error: '姓名不能为空' }
  }

  try {
    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get()

    if (users.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const updateData = {
      nickName,
      bio: bio || '',
      wechat: wechat || '',
      email: email || '',
      phone: phone || '',
      address: address || '',
      updatedAt: db.serverDate()
    }

    if (country) {
      updateData.country = country
      updateData.countryCode = COUNTRY_CODES[country] || ''
    }
    if (city) {
      updateData.city = city
    }

    await db.collection('users').doc(users[0]._id).update({
      data: updateData
    })

    return {
      success: true,
      data: {
        nickName: updateData.nickName,
        bio: updateData.bio,
        wechat: updateData.wechat,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        country: updateData.country || users[0].country || '',
        countryCode: updateData.countryCode || users[0].countryCode || '',
        city: updateData.city || users[0].city || ''
      }
    }
  } catch (err) {
    console.error('updateProfile error:', err)
    return { success: false, error: err.message }
  }
}
