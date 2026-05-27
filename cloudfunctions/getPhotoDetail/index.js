const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { photoId } = event

  if (!photoId) {
    return { success: false, error: '缺少 photoId' }
  }

  try {
    const { data: photo } = await db.collection('classPhotos').doc(photoId).get()

    if (!photo) {
      return { success: false, error: '照片不存在' }
    }

    let tempFileURL = photo.fileID
    if (photo.fileID) {
      try {
        const urlRes = await cloud.getTempFileURL({ fileList: [photo.fileID] })
        if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
          tempFileURL = urlRes.fileList[0].tempFileURL
        }
      } catch (_) {}
    }

    return {
      success: true,
      data: {
        ...photo,
        fileID: tempFileURL,
        rawFileID: photo.fileID,
        isUploader: photo._openid === openid
      }
    }
  } catch (err) {
    console.error('getPhotoDetail error:', err)
    return { success: false, error: err.message }
  }
}
