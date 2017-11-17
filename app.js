const ics = require('ics')
const http = require('http')
const request = require('request');

function main(){
    const body = {
        "request": {
            "selectedSchool": {
                "Name": "Yrgo Lärdomsgatan",
                "Guid": "c7a07cfd-25b1-439d-a37c-10638e2be616",
                "Settings": {
                    "AllowTimetableForStudent": true
                }
            },
            "selectedTeacher": null,
            "selectedGroup": {
                "Id": "Bp16",
                "Guid": "c5d4ceb8-7a32-418e-9bb8-c6528c9e6fdc"
            },
            "selectedRoom": null,
            "selectedSignatures": {
                "Signature": ""
            },
            "selectedPeriod": null,
            "selectedWeek": 47,
            "headerEnabled": false,
            "footerEnabled": false,
            "blackAndWhite": false,
            "domain": "goteborg.skola24.se",
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

    const re_weekday = /(Måndag)|(Tisdag)|(Onsdag)|(Torsdag)|(Fredag)/i
    const re_time = /\d*:\d*/i
    const re_text = /\X*/i
    const re_room = /\*/i
    const star = /\*/g
    const multi_space = / +/g

    request.post(options, function (error, response, body){

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

        //console.log(res.textList)

        weekdays = res.textList.filter(e => e.text.match(re_weekday))
        times = res.textList.filter(e => e.text.match(re_time))
        texts = res.textList.filter(e => e.text.match(re_text) &&
                                       !e.text.match(re_weekday) &&
                                       !e.text.match(re_time) && e.text.length > 0)

        descriptions = texts.filter(e => !e.text.match(re_room))
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
                event.description = text(inside(event, descriptions))
                event.room = text(inside(event, rooms))
                event.day = text(vertical_match(event, weekdays))
                return event
            })

        console.log(events)
    })

}


function create_ics_event(params) {
    const event = {
        start: [2018, 5, 30, 6, 30],
        duration: { hours: 6, minutes: 30 },
        title: 'Bolder Boulder',
        description: 'Annual 10-kilometer run in Boulder, Colorado',
        location: 'Folsom Field, University of Colorado (finish line)',
        url: 'http://www.bolderboulder.com/',
        geo: { lat: 40.0095, lon: 105.2669 },
        categories: ['10k races', 'Memorial Day Weekend', 'Boulder CO'],
        status: 'CONFIRMED',
        organizer: { name: 'Admin', email: 'Race@BolderBOULDER.com' },
        attendees: [
            { name: 'Adam Gibbons', email: 'adam@example.com' },
            { name: 'Brittany Seaton', email: 'brittany@example2.org' }
        ]
    }

    ics.createEvent(event, (error, value) => {
        if (error) {
            console.log(error)
        }

        console.log(value)
    })
}

main()