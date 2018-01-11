/*
 * Copyright 2018 Scott Bender (scott@scottbender.net)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require("debug")("signalk-canbus-writer");

module.exports = function(app) {
  var plugin = {};
  var unsubscribes = []
  var options
  var process

  plugin.id = "signalk-canbus-writer";
  plugin.name = "Canbus Writer";
  plugin.description = "Signal K plugin that enables writing N2K messages to canbus";

  plugin.start = function(theOptions) {
    options = theOptions

    debug("start");

    var command = `socketcan-writer ${options.bus}`
    process = require('child_process').spawn('sh', ['-c', command])

    process.stderr.on('data', function (data) {
      console.error(data.toString())
    })

    process.stdout.on('data', function (data) {
      console.log(data.toString())
    })

    process.on('close', code => {
      process = null
    })

    app.on("nmea2000out", listener)
  }

  var listener = (msg) => {
    debug(`sending ${msg}`)
    if ( process ) {
      process.stdin.write(msg + '\n')
    }
  }
  
  plugin.stop = () => {
    app.removeListener('nmea2000out', listener)
    if ( process ) {
      process.kill()
    }
  }

  plugin.schema = {
    title: "Canbus Writer",
    type: 'object',
    properties: {
      bus : {
        type: 'string',
        title: 'The bus',
        default: 'can0'
      }
    }
  }
  
  return plugin;
}
