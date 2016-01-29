'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('core-plugins-hw-mpd.Mpd');
const mpd    = require('mpd');

module.exports = class Mpd {
  constructor(config) {

    this._host = config.host;
    this._port = parseInt(config.port);

    this._setup();
  }

  _setup() {
    this.online  = 'off';
    this.playing = 'off';
    this.volume  = 0;

    this._client = mpd.connect({
      host: this._host,
      port: this._port
    });

    this._client.on('connect', (   ) => { logger.info('MPD (%s:%s) connect', this._host, this._port); });
    this._client.on('ready',   (   ) => { logger.info('MPD (%s:%s) ready', this._host, this._port); this._refresh(); });
    this._client.on('end',     (   ) => { logger.info('MPD (%s:%s) disonnected', this._host, this._port); });
    this._client.on('error',   (err) => { logger.error('MPD (%s:%s) error : %s', this._host, this._port, err); this._setup(); });

    const boundRefresh = this._refresh.bind(this);
    this._client.on('system-player', boundRefresh);
    this._client.on('system-mixer', boundRefresh);
  }

  _refresh() {
    this._client.sendCommand(mpd.cmd('status', []), (err, msg) => {
      if(err) {
        logger.error('MPD (%s:%s) error : %s', this._host, this._port, err);
        this._client.socket.destroy();
        this._setup();
        return;
      }
      const data = mpd.parseKeyValueMessage(msg);

      this.online  = 'on';
      this.playing = (data.state === 'play') ? 'on' : 'off';
      this.volume  = parseInt(data.volume);
    });
  }

  _sendAndRefresh(cmd, args) {
    this._client.sendCommand(mpd.cmd(cmd, args), () => {
      this._refresh();
    });
  }

  toggle(arg) {
    if(this.online === 'off') { return; }
    if(arg === 'off') { return; }
    if(this.playing === 'on') {
      this.pause(arg);
    } else {
      this.play(arg);
    }
  }

  play(arg) {
    if(this.online === 'off') { return; }
    if(arg === 'off') { return; }
    this._sendAndRefresh('play', []);
  }

  pause(arg) {
    if(this.online === 'off') { return; }
    if(arg === 'off') { return; }
    this._sendAndRefresh('pause', []);
  }

  setVolume(arg) {
    if(this.online === 'off') { return; }
    this._sendAndRefresh('setvol', [arg]);
  }

  close(done) {
    this._client.socket.destroy();
    setImmediate(done);
  }

  static metadata(builder) {
    const binary  = builder.enum('off', 'on');
    const percent = builder.range(0, 100);

    builder.usage.driver();

    builder.attribute('online', binary);
    builder.attribute('playing', binary);
    builder.attribute('volume', percent);

    builder.action('toggle', binary);
    builder.action('play', binary);
    builder.action('pause', binary);
    builder.action('setVolume', percent);

    builder.config('host', 'string');
    builder.config('port', 'integer');
  }
};
