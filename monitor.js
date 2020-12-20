require('isomorphic-fetch')
require('dotenv').config()

const urls = [
    {
        name: "Е-Якутия",
        url: 'https://e-yakutia.ru',
        selector: '<input type="text" id="valueAll" class="form-control" name="text" placeholder="Введите название услуги или организации"/>',
        hook: 'DEV_HOOK',
        alert: false
    },
    {
        name: "ЕИТП - ПГУ",
        url: 'https://beta.e-yakutia.ru',
        selector: '<title ng-bind="Page.title()">Портал государственных и муниципальных услуг</title>',
        hook: 'DEV_HOOK',
        alert: false
    },
    {
        name: "ЕИТП - ВИС",
        url: 'https://eitp.e-yakutia.ru',
        selector: 'В вашем браузере отключена встроенная БД',
        hook: 'DEV_HOOK',
        alert: false
    },
    {
        name: "РСМЭВ",
        url: 'http://rsmev.sakha.gov.ru/adapter-web/',
        selector: '<input class="form-control" id="tynamoLoginUsername" name="tynamoLoginUsername" type="text" autocomplete="off">',
        hook: 'DEV_HOOK',
        alert: false
    },
    {
        name: "WorkAPI",
        url: 'https://workapi.rcitsakha.ru',
        selector: '<div class="monitor" style="display:none"></div>',
        hook: 'DEV_HOOK',
        alert: true
    }
]

const sendHook = (level, is) => {
    const { Webhook, MessageBuilder } = require('discord-webhook-node')
    const hook = new Webhook(process.env[is.hook])
    const embed = new MessageBuilder()
        .setTitle((level == 0) ? 'PROBLEM' : (level == 1) ? 'WARNING' : 'OK')
        .setURL(is.url)
        .addField(is.name, `${(level == 0) ? 'Потеряно соединение' : (level == 1) ? 'Проблема с контентом на сайте' : 'Доступ восстановлен'}`)
        .setColor(`${(level == 0) ? '#B80F0A' : (level == 1) ? '#FFFF00' : '#4CBB17'}: ${is.name}`)
        .setTimestamp()
    hook.send(embed)
}

const check = async (is) => {
    const AbortController = require("abort-controller")
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)
    try {
        let result = await fetch(is.url, {
            signal: controller.signal,
            redirect: "follow"
        })
        if (result.status == 200) {
            if ((await result.text()).includes(is.selector)) {
                if (is.alert) {
                    is.alert = false
                    sendHook(2, is)
                }
                console.log(`${is.url}: OK`)
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
}

const start = async () => {
    for (const is of urls) {
        await check(is)
    }
}

setInterval(start, 15000)
start()
