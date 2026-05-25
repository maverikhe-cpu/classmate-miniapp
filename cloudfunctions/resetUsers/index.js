const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { action } = event
  if (action === 'dryRun') return dryRun()
  if (action === 'reset') return reset()
  return { error: '请指定 action: dryRun 或 reset' }
}

async function dryRun() {
  const { total: userCount } = await db.collection('users').count()
  const { total: boundCount } = await db.collection('classmates')
    .where({ bound: true })
    .count()
  const { total: classmateCount } = await db.collection('classmates').count()

  return {
    usersToDelete: userCount,
    classmatesToUnbind: boundCount,
    totalClassmates: classmateCount,
    message: `将删除 ${userCount} 条 users 记录，解除 ${boundCount} 条 classmates 绑定`
  }
}

async function reset() {
  let deleted = 0
  while (true) {
    const { data: batch } = await db.collection('users').limit(20).get()
    if (batch.length === 0) break
    await Promise.all(batch.map(r => db.collection('users').doc(r._id).remove()))
    deleted += batch.length
  }

  let unbound = 0
  while (true) {
    const { data: batch } = await db.collection('classmates')
      .where({ bound: true })
      .limit(20)
      .get()
    if (batch.length === 0) break
    await Promise.all(batch.map(r =>
      db.collection('classmates').doc(r._id).update({
        data: { bound: false, boundOpenid: '', registered: false }
      })
    ))
    unbound += batch.length
  }

  return { deleted, unbound }
}
