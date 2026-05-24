const { getMiniProgram, waitFor, sleep, log } = require('../helper')

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

async function testMapComponent(mp) {
  const page = await mp.currentPage()
  const map = await page.$('map')

  if (!map) {
    throw new Error('Map component not found on contacts page')
  }

  log(SUITE, 'Map component renders')
}

async function testCityStatsCards(mp) {
  const page = await mp.currentPage()
  const cards = await page.$$('.city-card')

  if (cards.length === 0) {
    const emptyState = await page.$('.empty-state')
    if (emptyState) {
      log(SUITE, 'No city cards (empty state shown — data not yet loaded)')
      return
    }
    throw new Error('No city stats cards found and no empty state')
  }

  log(SUITE, `${cards.length} city stats cards rendered`)
}

async function testDrawerPresent(mp) {
  const page = await mp.currentPage()
  const drawer = await page.$('.drawer')

  if (!drawer) {
    throw new Error('Bottom drawer not found on contacts page')
  }

  log(SUITE, 'Bottom drawer component present')
}

module.exports = {
  name: 'Contacts',
  tests: [
    { name: 'Contacts page loads with search', fn: testContactsPageLoads },
    { name: 'Map component renders', fn: testMapComponent },
    { name: 'City stats cards render', fn: testCityStatsCards },
    { name: 'Bottom drawer present', fn: testDrawerPresent }
  ]
}
