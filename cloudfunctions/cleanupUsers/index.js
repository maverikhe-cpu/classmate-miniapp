const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { action } = event
  if (action === 'dryRun') return dryRun()
  if (action === 'clean') return clean()
  return { error: '请指定 action: dryRun 或 clean' }
}

async function dryRun() {
  const { data: users } = await db.collection('users').get()
  const { data: classmates } = await db.collection('classmates').get()

  const toDelete = []
  const toBind = []
  const alreadyBound = []

  const classmateMap = {}
  classmates.forEach(c => {
    classmateMap[(c.nickName || '').trim()] = c
  })

  for (const user of users) {
    const name = (user.nickName || '').trim()

    if (user.onboarded === true && user.classmateId) {
      alreadyBound.push({ _id: user._id, nickName: name, classmateId: user.classmateId })
      continue
    }

    const matched = classmateMap[name]

    if (!matched) {
      toDelete.push({ _id: user._id, nickName: name, reason: '无匹配同学' })
      continue
    }

    if (matched.bound && matched.boundOpenid !== user._openid) {
      toDelete.push({ _id: user._id, nickName: name, reason: '同学已被其他账号绑定' })
      continue
    }

    toBind.push({
      userId: user._id,
      userOpenid: user._openid,
      nickName: name,
      classmateId: matched._id,
      reason: user.onboarded !== true ? '未完成注册' : '未绑定同学记录'
    })
  }

  return {
    alreadyBound: alreadyBound.length,
    toDelete: toDelete.length,
    toBind: toBind.length,
    details: { toDelete, toBind, alreadyBound }
  }
}

async function clean() {
  const report = await dryRun()

  let deleted = 0
  let bound = 0

  for (const item of report.details.toDelete) {
    await db.collection('users').doc(item._id).remove()
    deleted++
  }

  for (const item of report.details.toBind) {
    await db.collection('classmates').doc(item.classmateId).update({
      data: { bound: true, boundOpenid: item.userOpenid, registered: true, updatedAt: db.serverDate() }
    })

    const classmate = (await db.collection('classmates').doc(item.classmateId).get()).data

    await db.collection('users').doc(item.userId).update({
      data: {
        classmateId: item.classmateId,
        studentId: classmate.studentId || '',
        group: classmate.group || 0,
        wechat: classmate.wechat || '',
        email: classmate.email || '',
        phone: classmate.phone || '',
        address: classmate.address || '',
        onboarded: true,
        updatedAt: db.serverDate()
      }
    })

    bound++
  }

  return { deleted, bound }
}
