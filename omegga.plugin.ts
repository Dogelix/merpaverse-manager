import { OmeggaPlugin, OL, PS, PC, OmeggaPlayer } from 'omegga';


// plugin config and storage
type Config = {
};


type Storage = {
};


export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  async init() {
    
  }

  async cmdStatBrick(player: OmeggaPlayer, size: string, av: number, ap: number){
    try{

    }catch (e){
      this.omegga.whisper(player, `Unable to create statistics brick.`);
    }
  }

  async stop() {
    // this.announcementTimeouts.map((timeout) => {
    //   clearTimeout(timeout);
    // });
  }
}
