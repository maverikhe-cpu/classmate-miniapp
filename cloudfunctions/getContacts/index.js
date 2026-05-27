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

    // Build name → classmates lookup (allow duplicates by storing array)
    const classmatesByName = {}
    classmatesResult.forEach(c => {
      const key = (c.nickName || '').trim()
      if (!classmatesByName[key]) classmatesByName[key] = []
      classmatesByName[key].push(c)
    })

    // Track which classmates have been matched to a user
    const matchedClassmateIds = new Set()

    const mergedUsers = users.map(u => {
      const nameKey = (u.nickName || '').trim()
      const candidates = classmatesByName[nameKey]
      if (candidates && candidates.length > 0) {
        // Find an unmatched classmate with this name
        const matched = candidates.find(c => !matchedClassmateIds.has(c._id))
        if (matched) {
          matchedClassmateIds.add(matched._id)
          return {
            ...u,
            studentId: u.studentId || matched.studentId || '',
            group: u.group || matched.group || 0
          }
        }
      }
      return u
    })

    // Unbound classmates whose _id was NOT matched above
    const unboundClassmates = classmatesResult.filter(c => !matchedClassmateIds.has(c._id))

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
