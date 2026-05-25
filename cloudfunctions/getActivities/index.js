const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { status = 'all', country = '', city = '', category = '', page = 0, pageSize = 20 } = event

  try {
    let query = { status: _.neq('cancelled') }

    const now = new Date()

    if (status === 'open') {
      query = {
        status: 'open',
        endTime: _.gt(now)
      }
    } else if (status === 'ongoing') {
      query = {
        status: 'open',
        startTime: _.lte(now),
        endTime: _.gte(now)
      }
    } else if (status === 'ended') {
      query = {
        endTime: _.lt(now)
      }
    }

    if (country) {
      query.country = country
    }
    if (city) {
      query.city = city
    }
    if (category) {
      query.categories = _.elemMatch(_.eq(category))
    }

    const countResult = await db.collection('activities')
      .where(query)
      .count()

    const { data: activities } = await db.collection('activities')
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: activities,
      total: countResult.total,
      hasMore: (page + 1) * pageSize < countResult.total
    }
  } catch (err) {
    console.error('getActivities error:', err)
    return { success: false, error: err.message }
  }
}
