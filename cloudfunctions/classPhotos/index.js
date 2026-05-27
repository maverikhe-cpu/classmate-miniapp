const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { page = 0, pageSize = 20, tag, keyword } = event

  try {
    try { await db.createCollection('classPhotos') } catch (_) { /* already exists */ }

    let query = db.collection('classPhotos')

    const conditions = {}
    if (tag) {
      conditions.tags = _.elemMatch(_.eq(tag))
    }
    if (Object.keys(conditions).length > 0) {
      query = query.where(conditions)
    }

    const { total } = await query.count()

    let photosQuery = query
      .orderBy('createdAt', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)

    const { data: photos } = await photosQuery.get()

    let filtered = photos
    if (keyword) {
      const lower = keyword.toLowerCase()
      filtered = photos.filter(p =>
        (p.caption || '').toLowerCase().includes(lower) ||
        (p.uploaderName || '').toLowerCase().includes(lower) ||
        (p.tags || []).some(t => t.toLowerCase().includes(lower))
      )
    }

    const { data: users } = await db.collection('users')
      .where({ _openid: _.in(filtered.map(p => p._openid).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)) })
      .get()

    const userMap = {}
    users.forEach(u => { userMap[u._openid] = u })

    const result = filtered.map(p => ({
      ...p,
      isLiked: (p.likedBy || []).includes(openid)
    }))

    // Convert fileIDs to temp URLs so all users can view images
    const fileIDs = result.map(p => p.fileID).filter(Boolean)
    let urlMap = {}
    if (fileIDs.length > 0) {
      try {
        const urlRes = await cloud.getTempFileURL({ fileList: fileIDs })
        if (urlRes.fileList) {
          urlRes.fileList.forEach(f => { urlMap[f.fileID] = f.tempFileURL })
        }
      } catch (_) {}
    }

    const finalResult = result.map(p => ({
      ...p,
      fileID: (p.fileID && urlMap[p.fileID]) || p.fileID,
      rawFileID: p.fileID
    }))

    return {
      success: true,
      data: finalResult,
      total,
      hasMore: (page + 1) * pageSize < total
    }
  } catch (err) {
    console.error('classPhotos error:', err)
    return { success: false, error: err.message }
  }
}
