const { getMiniProgram, sleep, log } = require('../helper')

const SUITE = 'Profile'

async function testProfilePageLoads(mp) {
  const page = await mp.switchTab('/pages/profile/profile')
  await sleep(2000)

  const profileName = await page.$('.profile-name')
  if (!profileName) {
    throw new Error('Profile page did not load properly')
  }

  const nameText = await profileName.text()
  log(SUITE, `Profile name: ${nameText}`)
}

async function testProfileStats(mp) {
  const page = await mp.currentPage()

  const stats = await page.$$('.stat-item')
  if (stats.length < 2) {
    throw new Error(`Expected at least 2 stat items, got ${stats.length}`)
  }

  log(SUITE, `${stats.length} profile stats rendered`)
}

async function testEditModalOpens(mp) {
  const page = await mp.currentPage()
  const editBtn = await page.$('.menu-item')

  if (!editBtn) {
    throw new Error('Edit profile menu item not found')
  }

  await editBtn.tap()
  await sleep(1000)

  const modal = await page.$('.modal-mask')
  if (!modal) {
    throw new Error('Edit modal did not open')
  }

  const modalTitle = await page.$('.modal-title')
  const titleText = modalTitle ? await modalTitle.text() : ''
  if (!titleText.includes('编辑资料')) {
    throw new Error(`Expected modal title "编辑资料", got "${titleText}"`)
  }

  log(SUITE, 'Edit modal opens correctly')
}

async function testEditModalFormFields(mp) {
  const page = await mp.currentPage()

  const formInputs = await page.$$('.form-input')
  if (formInputs.length < 6) {
    throw new Error(`Expected at least 6 form inputs (name, bio, wechat, email, phone, address), got ${formInputs.length}`)
  }

  const pickerValues = await page.$$('.picker-value')
  if (pickerValues.length < 2) {
    throw new Error(`Expected at least 2 pickers (country, city), got ${pickerValues.length}`)
  }

  const formLabels = await page.$$('.form-label')
  const labelTexts = []
  for (const label of formLabels) {
    labelTexts.push(await label.text())
  }

  const expectedLabels = ['姓名', '个性签名', '微信号', '电子邮箱', '电话号码', '详细地址']
  for (const expected of expectedLabels) {
    if (!labelTexts.some(t => t.includes(expected))) {
      throw new Error(`Missing form label: "${expected}"`)
    }
  }

  log(SUITE, `Form has ${formInputs.length} inputs, ${pickerValues.length} pickers, all labels present`)
}

async function testEditModalClose(mp) {
  const page = await mp.currentPage()
  const cancelBtn = await page.$('.btn-secondary')

  if (!cancelBtn) {
    throw new Error('Cancel button not found in modal')
  }

  await cancelBtn.tap()
  await sleep(500)

  const modal = await page.$('.modal-mask')
  if (modal) {
    throw new Error('Modal did not close after clicking cancel')
  }

  log(SUITE, 'Edit modal closes on cancel')
}

async function testMyActivitiesSection(mp) {
  const page = await mp.currentPage()

  const sectionTitle = await page.$('.section-title')
  if (!sectionTitle) {
    throw new Error('My activities section title not found')
  }

  const titleText = await sectionTitle.text()
  if (!titleText.includes('我参加的活动')) {
    throw new Error(`Expected "我参加的活动", got "${titleText}"`)
  }

  log(SUITE, 'My activities section renders')
}

module.exports = {
  name: 'Profile',
  tests: [
    { name: 'Profile page loads', fn: testProfilePageLoads },
    { name: 'Profile stats render', fn: testProfileStats },
    { name: 'Edit modal opens', fn: testEditModalOpens },
    { name: 'Form fields include contact info', fn: testEditModalFormFields },
    { name: 'Edit modal closes on cancel', fn: testEditModalClose },
    { name: 'My activities section renders', fn: testMyActivitiesSection }
  ]
}
