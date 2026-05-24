const cloud = require('wx-server-sdk')
const fs = require('fs')
const path = require('path')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { action = 'seed' } = event

  if (action === 'seed') {
    return await seedClassmates()
  } else if (action === 'status') {
    return await getSeedStatus()
  } else if (action === 'reset') {
    return await resetClassmates()
  } else if (action === 'reseed') {
    return await reseedClassmates()
  }
}

async function seedClassmates() {
  try {
    const { total } = await db.collection('classmates').count()
    if (total > 0) {
      return { success: false, error: `已有 ${total} 条数据，请先清空再导入` }
    }

    const filePath = path.join(__dirname, 'classmates.json')
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const classmates = JSON.parse(rawData)

    const batchLimit = 20
    const results = []

    for (let i = 0; i < classmates.length; i += batchLimit) {
      const batch = classmates.slice(i, i + batchLimit).map(c => ({
        data: {
          ...c,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      }))

      const promise = db.collection('classmates').add(batch[0])
      results.push(promise)

      for (let j = 1; j < batch.length; j++) {
        results.push(db.collection('classmates').add(batch[j]))
      }
    }

    await Promise.all(results)

    return { success: true, count: classmates.length }
  } catch (err) {
    console.error('seedData error:', err)
    return { success: false, error: err.message }
  }
}

async function getSeedStatus() {
  try {
    const { total } = await db.collection('classmates').count()
    return { success: true, total }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function resetClassmates() {
  try {
    const MAX_LIMIT = 100
    const { total } = await db.collection('classmates').count()
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    const tasks = []

    for (let i = 0; i < batchTimes; i++) {
      tasks.push(
        db.collection('classmates')
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get()
      )
    }

    const results = await Promise.all(tasks)
    const records = []
    results.forEach(r => records.push(...r.data))

    const updateTasks = records.map(r =>
      db.collection('classmates').doc(r._id).update({
        data: { bound: false, boundOpenid: '', registered: false }
      })
    )

    await Promise.all(updateTasks)

    return { success: true, updated: records.length }
  } catch (err) {
    console.error('resetClassmates error:', err)
    return { success: false, error: err.message }
  }
}

async function reseedClassmates() {
  try {
    let deleted = 0
    while (true) {
      const { data: batch } = await db.collection('classmates').limit(20).get()
      if (batch.length === 0) break

      await Promise.all(
        batch.map(r => db.collection('classmates').doc(r._id).remove())
      )
      deleted += batch.length
    }

    const result = await seedClassmates()
    return { ...result, deleted }
  } catch (err) {
    console.error('reseedClassmates error:', err)
    return { success: false, error: err.message }
  }
}
