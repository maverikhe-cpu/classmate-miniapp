const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { country = '', city = '' } = event

  try {
    let query = {}
    if (country) query.country = country
    if (city) query.city = city

    const [usersResult, classmatesResult] = await Promise.all([
      fetchAll('users', query, {
        _openid: true, nickName: true, avatarUrl: true, bio: true,
        country: true, countryCode: true, city: true, gender: true,
        wechat: true, email: true, phone: true, address: true,
        studentId: true, group: true
      }),
      fetchAll('classmates', query, {
        _openid: true, nickName: true, avatarUrl: true, bio: true,
        country: true, countryCode: true, city: true,
        wechat: true, email: true, phone: true, address: true,
        registered: true, bound: true,
        studentId: true, group: true
      })
    ])

    const users = usersResult.filter(u => u.onboarded !== false)
    const classmateMap = {}
    classmatesResult.forEach(c => {
      classmateMap[(c.nickName || '').trim()] = c
    })

    const mergedUsers = users.map(u => {
      const matched = classmateMap[(u.nickName || '').trim()]
      if (matched) {
        return {
          ...u,
          studentId: u.studentId || matched.studentId || '',
          group: u.group || matched.group || 0
        }
      }
      return u
    })

    const userNames = new Set(mergedUsers.map(u => (u.nickName || '').trim()))
    const unboundClassmates = classmatesResult.filter(c => !c.bound && !userNames.has((c.nickName || '').trim()))

    const all = [...mergedUsers, ...unboundClassmates]

    const cityStats = {}
    const countryStats = {}

    all.forEach(u => {
      if (u.country) {
        countryStats[u.country] = (countryStats[u.country] || 0) + 1
      }
      if (u.city) {
        const key = `${u.country || ''}·${u.city}`
        if (!cityStats[key]) {
          cityStats[key] = { country: u.country, city: u.city, count: 0 }
        }
        cityStats[key].count++
      }
    })

    const cityDistribution = Object.values(cityStats)
      .sort((a, b) => b.count - a.count)

    const countryDistribution = Object.entries(countryStats)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)

    return {
      success: true,
      data: {
        users: all,
        cityDistribution,
        countryDistribution,
        total: all.length
      }
    }
  } catch (err) {
    console.error('getContacts error:', err)
    return { success: false, error: err.message }
  }
}

async function fetchAll(collection, query, fields) {
  const { total } = await db.collection(collection).where(query).count()

  if (total === 0) return []

  const MAX_LIMIT = 100
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  const tasks = []

  for (let i = 0; i < batchTimes; i++) {
    tasks.push(
      db.collection(collection)
        .where(query)
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .field(fields)
        .get()
    )
  }

  const results = await Promise.all(tasks)
  const data = []
  results.forEach(r => data.push(...r.data))
  return data
}
