const { getMiniProgram, sleep, log } = require('../helper')

const SUITE = 'Album'

async function testAlbumTabLoads(mp) {
  const page = await mp.switchTab('/pages/album/album')
  await sleep(2000)

  const currentPath = page.path
  if (!currentPath.includes('album')) {
    throw new Error(`Expected album page, got ${currentPath}`)
  }

  log(SUITE, 'Album tab page loaded')
}

async function testSearchBarRenders(mp) {
  const page = await mp.currentPage()

  const searchInput = await page.$('.search-input')
  if (!searchInput) {
    throw new Error('Search input not found on album page')
  }

  log(SUITE, 'Search bar renders')
}

async function testTagFilterRenders(mp) {
  const page = await mp.currentPage()

  const tagPills = await page.$$('.tag-pill')
  if (tagPills.length === 0) {
    throw new Error('No tag filter pills rendered')
  }

  log(SUITE, `Tag filter renders with ${tagPills.length} pills`)
}

async function testFabButtonNavigates(mp) {
  const page = await mp.currentPage()
  const fab = await page.$('.fab')

  if (!fab) {
    throw new Error('FAB button not found')
  }

  await fab.tap()
  await sleep(2000)

  const page2 = await mp.currentPage()
  const currentPath = page2.path
  if (!currentPath.includes('upload-photo')) {
    throw new Error(`Expected upload-photo page, got ${currentPath}`)
  }

  log(SUITE, 'FAB navigates to upload-photo page')
}

async function testUploadPageFormRenders(mp) {
  const page = await mp.currentPage()

  const photoArea = await page.$('.photo-area')
  if (!photoArea) {
    throw new Error('Photo area not found on upload page')
  }

  const textarea = await page.$('.form-textarea')
  if (!textarea) {
    throw new Error('Caption textarea not found')
  }

  const tagBtns = await page.$$('.tag-btn')
  if (tagBtns.length === 0) {
    throw new Error('Tag buttons not found')
  }

  const submitBtn = await page.$('.submit-btn')
  if (!submitBtn) {
    throw new Error('Submit button not found')
  }

  log(SUITE, `Upload form renders: photo area, textarea, ${tagBtns.length} tags, submit button`)
}

async function testFuzzyDatePickerRenders(mp) {
  const page = await mp.currentPage()

  const picker = await page.$('fuzzy-date-picker')
  if (!picker) {
    throw new Error('Fuzzy date picker component not found')
  }

  log(SUITE, 'Fuzzy date picker component renders')
}

module.exports = {
  name: 'Album',
  tests: [
    { name: 'Album tab loads', fn: testAlbumTabLoads },
    { name: 'Search bar renders', fn: testSearchBarRenders },
    { name: 'Tag filter renders', fn: testTagFilterRenders },
    { name: 'FAB navigates to upload page', fn: testFabButtonNavigates },
    { name: 'Upload form renders', fn: testUploadPageFormRenders },
    { name: 'Fuzzy date picker renders', fn: testFuzzyDatePickerRenders }
  ]
}
