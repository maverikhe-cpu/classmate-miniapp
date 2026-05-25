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
      return {
        openid,
        userInfo: { ...user, _openid: openid },
        onboarded: !!user.onboarded
      }
    }

    return {
      openid,
      userInfo: null,
      onboarded: false
    }
  } catch (err) {
    console.error('login error:', err)
    return { error: err.message }
  }
}
