const { getMiniProgram, sleep, log } = require('../helper')

const SUITE = 'Contacts'

async function testContactsPageLoads(mp) {
  const page = await mp.switchTab('/pages/contacts/contacts')
  await sleep(2000)

  const searchBar = await page.$('.search-bar')
  if (!searchBar) {
    throw new Error('Search bar not found on contacts page')
  }

  log(SUITE, 'Contacts page loaded')
}

async function testGroupFilterTabs(mp) {
  const page = await mp.currentPage()
  const groupCards = await page.$$('.city-card')

  if (groupCards.length === 0) {
    throw new Error('No group filter tabs or city cards found')
  }

  const firstCard = await page.$('.city-card')
  const firstName = await firstCard.$('.city-card-name')
  const nameText = firstName ? await firstName.text() : ''

  if (!nameText.includes('全部')) {
    throw new Error(`Expected first tab "全部", got "${nameText}"`)
  }

  log(SUITE, `${groupCards.length} group/city filter cards rendered`)
}

async function testMapComponent(mp) {
  const page = await mp.currentPage()
  const map = await page.$('map')

  if (!map) {
    throw new Error('Map component not found on contacts page')
  }

  log(SUITE, 'Map component renders')
}

async function testDrawerPresent(mp) {
  const page = await mp.currentPage()
  const drawer = await page.$('.drawer')

  if (!drawer) {
    throw new Error('Bottom drawer not found on contacts page')
  }

  const sortToggle = await page.$('.sort-toggle-text')
  if (!sortToggle) {
    throw new Error('Sort toggle not found in drawer')
  }

  log(SUITE, 'Bottom drawer and sort toggle present')
}

async function testUserListRenders(mp) {
  const page = await mp.currentPage()

  const userItems = await page.$$('.user-item')
  const emptyState = await page.$('.empty-state')

  if (userItems.length === 0 && !emptyState) {
    throw new Error('No user items and no empty state')
  }

  if (userItems.length > 0) {
    const nameRow = await page.$('.user-name-row')
    if (!nameRow) {
      throw new Error('User name row not found in user item')
    }

    log(SUITE, `${userItems.length} user items rendered with name rows`)
  } else {
    log(SUITE, 'Empty state shown (no contacts data)')
  }
}

async function testUserDetailModal(mp) {
  const page = await mp.currentPage()

  const firstUser = await page.$('.user-item')
  if (!firstUser) {
    log(SUITE, 'Skipping modal test — no user items to tap')
    return
  }

  await firstUser.tap()
  await sleep(1500)

  const modal = await page.$('.user-modal-mask')
  if (!modal) {
    throw new Error('User detail modal did not open')
  }

  const modalName = await page.$('.modal-name')
  if (!modalName) {
    throw new Error('Modal name not found')
  }

  const addContactBtn = await page.$('.add-contact-btn')
  if (!addContactBtn) {
    throw new Error('Add to contacts button not found in modal')
  }

  log(SUITE, 'User detail modal opens with name and add-contact button')

  await page.$('.user-modal-mask').then(el => el.tap())
  await sleep(500)
}

module.exports = {
  name: 'Contacts',
  tests: [
    { name: 'Contacts page loads with search', fn: testContactsPageLoads },
    { name: 'Group filter tabs render', fn: testGroupFilterTabs },
    { name: 'Map component renders', fn: testMapComponent },
    { name: 'Bottom drawer with sort toggle', fn: testDrawerPresent },
    { name: 'User list or empty state renders', fn: testUserListRenders },
    { name: 'User detail modal opens', fn: testUserDetailModal }
  ]
}
