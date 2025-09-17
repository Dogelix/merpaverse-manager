import { OmeggaPlugin, OL, PS, PC, OmeggaPlayer, DefinedComponents } from 'omegga';

const publicUser = {
	id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
	name: 'Generator',
};

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

  formattedMessage(msg: string) {
    return `[<b><color="#1c62d4">MERPaverse Manager</></>] ${msg}`;
  }

  async init() {
    this.omegga
      // Statistic Brick
      .on("chatcmd:dmerp-stat", (name: string, size: string, av: string, ap: string) => {
        try {
          const player = this.omegga.getPlayer(name);
          const avNo = parseInt(av);
          const apNo = parseInt(ap);

          if (Number.isNaN(avNo) || Number.isNaN(apNo)) {
            this.omegga.whisper(player, this.formattedMessage("AV or AP was not a <b>WHOLE</b> number."));
          }

          this.cmdStatBrick(player, size, avNo, apNo);
        } catch (ex) {
          console.error("An eror occured in dmerp:stat", ex);
        }
      });
  }

  async cmdStatBrick(player: OmeggaPlayer, size: string, av: number, ap: number) {
    try {
      const interactLabel = {
        bPlayInteractSound: true,
        Message: `<b>Stats</b>:
<color="#dbc60b">AV</color> : ${av}
<color="#de6b00">AP</color> : ${ap}`,
        ConsoleTag: '',
      };

      let paint = await player.getPaint();
      paint.material = "BMC_Glow";

      this.omegga.loadSaveDataOnPlayer({
        author: {
          id: publicUser.id,
          name: 'TypeScript',
        },
        bricks: [
          {
            material_index: 1,
            asset_name_index: 0,
            position: [0, 0, 0],
            size: [1, 1, 1],
            color: 0,
            components: { BCD_Interact: interactLabel }

          }
        ]
      }, player);
    } catch (e) {
      this.omegga.whisper(player, `Unable to create statistics brick.`);
    }
  }

  async stop() {
    // this.announcementTimeouts.map((timeout) => {
    //   clearTimeout(timeout);
    // });
  }
}
