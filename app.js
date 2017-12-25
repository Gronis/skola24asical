const ical = require('ical-generator')
const http = require('http')
const request = require('request');
const moment = require('moment-timezone');
const util = require('util')
const express = require('express')
const async = require('async')

function main(){

    var app = express()

    app.get('/', (req, res) => {
        res.send('Använd denna sida för att kunna prenumerera på ett schema av skola24.se i ical format. See projektet på github: <a href="https://github.com/Gronis/skola24asical">https://github.com/Gronis/skola24asical</a>')
    })

    app.get('/schedule/:domain/:schoolGuid/:groupGuid', (req, res) => {
        const domain = req.params.domain
        const school = { "Guid": req.params.schoolGuid }
        const group = { "Guid": req.params.groupGuid }
        weeks = [0, 1, 2, 3, 4].map(x => (x + moment().isoWeek()) % 52).map(x => x == 0? 52 : x)
        console.log("Fetching schedule for ", domain, school, group)
        console.log("During weeks: ", weeks)
        counter = weeks.length
        all_events = []

        weeks.map(week => get_events(domain, school, group, week, (events) => {
            all_events = all_events.concat(events)
            counter--
            if (counter == 0){
                console.log("Sending", all_events)
                res.send(transform_to_ics_events(all_events))
            }
        }))
    })

    app.listen(8080, () => console.log('Started!'))

    /*
    const school = {
        "Guid": "c7a07cfd-25b1-439d-a37c-10638e2be616"
    }
    const group = {
        "Guid": "a9ff834a-dcdf-4e39-afdb-583f7e6c58d1"
    }

    const domain = "goteborg.skola24.se"

    get_events(domain, school, group, (events) => {
        ical_text = transform_to_ics_events(events)
    })*/
}

function get_events(domain, school, group, week, callback) {
    const re_weekday = /(Måndag)|(Tisdag)|(Onsdag)|(Torsdag)|(Fredag)/i
    const re_time = /\d*:\d*/i
    const re_text = /\X*/i
    const re_room = /\*/i
    const star = /\*/g
    const multi_space = / +/g

    const body = {
        "request": {
            "selectedSchool": school,
            "selectedTeacher": null,
            "selectedGroup": group,
            "selectedRoom": null,
            "selectedPeriod": null,
            "selectedWeek": week,
            "headerEnabled": false,
            "footerEnabled": false,
            "blackAndWhite": false,
            "domain": domain,
            "divWidth": 500, "divHeight": 500
        }
    }

    const options = {
        url: 'http://www.skola24.se/Schemavisare/Widgets/schema/Timetable/Render',
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(body)
    };

    return request.post(options, function (error, response, body){

        const vertical_match = (rect, list) => list.filter(item => item.x > rect.x1
                                                                && item.x < rect.x2)
        const horizontal_match = (rect, list) => list.filter(item => item.y > rect.y1
                                                                  && item.y < rect.y2)
        const inside = (rect, list) => vertical_match(rect, horizontal_match(rect, list))

        const text = (list) => list.map(item => item.text)
                                   .join(' ')
                                   .replace(multi_space, ' ')
                                   .replace(star, '')

        res = JSON.parse(body)

        weekdays = res.textList.filter(e => e.text.match(re_weekday))
        times = res.textList.filter(e => e.text.match(re_time))
        texts = res.textList.filter(e => e.text.match(re_text) &&
                                       !e.text.match(re_weekday) &&
                                       !e.text.match(re_time) && e.text.length > 0)

        titles = texts.filter(e => !e.text.match(re_room))
        rooms = texts.filter(e => e.text.match(re_room))

        times_start = times.filter((e, i) => i % 2 == 0)
        times_end = times.filter((e, i) => i % 2 == 1)
        events = times_start
            .map((e, i) => {
                o = {
                    x1: e.x,
                    y1: e.y,
                    x2: times_end[i].x,
                    y2: times_end[i].y,
                    start: e.text,
                    end: times_end[i].text,
                    width: times_end[i].x - e.x,
                    height: times_end[i].y - e.y
                }
                return o
            })
            .filter(event => event.width > 0 && event.width < 200)
            .map(event => {
                event.title = text(inside(event, titles))
                event.room = text(inside(event, rooms))
                event.day = text(vertical_match(event, weekdays))
                return event
            })

        callback(events)
    })
}

function transform_to_ics_events(events){
    const re_date = /\d*\/\d*/i
    const year = new Date().getFullYear()
    const fix_timezone = (date) => moment.tz(date, "Europe/Stockholm").clone().tz("Europe/London").toDate()

    ics_events = events.map(e => {
        const date = new String(e.day.match(re_date)).split('/').reverse().map(x => parseInt(x))
        const start = e.start.split(":").map(x => parseInt(x))
        const end = e.end.split(":").map(x => parseInt(x))
        const start_date = fix_timezone([year, date[0]-1, date[1], start[0], start[1]])
        const end_date = fix_timezone([year, date[0]-1, date[1], end[0], end[1]])

        event = {
            summary: e.title,
            location: e.room,
            start: start_date,
            end: end_date
        }
        return event
    })
    cal = ical({
        domain: 'example.net',
        timezone: 'Europe/Stockholm'
    })
    cal.events(ics_events)
    return cal.toString()
}

main()