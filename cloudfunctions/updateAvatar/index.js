const cloud = require('wx-server-sdk')
const fs = require('fs')
const path = require('os')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { fileData } = event

  if (!fileData) {
    return { success: false, error: '缺少图片数据' }
  }

  try {
    const tmpPath = `${path.tmpdir()}/avatar_${openid}_${Date.now()}.jpg`
    const buffer = Buffer.from(fileData, 'base64')
    fs.writeFileSync(tmpPath, buffer)

    const cloudPath = `avatars/${openid}_${Date.now()}.jpg`
    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: buffer
    })

    fs.unlinkSync(tmpPath)

    const { data: users } = await db.collection('users')
      .where({ _openid: openid })
      .get()

    if (users.length > 0) {
      await db.collection('users').doc(users[0]._id).update({
        data: { avatarUrl: uploadRes.fileID }
      })
    }

    return { success: true, avatarUrl: uploadRes.fileID }
  } catch (err) {
    console.error('updateAvatar error:', err)
    return { success: false, error: err.message }
  }
}
