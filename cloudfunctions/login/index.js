const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { data: existingUser } = await usersCollection
      .where({ _openid: openid })
      .get()

    if (existingUser.length > 0) {
      const user = existingUser[0]
      if (event.userInfo) {
        await usersCollection.doc(user._id).update({
          data: {
            nickName: event.userInfo.nickName || user.nickName,
            avatarUrl: event.userInfo.avatarUrl || user.avatarUrl,
            updatedAt: db.serverDate()
          }
        })
      }

      return {
        openid,
        userInfo: { ...user, _openid: openid },
        onboarded: !!user.nickName && user.nickName !== '同学'
      }
    }

    const newUser = {
      _openid: openid,
      nickName: '同学',
      avatarUrl: '',
      gender: 0,
      phone: '',
      bio: '',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    const result = await usersCollection.add({ data: newUser })

    return {
      openid,
      userInfo: { ...newUser, _id: result._id },
      onboarded: false
    }
  } catch (err) {
    console.error('login error:', err)
    return { error: err.message }
  }
}
