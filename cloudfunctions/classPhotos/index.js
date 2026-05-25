const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { page = 0, pageSize = 20, tag, keyword } = event

  try {
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

    return {
      success: true,
      data: result,
      total,
      hasMore: (page + 1) * pageSize < total
    }
  } catch (err) {
    console.error('classPhotos error:', err)
    return { success: false, error: err.message }
  }
}
