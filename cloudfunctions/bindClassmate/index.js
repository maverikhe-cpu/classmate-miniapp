const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const {
    classmateId,
    nickName,
    bio,
    country,
    city,
    avatarUrl
  } = event

  if (!nickName) {
    return { success: false, error: '姓名不能为空' }
  }

  try {
    const { data: existingUsers } = await db.collection('users')
      .where({ _openid: openid })
      .get()

    if (existingUsers.length > 0) {
      const user = existingUsers[0]
      if (user.onboarded && user.classmateId) {
        return { success: false, error: '你已经绑定过身份' }
      }
    }

    if (classmateId) {
      const { data: classmates } = await db.collection('classmates')
        .where({ _id: classmateId, bound: _.neq(true) })
        .get()

      if (classmates.length === 0) {
        return { success: false, error: '该同学已被绑定或不存在' }
      }

      const classmate = classmates[0]

      await db.collection('classmates').doc(classmateId).update({
        data: {
          bound: true,
          boundOpenid: openid,
          registered: true,
          updatedAt: db.serverDate()
        }
      })

      const userData = {
        _openid: openid,
        nickName,
        classmateId,
        bio: bio || classmate.bio || '',
        avatarUrl: avatarUrl || classmate.avatarUrl || '',
        country: country || classmate.country || '',
        countryCode: classmate.countryCode || '',
        city: city || classmate.city || '',
        studentId: classmate.studentId || '',
        group: classmate.group || 0,
        onboarded: true,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }

      if (existingUsers.length > 0) {
        await db.collection('users').doc(existingUsers[0]._id).update({ data: userData })
      } else {
        await db.collection('users').add({ data: userData })
      }

      return {
        success: true,
        openid,
        userInfo: userData
      }
    }

    const userData = {
      _openid: openid,
      nickName,
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      country: country || '',
      city: city || '',
      onboarded: true,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    if (existingUsers.length > 0) {
      await db.collection('users').doc(existingUsers[0]._id).update({ data: userData })
    } else {
      await db.collection('users').add({ data: userData })
    }

    return {
      success: true,
      openid,
      userInfo: userData
    }
  } catch (err) {
    console.error('bindClassmate error:', err)
    return { success: false, error: err.message }
  }
}
