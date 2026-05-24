const path = require('path')

const PROJECT_PATH = path.resolve(__dirname, '..')
const CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
const DEFAULT_TIMEOUT = 10000
const SLOW_OPERATION_TIMEOUT = 20000

module.exports = {
  PROJECT_PATH,
  CLI_PATH,
  DEFAULT_TIMEOUT,
  SLOW_OPERATION_TIMEOUT
}
