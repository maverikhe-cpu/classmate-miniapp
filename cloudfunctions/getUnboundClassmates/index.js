const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const classmates = await fetchAll('classmates', {})

    const result = classmates.map(c => ({
      _id: c._id,
      nickName: c.nickName,
      studentId: c.studentId || '',
      group: c.group || 0,
      city: c.city || '',
      country: c.country || '',
      registered: c.registered || false,
      bound: c.bound || false
    }))

    return { success: true, data: result }
  } catch (err) {
    console.error('getUnboundClassmates error:', err)
    return { success: false, error: err.message }
  }
}

async function fetchAll(collection, query) {
  const { total } = await db.collection(collection).where(query).count()

  if (total === 0) return []

  const MAX_LIMIT = 100
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  const tasks = []

  for (let i = 0; i < batchTimes; i++) {
    tasks.push(
      db.collection(collection)
        .where(query)
        .field({ nickName: true, studentId: true, group: true, city: true, country: true, registered: true, bound: true })
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get()
    )
  }

  const results = await Promise.all(tasks)
  const data = []
  results.forEach(r => data.push(...r.data))
  return data
}
