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
    this.connected = 'off';
    this.playing   = 'off';
    this.volume    = 0;

    this._client = mpd.connect({
      host: this._host,
      port: this._port
    });

    this._client.on('connect', () => { logger.info('MPD (%s:%s) connect'. this._host, this._port); });
    this._client.on('ready',   () => { logger.info('MPD (%s:%s) ready'. this._host, this._port); });
    this._client.on('end',     () => { logger.info('MPD (%s:%s) disonnected'. this._host, this._port); });

    this._client.on('end', (err) => {
      logger.error('MPD (%s:%s) error : %s'. this._host, this._port, err);
      this._setup();
    });

    const boundRefresh = this._refresh.bind(this);
    this._client.on('system-player', boundRefresh);
    this._client.on('system-mixer', boundRefresh);
  }

  _refresh() {
    this._client.sendCommand(mpd.cmd('status', []), (err, msg) => {
      // TODO: read status
      console.log('err', err);
      console.log('msg', msg);
    });
  }

  toggle(arg) {
    if(this.connected === 'off') { return; }
    if(arg === 'off') { return; }
    // TODO
  }

  play(arg) {
    if(this.connected === 'off') { return; }
    if(arg === 'off') { return; }
    // TODO
  }

  pause(arg) {
    if(this.connected === 'off') { return; }
    if(arg === 'off') { return; }
    // TODO
  }

  setVolume(arg) {
    if(this.connected === 'off') { return; }
    // TODO
  }

  close(done) {
    this._client.socket.destroy();
    setImmediate(done);
  }

  static metadata(builder) {
    const binary = builder.enum('off', 'on');
    const range0_100 = builder.range(0, 100);

    builder.usage.driver();

    builder.attribute('connected', binary);
    builder.attribute('playing', binary);
    builder.attribute('volume', range0_100);

    builder.action('toggle', binary);
    builder.action('play', binary);
    builder.action('pause', binary);
    builder.action('setVolume', range0_100);

    builder.config('host', 'string');
    builder.config('port', 'integer');
  }
};
