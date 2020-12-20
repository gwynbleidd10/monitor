require('isomorphic-fetch')
require('dotenv').config()

const urls = [
    {
        name: "Е-Якутия",
        url: 'https://e-yakutia.ru',
        selector: '<input type="text" id="valueAll" class="form-control" name="text" placeholder="Введите название услуги или организации"/>',
        hook: 'WORK_HOOK',
        type: 'external',
        timeout: 5000,
        warnings: 0,
        alert: false
    },
    {
        name: "ЕИТП - ПГУ",
        url: 'https://beta.e-yakutia.ru',
        selector: '<title ng-bind="Page.title()">Портал государственных и муниципальных услуг</title>',
        hook: 'WORK_HOOK',
        type: 'external',
        timeout: 5000,
        warnings: 0,
        alert: false
    },
    {
        name: "ЕИТП - ВИС",
        url: 'https://eitp.e-yakutia.ru',
        selector: 'В вашем браузере отключена встроенная БД',
        hook: 'WORK_HOOK',
        type: 'inner',
        timeout: 5000,
        warnings: 0,
        alert: false
    },
    {
        name: "РСМЭВ",
        url: 'http://rsmev.sakha.gov.ru/adapter-web/',
        selector: '<input class="form-control" id="tynamoLoginUsername" name="tynamoLoginUsername" type="text" autocomplete="off">',
        hook: 'WORK_HOOK',
        type: 'inner',
        timeout: 5000,
        warnings: 0,
        alert: false
    },
    {
        name: "ОИП",
        url: 'https://sakha.gov.ru',
        selector: 'Все материалы сайта доступны по лицензии',
        hook: 'WORK_HOOK',
        type: 'external',
        timeout: 10000,
        warnings: 0,
        alert: false
    },
    {
        name: "WorkAPI",
        url: 'https://workapi.rcitsakha.ru',
        selector: '<div class="monitor" style="display:none"></div>',
        hook: 'DEV_HOOK',
        type: 'external',
        timeout: 5000,
        warnings: 0,
        alert: false
    }
]

const sendHook = (level, is) => {
    const { Webhook, MessageBuilder } = require('discord-webhook-node')
    const hook = new Webhook(process.env[is.hook])
    const embed = new MessageBuilder()
        .setTitle((level == 0) ? 'PROBLEM' : (level == 1 || level == 2) ? 'WARNING' : 'OK')
        .setURL(is.url)
        .addField(is.name, `${(level == 0) ? 'Потеряно соединение' : (level == 1) ? 'Проблема с контентом на сайте' : (level == 2) ? 'Слишком долгий ответ' : 'Доступ восстановлен'}`)
        .setColor(`${(level == 0) ? '#B80F0A' : (level == 1 || level == 2) ? '#FFFF00' : '#4CBB17'}: ${is.name}`)
        .setTimestamp()
    hook.send(embed)
}

const check = async (is) => {
    const AbortController = require("abort-controller")
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 25000)
    try {
        const timeStart = new Date()
        let result = await fetch(is.url, {
            signal: controller.signal,
            redirect: "follow"
        })
        const requestTime = (new Date() - timeStart)
        // console.log(await result.text())
        if (result.status == 200) {
            if ((await result.text()).includes(is.selector)) {
                if (requestTime > is.timeout) {
                    is.warnings++
                    if (is.warnings >= 2) {
                        is.alert = true
                        sendHook(2, is)
                        console.log(`${is.url}: WARNING`)
                    }
                }
                else if (is.alert) {
                    is.alert = false
                    is.warnings = 0
                    sendHook(3, is)
                    console.log(`${is.url}: OK`)
                }
                console.log(`${is.url}: ${requestTime}`)
            }
            else {
                if (!is.alert) {
                    is.alert = true
                    sendHook(1, is)
                }
                console.log(`${is.url}: WARNING`)
            }
        }
        else {
            if (!is.alert) {
                is.alert = true
                sendHook(0, is)
            }
            console.log(`${is.url}: PROBLEM: ${result.status}`)
        }
    } catch (err) {
        if (!is.alert) {
            is.alert = true
            sendHook(0, is)
        }
        console.log(`${is.url}: PROBLEM:${err}`)
    }
    is.process = false
}

const start = async () => {
    console.log("=========Iter========")
    for (const is of urls) {
        // console.log(is)
        if (is.type == process.env.TYPE) {
            await check(is)
        }
    }
}

setInterval(start, 30000)
start()
