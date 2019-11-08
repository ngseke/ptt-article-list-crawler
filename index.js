const request = require('request-promise')
const cheerio = require('cheerio')

const host = 'https://www.ptt.cc'

// 推數文字轉換為字串
function likeConverter (str) {
  str = str.trim()
  if (str === '爆') return 100
  else if (str === '') return 0
  else if (str === 'XX') return -100
  else if (/X/.test(str)) return -(str.replace(/X/, '')) * 10
  else return +str
}

async function getPage (uri) {
  const options = {
    uri,
    transform: body => cheerio.load(body)
  }

  const $ = await request(options)
  const list = []
  let prev = host + $('#action-bar-container > div > div.btn-group.btn-group-paging > a:nth-child(2)').attr('href')

  $(`.r-ent`).each((index, el) => {
    el = $(el)

    const title = el.children('.title').text().trim()
    let author = el.children('.meta').children('.author').text().trim()
    let date = el.children('.meta').children('.date').text().trim()
    let url = el.children('.title').children('a').attr('href')
    let like = el.children('.nrec').text().trim()
    
    author = author !== '-' ? author : null
    url = url ? host + url : null

    list.push({
      title,
      author,
      date,
      url,
      like: likeConverter(like),
    })
  })

  return { list, prev }
}

async function task (url, count, list = []) {
  console.log(`    🌀 ${count} page(s) remaining...`)

  const result = await getPage(url)
  list = [...result.list, ...list]

  if (--count > 0) return await task(result.prev, count, list)
  else return list
}

async function start (target, pageCount) {
  console.log(`🔴 開始抓取 ${target}`)

  const from = +new Date()
  const result = await task(target, pageCount)
  const end = +new Date()
  const time = (end - from) / 1000

  result.forEach(_ => console.log(_.date, _.title))

  console.log(`✅ 成功抓取 ${pageCount} 頁，共耗時 ${time}s`)
}

start('https://www.ptt.cc/bbs/Lifeismoney/', 5)
