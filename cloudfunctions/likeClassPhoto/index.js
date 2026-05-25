const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { photoId } = event
  const openid = cloud.getWXContext().OPENID

  if (!photoId) return { success: false, error: '缺少参数' }

  try {
    const { data: photo } = await db.collection('classPhotos').doc(photoId).get()
    if (!photo) return { success: false, error: '照片不存在' }

    const liked = (photo.likedBy || []).includes(openid)

    if (liked) {
      await db.collection('classPhotos').doc(photoId).update({
        data: {
          likedBy: _.pull(openid),
          likeCount: _.inc(-1),
          updatedAt: db.serverDate()
        }
      })
    } else {
      await db.collection('classPhotos').doc(photoId).update({
        data: {
          likedBy: _.push(openid),
          likeCount: _.inc(1),
          updatedAt: db.serverDate()
        }
      })
    }

    return { success: true, liked: !liked }
  } catch (err) {
    console.error('likeClassPhoto error:', err)
    return { success: false, error: err.message }
  }
}
